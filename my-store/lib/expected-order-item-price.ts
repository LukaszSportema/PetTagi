import { charmsTotalPln } from "@/lib/charm-pricing"
import type { CharmUnitPrices } from "@/lib/charm-unit-pricing"
import { getCatalogProduct, ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import { roundMoney } from "@/lib/cart-item-pricing"
import {
  inferGlowTextColorFromKarabiners,
  karabinerCatalogRingKey,
  karabinerRevenueFromOrder,
} from "@/lib/karabiner-pricing"
import { isRogalikRevenueItem, rogalikItemRevenueParts } from "@/lib/rogalik-revenue"
import { ROGALIK_BASE_PRICE } from "@/lib/rogalik-options"
import { ROGALIK_ORDER_RING_COLOR } from "@/lib/order-from-cart"
import {
  baseTagPrice,
  classicStringUnitPrice,
  DIAL_CODE_PRICE,
  glowStringUnitPrice,
  premiumStringUnitPrice,
  STOPPER_PRICE,
  stickerUnitPricePln,
  stringSizeFromNeckCm,
  type PricedOrderItem,
} from "@/lib/pricing"
import { classicTagBaseUnitPrice, type TagModelBasePrices } from "@/lib/tag-model-pricing"
import { BEAD_NECKLACE_TAG_MODEL_ID, tagModelKarabinersAllUnitsPaid, tagModelSkipsStringAndStopperAddonCharges } from "@/lib/catalog-options"
import { beadNecklaceCostPln } from "@/lib/bead-necklace-pricing"
import type { CreateOrderItemInput } from "@/lib/types/order"

export type OrderPricingContext = {
  charmPrices?: CharmUnitPrices
  tagModelBasePrices?: TagModelBasePrices
}

const jewelryKarabinerRingKey = (item: CreateOrderItemInput) => {
  const product = getCatalogProduct(item.productSlug)
  const configuratorId = product?.configuratorId
  const glowTextColor =
    configuratorId === "glow-tag"
      ? inferGlowTextColorFromKarabiners(item.baseCarabiner, item.extraCarabiner)
      : ""
  return karabinerCatalogRingKey({
    configuratorId,
    ringColor: item.ringColor,
    glowTextColor,
  })
}

export const expectedOrderItemBaseUnitPrice = (
  item: CreateOrderItemInput,
  ctx: OrderPricingContext = {},
): number => {
  const product = getCatalogProduct(item.productSlug)
  if (
    product?.configuratorId === "rogalik-tag" ||
    item.productSlug === ROGALIK_TAG_PRODUCT.slug ||
    item.ringColor === ROGALIK_ORDER_RING_COLOR
  ) {
    return ROGALIK_BASE_PRICE
  }
  if (product?.configuratorId === "glow-tag") {
    return baseTagPrice("glow")
  }
  if (product?.configuratorId === "classic-tag") {
    return classicTagBaseUnitPrice({
      tagModel: item.tagModel,
      ringColor: item.ringColor,
      tagModelBasePrices: ctx.tagModelBasePrices,
    })
  }
  return baseTagPrice(item.ringColor)
}

const toPricedItem = (item: CreateOrderItemInput): PricedOrderItem => ({
  quantity: item.quantity,
  productSlug: item.productSlug,
  tagModel: item.tagModel,
  ringColor: item.ringColor,
  baseCarabiner: item.baseCarabiner,
  extraCharms: item.extraCharms,
  extraCarabiner: item.extraCarabiner,
  stringPremium: item.stringPremium,
  stringClassic: item.stringClassic,
  stringGlow: item.stringGlow,
  dogNeck: item.dogNeck,
  stoppers: item.stoppers,
  sticker: item.sticker,
  dialCodeInfo: item.dialCodeInfo,
  rogalikMounting: item.rogalikMounting,
  rogalikCordColor: item.rogalikCordColor,
  rogalikBeads: item.rogalikBeads,
  rogalikCharms: item.rogalikCharms,
  beadNecklaceColors: item.beadNecklaceColors,
})

export const expectedOrderItemUnitPrice = (
  item: CreateOrderItemInput,
  ctx: OrderPricingContext = {},
): number => {
  if (isRogalikRevenueItem({ ringColor: item.ringColor, productSlug: item.productSlug })) {
    const qty = Math.max(1, item.quantity)
    const parts = rogalikItemRevenueParts(toPricedItem(item), ctx.charmPrices)
    const lineTotal =
      parts.base + parts.charms + parts.karabiners + parts.strings + parts.dialCode
    return roundMoney(lineTotal / qty)
  }

  const product = getCatalogProduct(item.productSlug)
  const base = expectedOrderItemBaseUnitPrice(item, ctx)
  const size = stringSizeFromNeckCm(item.dogNeck)
  const premiumPrice = premiumStringUnitPrice(size) ?? 0
  const classicPrice = classicStringUnitPrice(size) ?? 0
  const glowPrice = glowStringUnitPrice(size) ?? 0

  const charms = charmsTotalPln(item.extraCharms, ctx.charmPrices)
  const karabinerRing = jewelryKarabinerRingKey(item)
  const skipStringsStopers = tagModelSkipsStringAndStopperAddonCharges(item.tagModel)
  const karabinerOpts = tagModelKarabinersAllUnitsPaid(item.tagModel)
    ? { allUnitsPaid: true as const }
    : undefined
  const karabiners = karabinerRevenueFromOrder(
    item.baseCarabiner,
    item.extraCarabiner,
    karabinerRing,
    karabinerOpts,
  )
  const strings = skipStringsStopers
    ? 0
    : item.stringPremium.length * premiumPrice +
      item.stringClassic.length * classicPrice +
      item.stringGlow.length * glowPrice
  const stoppers = skipStringsStopers ? 0 : item.stoppers ? STOPPER_PRICE : 0
  const skipsSticker = product?.configuratorId === "glow-tag" || item.ringColor === "kwiat"
  const stickers = !skipsSticker && item.sticker ? stickerUnitPricePln(item.sticker) : 0
  const dialCode = item.dialCodeInfo ? DIAL_CODE_PRICE : 0
  const beadNecklace =
    item.tagModel === BEAD_NECKLACE_TAG_MODEL_ID
      ? beadNecklaceCostPln(size, item.beadNecklaceColors?.length ?? 0)
      : 0

  return roundMoney(
    base + charms + karabiners + strings + stoppers + stickers + dialCode + beadNecklace,
  )
}
