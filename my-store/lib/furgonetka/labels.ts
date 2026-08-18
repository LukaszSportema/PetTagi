import { randomUUID } from "crypto"
import type { OrderDetail } from "@/lib/types/order"
import { FurgonetkaError, furgonetkaRequest } from "@/lib/furgonetka/client"

type AccountService = {
  id: number
  service: string
  name?: string
}

type PackagePayload = {
  pickup: Record<string, string>
  receiver: Record<string, string>
  service_id: number
  additional_services?: Record<string, string | boolean>
  parcels: Array<{
    height: number
    width: number
    depth: number
    weight: number
    quantity: number
    type: "package"
  }>
  user_reference_number: string
}

type PostalAddress = {
  street: string
  city: string
  postcode: string
}

const formatPostcode = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 5)
  if (digits.length !== 5) return value.trim()
  return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

const withBuildingNumber = (street: string, buildingNumber?: string | null) => {
  const streetName = street.trim()
  const building = buildingNumber?.trim() ?? ""
  if (building && !new RegExp(`\\b${building.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(streetName)) {
    return `${streetName} ${building}`.trim()
  }
  if (/\d/.test(streetName)) return streetName
  return streetName
}

const splitCustomerStreet = (value: string) => {
  const street = value.trim()
  const match = street.match(/^(.*?)[\s,]+(\d+\s*[a-zA-Z]?(?:\s*[/\s]\s*\d+[a-zA-Z]?)?)$/)
  if (!match) return street
  return `${match[1].trim()} ${match[2].replace(/\s+/g, "")}`
}

const digitsPhone = (value: string) => {
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("48") && digits.length >= 11) digits = digits.slice(-9)
  if (digits.startsWith("0") && digits.length === 10) digits = digits.slice(1)
  return digits
}

const POLISH_MOBILE_PREFIX = /^(45|50|51|53|57|60|66|69|72|73|78|79|83|88)\d{7}$/

const assertInpostPhone = (phone: string) => {
  if (!POLISH_MOBILE_PREFIX.test(phone)) {
    throw new FurgonetkaError(
      "InPost Paczkomat wymaga 9-cyfrowego numeru komórkowego odbiorcy (np. 500 600 700), bez numeru stacjonarnego.",
    )
  }
}

type InpostPointResponse = {
  name?: string
  address?: { line1?: string; line2?: string }
  address_details?: {
    city?: string
    post_code?: string
    street?: string
    building_number?: string
  }
  location?: { latitude?: number; longitude?: number }
}

const fetchShipXLocker = async (pointName: string) => {
  const response = await fetch(
    `https://api-shipx-pl.easypack24.net/v1/points/${encodeURIComponent(pointName)}`,
    { headers: { Accept: "application/json" }, cache: "no-store" },
  )
  if (!response.ok) {
    throw new FurgonetkaError(`Nie znaleziono paczkomatu ${pointName} w InPost.`)
  }

  const point = (await response.json()) as InpostPointResponse
  const details = point.address_details ?? {}
  const street = withBuildingNumber(details.street || point.address?.line1 || "", details.building_number)
  const city = details.city?.trim() ?? ""
  const postcode = formatPostcode(details.post_code || "")

  if (!street || !city || postcode.replace(/\D/g, "").length !== 5) {
    throw new FurgonetkaError(`Paczkomat ${pointName} nie ma kompletnego adresu w InPost.`)
  }

  return {
    name: point.name?.trim() || pointName,
    street,
    city,
    postcode,
  }
}

const fetchLockerAddress = async (pointName: string): Promise<PostalAddress> => {
  const locker = await fetchShipXLocker(pointName)
  return { street: locker.street, city: locker.city, postcode: locker.postcode }
}

const DEFAULT_DROPOFF_POINT = "POP-WAW500"

const resolveDropoffPointCode = () =>
  (process.env.FURGONETKA_DROPOFF_POINT?.trim() || DEFAULT_DROPOFF_POINT).toUpperCase()

const customerAddress = (order: OrderDetail): PostalAddress => ({
  street: splitCustomerStreet(order.clientAddress),
  city: order.clientCity.trim(),
  postcode: formatPostcode(order.clientPostcode),
})

const envNumber = (key: string, fallback: number) => {
  const raw = process.env[key]
  const value = raw ? Number(raw) : fallback
  return Number.isFinite(value) ? value : fallback
}

const senderAddress = () => {
  const name = process.env.FURGONETKA_SENDER_NAME
  const email = process.env.FURGONETKA_SENDER_EMAIL
  const phone = process.env.FURGONETKA_SENDER_PHONE
  const street = process.env.FURGONETKA_SENDER_STREET
  const postcode = process.env.FURGONETKA_SENDER_POSTCODE
  const city = process.env.FURGONETKA_SENDER_CITY

  if (!name || !email || !phone || !street || !postcode || !city) {
    throw new FurgonetkaError(
      "Uzupełnij dane nadawcy Furgonetki w .env.local (FURGONETKA_SENDER_*).",
    )
  }

  return {
    name,
    company: process.env.FURGONETKA_SENDER_COMPANY ?? "",
    email,
    phone: digitsPhone(phone),
    street: splitCustomerStreet(street),
    city: city.trim(),
    country_code: "PL",
    postcode: formatPostcode(postcode),
    county: "",
  }
}

const pickServiceId = (services: AccountService[], deliveryType: OrderDetail["deliveryType"]) => {
  if (deliveryType === "paczkomat") {
    const locker =
      services.find((item) => item.service === "inpost" && !/kurier/i.test(item.name ?? "")) ??
      services.find((item) => item.service === "inpost")
    if (!locker) {
      throw new FurgonetkaError("Na koncie Furgonetki nie ma usługi InPost Paczkomat.")
    }
    return locker.id
  }

  const courier =
    services.find((item) => item.service === "inpostkurier") ??
    services.find((item) => item.service === "inpost" && /kurier/i.test(item.name ?? "")) ??
    services.find((item) => item.service === "inpost")
  if (!courier) {
    throw new FurgonetkaError("Na koncie Furgonetki nie ma usługi InPost Kurier.")
  }
  return courier.id
}

const buildPackage = async (order: OrderDetail, serviceId: number): Promise<PackagePayload> => {
  const additionalServices: Record<string, string | boolean> = {
    digital_label: true,
  }
  const phone = digitsPhone(order.clientPhone)
  let address = customerAddress(order)
  const identity = senderAddress()
  const dropoffCode = resolveDropoffPointCode()

  if (order.deliveryType === "paczkomat") {
    const point = order.inpostId?.trim()
    if (!point) {
      throw new FurgonetkaError("Brak numeru paczkomatu w zamówieniu.")
    }
    additionalServices.point = point
    address = await fetchLockerAddress(point)
    assertInpostPhone(phone)
  }

  const payload: PackagePayload = {
    pickup: {
      ...identity,
      point: dropoffCode,
    },
    receiver: {
      name: `${order.clientName} ${order.clientSurname}`.trim(),
      company: "",
      email: order.clientEmail,
      phone,
      street: address.street,
      city: address.city,
      country_code: "PL",
      postcode: address.postcode,
      county: "",
    },
    service_id: serviceId,
    parcels: [
      {
        width: envNumber("FURGONETKA_PARCEL_WIDTH", 15),
        height: envNumber("FURGONETKA_PARCEL_HEIGHT", 8),
        depth: envNumber("FURGONETKA_PARCEL_DEPTH", 10),
        weight: envNumber("FURGONETKA_PARCEL_WEIGHT", 0.3),
        quantity: 1,
        type: "package",
      },
    ],
    user_reference_number: order.orderId,
  }

  if (Object.keys(additionalServices).length > 0) {
    payload.additional_services = additionalServices
  }

  return payload
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const acceptRegulations = async () => {
  const list = await furgonetkaRequest({ method: "GET", path: "/regulations" })
  const regulations = (
    list.json && typeof list.json === "object" && "regulations" in list.json
      ? (list.json as { regulations?: Array<Record<string, unknown>> }).regulations
      : []
  ) ?? []

  const pending = regulations.flatMap((item) => {
    const service = typeof item.service === "string" ? item.service.trim() : ""
    const version = typeof item.version === "string" ? item.version.trim() : ""
    const datetime = typeof item.datetime === "string" ? item.datetime.trim() : ""
    if (!service || !version || !datetime || item.accepted === true) return []
    return [{ service, version, datetime, accepted: true }]
  })
  if (!pending.length) return

  await furgonetkaRequest({
    method: "POST",
    path: "/regulations",
    body: { regulations: pending },
  })
}

const waitForOrderCommand = async (uuid: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await furgonetkaRequest({ method: "GET", path: `/order-commands/${uuid}` })
    const status =
      result.json && typeof result.json === "object" && "status" in result.json
        ? String((result.json as { status?: string }).status)
        : ""

    if (status === "successful") return result.json
    if (status === "partial_success" || status === "error") {
      throw new FurgonetkaError(`Zamówienie przesyłki w Furgonetce nie powiodło się (${status}).`, result.status, result.json)
    }
    await sleep(1000)
  }

  throw new FurgonetkaError("Przekroczono czas oczekiwania na kod nadania Furgonetki.")
}

const pushCodeCandidate = (values: string[], value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    const code = String(value).trim()
    if (code) values.push(code)
  }
}

