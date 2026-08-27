export const BASE_TAG_PRICE = 50
export const EXTRA_CHARM_PRICE = 5
export const EXTRA_KARABINER_PRICE = 5
export const STOPPER_PRICE = 5
export const STICKER_PRICE = 5
export const DIAL_CODE_PRICE = 2
export const FREE_SHIPPING_THRESHOLD = 299
export const SHIPPING_PACZKOMAT_PRICE = 16.49
export const SHIPPING_KURIER_PRICE = 19.49

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

export const stringSizeFromNeckCm = (value: string | null | undefined): StringSize | null => {
  if (!value) return null
  const match = String(value).match(/(\d+(?:\.\d+)?)/)
  const cm = match ? Number(match[1]) : Number.NaN
  if (!Number.isFinite(cm) || cm <= 0) return null
  if (cm <= 25) return "S"
  if (cm <= 35) return "M"
  if (cm <= 45) return "L"
  if (cm <= 55) return "XL"
  return null
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
    base: BASE_TAG_PRICE * qty,
    charms: item.extraCharms.length * EXTRA_CHARM_PRICE * qty,
    karabiners: item.extraCarabiner.length * EXTRA_KARABINER_PRICE * qty,
    strings: (item.stringPremium.length * premiumPrice + item.stringClassic.length * classicPrice + item.stringGlow.length * glowPrice) * qty,
    stoppers: item.stoppers ? STOPPER_PRICE * qty : 0,
    stickers: item.sticker ? STICKER_PRICE * qty : 0,
    dialCode: item.dialCodeInfo ? DIAL_CODE_PRICE * qty : 0,
  }
}
