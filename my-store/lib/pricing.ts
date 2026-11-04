import type { CharmUnitPrices } from "@/lib/charm-unit-pricing"
import { getCatalogProduct } from "@/lib/catalog"
import { charmsTotalPln } from "@/lib/charm-pricing"
import { tagModelKarabinersAllUnitsPaid } from "@/lib/catalog-options"
import {
  inferGlowTextColorFromKarabiners,
  karabinerCatalogRingKey,
  karabinerQuantitiesFromOrder,
  karabinerQuantitiesTotal,
  karabinerRevenueFromOrder,
  type KarabinerPricingOptions,
} from "@/lib/karabiner-pricing"
import { classicTagBaseUnitPrice, type TagModelBasePrices } from "@/lib/tag-model-pricing"
export { EXTRA_CHARM_PRICE } from "@/lib/pricing-constants"

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

export const EXTRA_KARABINER_PRICE = 5
export const STOPPER_PRICE = 6
export const STICKER_PRICE = 5
export const DIAL_CODE_PRICE = 2
export const FREE_SHIPPING_THRESHOLD = 299
export const SHIPPING_PACZKOMAT_PRICE = 12
export const SHIPPING_KURIER_PRICE = 16
export const FAST_DELIVERY_COST = 10

export const fastDeliveryCostForOrder = (tagCount: number, fastDelivery: boolean) =>
  fastDelivery ? Math.max(0, tagCount) * FAST_DELIVERY_COST : 0

export const qualifiesForFreeShipping = (productsValue: number) =>
  productsValue >= FREE_SHIPPING_THRESHOLD

export const amountUntilFreeShipping = (productsValue: number) =>
  Math.max(0, FREE_SHIPPING_THRESHOLD - productsValue)

export const freeShippingProgressPercent = (productsValue: number) =>
  Math.min(100, Math.max(0, (productsValue / FREE_SHIPPING_THRESHOLD) * 100))

export const freeShippingRemainingPercent = (productsValue: number) =>
  Math.max(0, 100 - freeShippingProgressPercent(productsValue))

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

/** Wiersz w podsumowaniu / koszyku / mailu, np. „Cappuccino (+12 zł)”. */
export const stringSummaryLine = (label: string, unitPrice: number | null): string => {
  const name = label.trim()
  if (!name) return name
  return unitPrice != null ? `${name} (+${unitPrice} zł)` : name
}

export type PricedOrderItem = {
  quantity: number
  productSlug?: string
  tagModel?: string | null
  ringColor?: string
  baseCarabiner?: string
  extraCharms: string[]
  extraCarabiner: string[]
  stringPremium: string[]
  stringClassic: string[]
  stringGlow: string[]
  dogNeck?: string | null
  stoppers: string | null
  sticker: string | null
  dialCodeInfo?: boolean
  rogalikMounting?: string | null
  rogalikCordColor?: string | null
  rogalikBeads?: string | null
  rogalikCharms?: string[]
}

export type ItemRevenuePricingContext = {
  charmPrices?: CharmUnitPrices
  tagModelBasePrices?: TagModelBasePrices
}

const jewelryKarabinerRingForRevenue = (item: PricedOrderItem) => {
  const productSlug = item.productSlug?.trim() ?? ""
  const product = productSlug ? getCatalogProduct(productSlug) : null
  const configuratorId = product?.configuratorId
  const ringColor = item.ringColor ?? "złoty"
  const glowTextColor =
    configuratorId === "glow-tag"
      ? inferGlowTextColorFromKarabiners(item.baseCarabiner ?? "-", item.extraCarabiner)
      : ""
  return karabinerCatalogRingKey({ configuratorId, ringColor, glowTextColor })
}

export const itemRevenueParts = (
  item: PricedOrderItem,
  ctx: ItemRevenuePricingContext = {},
) => {
  const qty = item.quantity > 0 ? item.quantity : 1
  const size = stringSizeFromNeckCm(item.dogNeck)
  const premiumPrice = premiumStringUnitPrice(size) ?? 0
  const classicPrice = classicStringUnitPrice(size) ?? 0
  const glowPrice = premiumPrice
  const productSlug = item.productSlug?.trim() ?? ""
  const ringColor = item.ringColor ?? "złoty"
  const baseUnit =
    productSlug && getCatalogProduct(productSlug)?.configuratorId === "classic-tag"
      ? classicTagBaseUnitPrice({
          tagModel: item.tagModel,
          ringColor,
          tagModelBasePrices: ctx.tagModelBasePrices,
        })
      : baseTagPrice(ringColor === "glow" ? "glow" : ringColor)

  const karabinerRing = jewelryKarabinerRingForRevenue(item)
  const skipStringKarabiner = tagModelSkipsStringAndKarabinerAddonCharges(item.tagModel)
  const karabinerOpts: KarabinerPricingOptions | undefined = tagModelKarabinersAllUnitsPaid(
    item.tagModel,
  )
    ? { allUnitsPaid: true }
    : undefined

  return {
    base: baseUnit * qty,
    charms: charmsTotalPln(item.extraCharms, ctx.charmPrices) * qty,
    karabiners: skipStringKarabiner
      ? 0
      : karabinerRevenueFromOrder(
          item.baseCarabiner ?? "-",
          item.extraCarabiner,
          karabinerRing,
          karabinerOpts,
        ) * qty,
    strings: skipStringKarabiner
      ? 0
      : (item.stringPremium.length * premiumPrice +
          item.stringClassic.length * classicPrice +
          item.stringGlow.length * glowPrice) *
        qty,
    stoppers: skipStringKarabiner ? 0 : item.stoppers ? STOPPER_PRICE * qty : 0,
    stickers: item.sticker ? STICKER_PRICE * qty : 0,
    dialCode: item.dialCodeInfo ? DIAL_CODE_PRICE * qty : 0,
  }
}

export const itemQuantityParts = (item: PricedOrderItem) => {
  const qty = item.quantity > 0 ? item.quantity : 1
  const stringCount =
    item.stringPremium.length + item.stringClassic.length + item.stringGlow.length
  return {
    base: qty,
    charms: item.extraCharms.length * qty,
    karabiners:
      karabinerQuantitiesTotal(
        karabinerQuantitiesFromOrder(item.baseCarabiner ?? "-", item.extraCarabiner),
      ) * qty,
    strings: stringCount * qty,
    stoppers: item.stoppers ? qty : 0,
    stickers: item.sticker ? qty : 0,
    dialCode: item.dialCodeInfo ? qty : 0,
  }
}