const pickDropoffCode = (json: unknown): string => {
  const record = json && typeof json === "object" ? (json as Record<string, unknown>) : {}
  const candidates: string[] = []

  pushCodeCandidate(candidates, record.package_no)
  pushCodeCandidate(candidates, record.package_number)
  pushCodeCandidate(candidates, record.shipment_code)
  pushCodeCandidate(candidates, record.shipmentCode)

  if (typeof record.tracking === "string" || typeof record.tracking === "number") {
    pushCodeCandidate(candidates, record.tracking)
  } else if (record.tracking && typeof record.tracking === "object") {
    const tracking = record.tracking as Record<string, unknown>
    pushCodeCandidate(candidates, tracking.number)
    pushCodeCandidate(candidates, tracking.package_no)
  }

  if (record.additional_services && typeof record.additional_services === "object") {
    const services = record.additional_services as Record<string, unknown>
    if (typeof services.digital_label === "string") pushCodeCandidate(candidates, services.digital_label)
    pushCodeCandidate(candidates, services.shipment_code)
    pushCodeCandidate(candidates, services.shipmentCode)
  }

  if (Array.isArray(record.parcels)) {
    for (const item of record.parcels) {
      if (!item || typeof item !== "object") continue
      const parcel = item as Record<string, unknown>
      pushCodeCandidate(candidates, parcel.package_no)
      pushCodeCandidate(candidates, parcel.number)
      pushCodeCandidate(candidates, parcel.shipment_code)
    }
  }

  const nineDigit = candidates.find((code) => /^\d{9}$/.test(code.replace(/\s/g, "")))
  if (nineDigit) return nineDigit.replace(/\s/g, "")
  return candidates[0] ?? ""
}

