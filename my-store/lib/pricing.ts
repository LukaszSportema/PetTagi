import { stopperCountFromStored } from "@/lib/catalog-options"

export const BASE_TAG_PRICES = {
  złoty: 60,
  srebrny: 60,
  kwiat: 61,
  glow: 61,
} as const

export const baseTagPrice = (ringColor: string) =>
  BASE_TAG_PRICES[ringColor as keyof typeof BASE_TAG_PRICES] ?? 50

/** @deprecated Użyj baseTagPrice(ringColor) */
export const BASE_TAG_PRICE = BASE_TAG_PRICES.złoty
export const EXTRA_CHARM_PRICE = 5
export const EXTRA_KARABINER_PRICE = 5
export const STOPPER_PRICE = 5
export const STICKER_PRICE = 5
export const DIAL_CODE_PRICE = 2
export const FREE_SHIPPING_THRESHOLD = 299
export const SHIPPING_PACZKOMAT_PRICE = 12
export const SHIPPING_KURIER_PRICE = 16

export const qualifiesForFreeShipping = (productsValue: number) =>
  productsValue >= FREE_SHIPPING_THRESHOLD

export const shippingCostForOrder = (productsValue: number, methodPrice: number) =>
  qualifiesForFreeShipping(productsValue) ? 0 : methodPrice

export type StringSize = "S" | "M" | "L" | "XL"

export const PREMIUM_STRING_PRICES: Record<StringSize, number> = {
  S: 9,
  M: 12,
  L: 15,
  XL: 18,
}

export const CLASSIC_STRING_PRICES: Record<StringSize, number> = {
  S: 7,
  M: 9,
  L: 11,
  XL: 13,
}

export const NECK_CIRCUMFERENCE_MIN = 15
export const NECK_CIRCUMFERENCE_MAX = 99

export const parseNeckCircumferenceCm = (value: string | null | undefined): number | null => {
  if (!value) return null
  const match = String(value).match(/(\d+(?:\.\d+)?)/)
  const cm = match ? Number(match[1]) : Number.NaN
  if (!Number.isFinite(cm)) return null
  return cm
}

export const isValidNeckCircumference = (value: string | null | undefined) => {
  const cm = parseNeckCircumferenceCm(value)
  return cm !== null && cm >= NECK_CIRCUMFERENCE_MIN && cm <= NECK_CIRCUMFERENCE_MAX
}

export const stringSizeFromNeckCm = (value: string | null | undefined): StringSize | null => {
  const cm = parseNeckCircumferenceCm(value)
  if (cm === null || cm < NECK_CIRCUMFERENCE_MIN || cm > NECK_CIRCUMFERENCE_MAX) return null
  if (cm <= 24) return "S"
  if (cm <= 34) return "M"
  if (cm <= 44) return "L"
  return "XL"
}

export const stringSizeLabel = (size: StringSize | null): string | null =>
  size ? `Rozmiar ${size}` : null

export const premiumStringUnitPrice = (size: StringSize | null): number | null =>
  size ? PREMIUM_STRING_PRICES[size] : null

export const classicStringUnitPrice = (size: StringSize | null): number | null =>
  size ? CLASSIC_STRING_PRICES[size] : null

export const glowStringUnitPrice = (size: StringSize | null): number | null =>
  premiumStringUnitPrice(size)

export type PricedOrderItem = {
  quantity: number
  ringColor?: string
  extraCharms: string[]
  extraCarabiner: string[]
  stringPremium: string[]
  stringClassic: string[]
  stringGlow: string[]
  dogNeck?: string | null
  stoppers: string | null
  sticker: string | null
  dialCodeInfo?: boolean
}

export const itemRevenueParts = (item: PricedOrderItem) => {
  const qty = item.quantity > 0 ? item.quantity : 1
  const size = stringSizeFromNeckCm(item.dogNeck)
  const premiumPrice = premiumStringUnitPrice(size) ?? 0
  const classicPrice = classicStringUnitPrice(size) ?? 0
  const glowPrice = premiumPrice
  return {
    base: baseTagPrice(item.ringColor ?? "złoty") * qty,
    charms: item.extraCharms.length * EXTRA_CHARM_PRICE * qty,
    karabiners: item.extraCarabiner.length * EXTRA_KARABINER_PRICE * qty,
    strings: (item.stringPremium.length * premiumPrice + item.stringClassic.length * classicPrice + item.stringGlow.length * glowPrice) * qty,
    stoppers: stopperCountFromStored(item.stoppers) * STOPPER_PRICE * qty,
    stickers: item.sticker ? STICKER_PRICE * qty : 0,
    dialCode: item.dialCodeInfo ? DIAL_CODE_PRICE * qty : 0,
  }
}
