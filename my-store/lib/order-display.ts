import { CLASSIC_TAG_PRODUCT, productLineTitle, ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import { BASE_OPTIONS, CHARM_LABEL_OPTIONS, charmMountingLabel, CLASSIC_STRING_OPTIONS, GLOW_STRING_OPTIONS, KARABINER_OPTIONS, nameLayoutLabel, optionLabel, PREMIUM_STRING_OPTIONS, stopperIdsFromStored, stopperSelectionLabel } from "@/lib/catalog-options"
import { ROGALIK_ORDER_RING_COLOR } from "@/lib/order-from-cart"
import {
  ROGALIK_BEADS_OPTIONS,
  ROGALIK_CHARM_OPTIONS,
  ROGALIK_COLOR_OPTIONS,
  ROGALIK_CORD_COLOR_OPTIONS,
  ROGALIK_MOUNTING_OPTIONS,
  rogalikMountingUsesBeads,
  rogalikOptionLabel,
} from "@/lib/rogalik-options"
import { fulfillmentRangeCompact } from "@/lib/fulfillment-dates"
import type { DeliveryType, OrderItemRecord, OrderStatus } from "@/lib/types/order"

export const formatPrice = (value: number) =>
  `${value.toFixed(2).replace(".", ",")} zł`

export const orderItemTitle = (
  item: Pick<OrderItemRecord, "dogName"> & { productName?: string | null },
) => productLineTitle(item.productName || CLASSIC_TAG_PRODUCT.name, item.dogName)

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
  fastDelivery ? "Przyspieszony (3-4 dni robocze)" : "Standardowy (6-10 dni roboczych)"

export const ringColorLabel = (ringColor: string) => {
  if (ringColor === "glow") return "Glow"
  if (ringColor === "złoty") return "Złoty"
  if (ringColor === "srebrny") return "Srebrny"
  if (ringColor === "kwiat") return "Kwiat"
  return ringColor
}

export type OrderFrameBaseSource = Pick<OrderItemRecord, "ringColor" | "baseColor" | "productSlug"> & {
  quantity?: number
}

export const isRogalikOrderItem = (
  item: Pick<OrderItemRecord, "productSlug" | "ringColor">,
) =>
  item.productSlug === ROGALIK_TAG_PRODUCT.slug || item.ringColor === ROGALIK_ORDER_RING_COLOR

export const orderItemFrameBaseLabel = (item: OrderFrameBaseSource) => {
  const suffix = item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ""
  if (isRogalikOrderItem(item)) {
    const color = rogalikOptionLabel(ROGALIK_COLOR_OPTIONS, item.baseColor)
    return `Rogalik · ${color}${suffix}`
  }
  return `${ringColorLabel(item.ringColor)} · ${optionLabel(BASE_OPTIONS, item.baseColor)}${suffix}`
}

export const orderFrameBaseLines = (items: OrderFrameBaseSource[]) =>
  items.map((item) => orderItemFrameBaseLabel(item))

export const fulfillmentRangeLabel = (fastDelivery: boolean, orderCreatedAt: string) => {
  const prefix = fastDelivery ? "Ekspresowy" : "Standardowy"
  return `${prefix} — ${fulfillmentRangeCompact(fastDelivery, new Date(orderCreatedAt))}`
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Oczekuje na płatność",
  paid: "Opłacone",
  processing: "Zalane",
  shipped: "Wysłane",
  completed: "Zrealizowane",
  cancelled: "Anulowane",
}

export const ADMIN_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "paid", label: STATUS_LABELS.paid },
  { value: "processing", label: STATUS_LABELS.processing },
  { value: "shipped", label: STATUS_LABELS.shipped },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
]

const STATUSES_BLOCKING_PENDING: OrderStatus[] = ["paid", "processing", "shipped", "completed"]

export const canSetOrderStatusToPending = (currentStatus: OrderStatus) =>
  !STATUSES_BLOCKING_PENDING.includes(currentStatus)

export const statusOptionsForOrder = (currentStatus: OrderStatus) => {
  const base =
    currentStatus === "completed"
      ? [{ value: "completed" as const, label: statusLabel("completed") }, ...ADMIN_STATUS_OPTIONS]
      : ADMIN_STATUS_OPTIONS

  if (!canSetOrderStatusToPending(currentStatus)) {
    return base.filter((option) => option.value !== "pending")
  }

  return base
}

export const statusLabel = (status: OrderStatus) =>
  STATUS_LABELS[status] ?? status

const optionTitle = (id: string) => optionLabel(KARABINER_OPTIONS, id)

const capitalize = (value: string) =>
  value ? value.charAt(0).toLocaleUpperCase("pl-PL") + value.slice(1) : value

export type OrderOption = { label: string; values: string[] }

export type OrderItemOptionsSource = Pick<
  OrderItemRecord,
  | "productSlug"
  | "ringColor"
  | "baseColor"
  | "baseCharms"
  | "extraCharms"
  | "baseCarabiner"
  | "extraCarabiner"
  | "stringPremium"
  | "stringClassic"
  | "stringGlow"
  | "dogNeck"
  | "stoppers"
  | "sticker"
  | "dogName"
  | "numberOnTag"
  | "dialCodeInfo"
  | "charmMounting"
  | "nameLayout"
  | "rogalikMounting"
  | "rogalikCordColor"
  | "rogalikBeads"
  | "rogalikCharms"
