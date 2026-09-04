import { CLASSIC_TAG_PRODUCT, productLineTitle } from "@/lib/catalog"
import { BASE_OPTIONS, CHARM_LABEL_OPTIONS, CLASSIC_STRING_OPTIONS, GLOW_STRING_OPTIONS, KARABINER_OPTIONS, optionLabel, PREMIUM_STRING_OPTIONS, stopperIdsFromStored, stopperSelectionLabel } from "@/lib/catalog-options"
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

export const statusLabel = (status: OrderStatus) =>
  STATUS_LABELS[status] ?? status

const optionTitle = (id: string) => optionLabel(KARABINER_OPTIONS, id)

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
  | "stringGlow"
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
  const options: OrderOption[] = []

  if (item.ringColor && item.ringColor !== "glow") {
    options.push({
      label: "Oprawa",
      values: [
        item.ringColor === "złoty"
          ? "Złoty"
          : item.ringColor === "srebrny"
            ? "Srebrny"
            : item.ringColor === "kwiat"
              ? "Kwiat"
              : item.ringColor,
      ],
    })
  }

  options.push({ label: "Baza", values: [optionLabel(BASE_OPTIONS, item.baseColor)] })
  options.push({ label: "Darmowy charms", values: [optionLabel(CHARM_LABEL_OPTIONS, item.baseCharms)] })

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
  options.push({ label: "Nr telefonu", values: [tagPhoneDisplay(item.numberOnTag, item.dialCodeInfo)] })

  return options
}