const waitForDropoffCode = async (packageId: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await furgonetkaRequest({ method: "GET", path: `/packages/${packageId}` })
    const code = pickDropoffCode(result.json)
    if (code) return code
    await sleep(1000)
  }

  throw new FurgonetkaError("Furgonetka nie zwróciła kodu nadania InPost. Spróbuj ponownie za chwilę.")
}

export async function createInpostDropoffCode(order: OrderDetail): Promise<{ code: string }> {
  const servicesResponse = await furgonetkaRequest({ method: "GET", path: "/account/services" })
  const services = (
    servicesResponse.json && typeof servicesResponse.json === "object" && "services" in servicesResponse.json
      ? (servicesResponse.json as { services?: AccountService[] }).services
      : []
  ) ?? []

  const payload = await buildPackage(order, pickServiceId(services, order.deliveryType))

  await furgonetkaRequest({
    method: "POST",
    path: "/packages/validate",
    body: payload,
    version: "v2",
  })

  const created = await furgonetkaRequest({
    method: "POST",
    path: "/packages",
    body: payload,
    version: "v2",
  })
  const packageId =
    created.json && typeof created.json === "object" && "package_id" in created.json
      ? String((created.json as { package_id?: string | number }).package_id)
      : ""
  if (!packageId) {
    throw new FurgonetkaError("Furgonetka nie zwróciła identyfikatora przesyłki.")
  }

  await acceptRegulations()

  const commandId = randomUUID()
  await furgonetkaRequest({
    method: "PUT",
    path: `/order-commands/${commandId}`,
    body: {
      packages: [{ id: packageId }],
    },
  })
  await waitForOrderCommand(commandId)

  return { code: await waitForDropoffCode(packageId) }
}
