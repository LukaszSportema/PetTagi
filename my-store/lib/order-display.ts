import type { DeliveryType, OrderItemRecord, OrderStatus } from "@/lib/types/order"

export const formatPrice = (value: number) =>
  `${value.toFixed(2).replace(".", ",")} zł`

export const formatOrderDate = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export const formatAddress = (street: string, postcode: string, city: string) =>
  [street.trim(), [postcode.trim(), city.trim()].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ")

export const deliveryLabel = (type: DeliveryType) =>
  type === "paczkomat" ? "Paczkomat 24/7" : "Kurier"

export const fulfillmentLabel = (fastDelivery: boolean) =>
  fastDelivery ? "Ekspresowy (3-5 dni roboczych)" : "Standardowy (7-10 dni roboczych)"

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Oczekujące",
  paid: "Opłacone",
  processing: "W realizacji",
  shipped: "Wysłane",
  completed: "Zrealizowane",
  cancelled: "Anulowane",
}

export const statusLabel = (status: OrderStatus) =>
  STATUS_LABELS[status] ?? status

const optionTitle = (id: string) => `Podpis ${id}`

const capitalize = (value: string) =>
  value ? value.charAt(0).toLocaleUpperCase("pl-PL") + value.slice(1) : value

export type OrderOption = { label: string; values: string[] }

export type OrderItemOptionsSource = Pick<
  OrderItemRecord,
  | "ringColor"
  | "baseColor"
  | "baseCharms"
  | "extraCharms"
  | "baseCarabiner"
  | "extraCarabiner"
  | "stringPremium"
  | "stringClassic"
  | "dogNeck"
  | "stoppers"
  | "sticker"
  | "dogName"
  | "numberOnTag"
  | "dialCodeInfo"
>

const tagPhoneDisplay = (numberOnTag: string, dialCodeInfo: boolean) => {
  if (dialCodeInfo) return numberOnTag
  return numberOnTag.replace(/^\+\d{1,4}\s*/, "").trim()
}

export const orderItemOptions = (item: OrderItemOptionsSource): OrderOption[] => {
  const options: OrderOption[] = [
    {
      label: "Obręcz",
      values: [item.ringColor === "złoty" ? "Złoty" : item.ringColor === "srebrny" ? "Srebrny" : item.ringColor],
    },
    { label: "Baza", values: [optionTitle(item.baseColor)] },
    { label: "Darmowy charms", values: [optionTitle(item.baseCharms)] },
  ]

  if (item.extraCharms.length > 0) {
    options.push({ label: "Dodatkowe charms", values: item.extraCharms.map(optionTitle) })
  }

  options.push({ label: "Darmowy karabińczyk", values: [optionTitle(item.baseCarabiner)] })

  if (item.extraCarabiner.length > 0) {
    options.push({ label: "Dodatkowe karabińczyki", values: item.extraCarabiner.map(optionTitle) })
  }

  if (item.stringPremium.length > 0) {
    options.push({ label: "Sznurek Premium", values: item.stringPremium.map(optionTitle) })
  }

  if (item.stringClassic.length > 0) {
    options.push({ label: "Sznurek Klasyczny", values: item.stringClassic.map(optionTitle) })
  }

  if (item.dogNeck) {
    options.push({ label: "Obwód szyi", values: [item.dogNeck] })
  }

  if (item.stoppers) {
    options.push({ label: "Stopery", values: [capitalize(item.stoppers)] })
  }

  if (item.sticker) {
    options.push({ label: "Naklejka", values: [`Pies ${item.sticker}`] })
  }

  options.push({ label: "Imię pupila", values: [item.dogName] })
  options.push({ label: "Nr telefonu", values: [tagPhoneDisplay(item.numberOnTag, item.dialCodeInfo)] })

  return options
}