>

const tagPhoneDisplay = (numberOnTag: string, dialCodeInfo: boolean) => {
  if (dialCodeInfo) return numberOnTag
  return numberOnTag.replace(/^\+\d{1,4}\s*/, "").trim()
}

const rogalikOrderItemOptions = (item: OrderItemOptionsSource): OrderOption[] => {
  const options: OrderOption[] = []
  const mounting = item.rogalikMounting ?? ""
  const usesBeads = rogalikMountingUsesBeads(mounting)

  options.push({
    label: "Kolor rogalika",
    values: [rogalikOptionLabel(ROGALIK_COLOR_OPTIONS, item.baseColor)],
  })
  if (mounting) {
    options.push({
      label: "Mocowanie",
      values: [rogalikOptionLabel(ROGALIK_MOUNTING_OPTIONS, mounting)],
    })
  }

  if (usesBeads) {
    if (item.dogNeck) {
      options.push({ label: "Obwód szyi", values: [item.dogNeck] })
    }
    if (item.rogalikCordColor) {
      options.push({
        label: "Kolor sznureczka",
        values: [rogalikOptionLabel(ROGALIK_CORD_COLOR_OPTIONS, item.rogalikCordColor)],
      })
    }
    if (item.rogalikBeads) {
      options.push({
        label: "Koraliki",
        values: [rogalikOptionLabel(ROGALIK_BEADS_OPTIONS, item.rogalikBeads)],
      })
    }
    if (item.rogalikCharms.length > 0) {
      options.push({
        label: "Charmsy",
        values: item.rogalikCharms.map((id) => rogalikOptionLabel(ROGALIK_CHARM_OPTIONS, id)),
      })
    }
  } else {
    if (item.baseCarabiner && item.baseCarabiner !== "-") {
      options.push({ label: "Darmowy karabińczyk", values: [optionTitle(item.baseCarabiner)] })
    }
    if (item.extraCarabiner.length > 0) {
      options.push({
        label: "Dodatkowe karabińczyki",
        values: item.extraCarabiner.map(optionTitle),
      })
    }
  }

  options.push({ label: "Imię pupila", values: [item.dogName] })
  options.push({ label: "Nr telefonu", values: [item.numberOnTag] })

  return options
}

export const orderItemOptions = (item: OrderItemOptionsSource): OrderOption[] => {
  if (isRogalikOrderItem(item)) {
    return rogalikOrderItemOptions(item)
  }

  const options: OrderOption[] = []

  if (item.ringColor && item.ringColor !== "glow") {
    options.push({
      label: "Oprawa",
      values: [ringColorLabel(item.ringColor)],
    })
  }

  options.push({ label: "Baza", values: [optionLabel(BASE_OPTIONS, item.baseColor)] })
  options.push({ label: "Darmowy charms", values: [optionLabel(CHARM_LABEL_OPTIONS, item.baseCharms)] })

  if (item.charmMounting) {
    options.push({
      label: "Mocowanie charms",
      values: [charmMountingLabel(item.charmMounting)],
    })
  }

  if (item.extraCharms.length > 0) {
    options.push({ label: "Dodatkowe charms", values: item.extraCharms.map((id) => optionLabel(CHARM_LABEL_OPTIONS, id)) })
  }

  options.push({ label: "Darmowy karabińczyk", values: [optionTitle(item.baseCarabiner)] })

  if (item.extraCarabiner.length > 0) {
    options.push({ label: "Dodatkowe karabińczyki", values: item.extraCarabiner.map(optionTitle) })
  }

  if (item.stringPremium.length > 0) {
    options.push({
      label: "Sznurek Premium",
      values: item.stringPremium.map((id) => optionLabel(PREMIUM_STRING_OPTIONS, id)),
    })
  }

  if (item.stringClassic.length > 0) {
    options.push({
      label: "Sznurek Klasyczny",
      values: item.stringClassic.map((id) => optionLabel(CLASSIC_STRING_OPTIONS, id)),
    })
  }

  if (item.stringGlow.length > 0) {
    options.push({
      label: "Sznurek Glow",
      values: item.stringGlow.map((id) => optionLabel(GLOW_STRING_OPTIONS, id)),
    })
  }

  if (item.dogNeck) {
    options.push({ label: "Obwód szyi", values: [item.dogNeck] })
  }

  if (item.stoppers) {
    const stopperIds = stopperIdsFromStored(item.stoppers)
    options.push({
      label: "Stopery",
      values: [stopperIds.length > 0 ? stopperSelectionLabel(stopperIds) : item.stoppers],
    })
  }

  if (item.sticker) {
    options.push({ label: "Naklejka", values: [`Pies ${item.sticker}`] })
  }

  options.push({ label: "Imię pupila", values: [item.dogName] })

  if (item.nameLayout) {
    options.push({
      label: "Układ liter na adresówce",
      values: [nameLayoutLabel(item.nameLayout, item.dogName.trim().length)],
    })
  }

  options.push({ label: "Nr telefonu", values: [tagPhoneDisplay(item.numberOnTag, item.dialCodeInfo)] })

  return options
}
