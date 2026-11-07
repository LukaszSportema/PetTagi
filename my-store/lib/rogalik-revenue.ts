import { charmsTotalPln } from "@/lib/charm-pricing"
import type { CharmUnitPrices } from "@/lib/charm-unit-pricing"
import { ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import { rogalikBaseUnitPriceForMounting } from "@/lib/rogalik-admin-pricing"
import {
  EXTRA_KARABINER_PRICE,
  DIAL_CODE_PRICE,
  type ItemRevenuePricingContext,
  type PricedOrderItem,
} from "@/lib/pricing"
import {
  rogalikBeadsUnitPrice,
  rogalikCordUnitPrice,
  rogalikMountingUsesBeads,
  rogalikMountingUsesKarabinczyk,
  rogalikStringSizeFromNeckCm,
  ROGALIK_MOUNTING_KARABINER_PRICE,
} from "@/lib/rogalik-options"
import { ROGALIK_ORDER_RING_COLOR } from "@/lib/order-from-cart"

export const isRogalikRevenueItem = (item: Pick<PricedOrderItem, "ringColor" | "productSlug">) =>
  item.ringColor === ROGALIK_ORDER_RING_COLOR || item.productSlug === ROGALIK_TAG_PRODUCT.slug

export const rogalikItemRevenueParts = (
  item: PricedOrderItem,
  charmPrices?: CharmUnitPrices,
  ctx?: Pick<ItemRevenuePricingContext, "rogalikBaseUnitPricePln" | "rogalikMountingBasePrices">,
) => {
  const qty = item.quantity > 0 ? item.quantity : 1
  const rogalikMountingBasePrices = ctx?.rogalikMountingBasePrices
  const legacySingleBase = ctx?.rogalikBaseUnitPricePln
  const baseUnit =
    typeof item.rogalikBaseUnitPln === "number" &&
    Number.isFinite(item.rogalikBaseUnitPln) &&
    item.rogalikBaseUnitPln >= 0
      ? item.rogalikBaseUnitPln
      : typeof legacySingleBase === "number" &&
          Number.isFinite(legacySingleBase) &&
          legacySingleBase >= 0
        ? legacySingleBase
        : rogalikBaseUnitPriceForMounting(item.rogalikMounting, rogalikMountingBasePrices)
  const usesBeads = rogalikMountingUsesBeads(item.rogalikMounting ?? "")
  const size = rogalikStringSizeFromNeckCm(item.dogNeck)
  const cordPrice =
    usesBeads && item.rogalikCordColor ? rogalikCordUnitPrice(size) ?? 0 : 0
  const beadsPrice = usesBeads && item.rogalikBeads ? rogalikBeadsUnitPrice(size) ?? 0 : 0
  const charmsRevenue = usesBeads
    ? charmsTotalPln(item.rogalikCharms ?? [], charmPrices)
    : 0
  const includedKarabiner = !usesBeads && rogalikMountingUsesKarabinczyk(item.rogalikMounting ?? "")
  const extraKarabinerCount = usesBeads ? 0 : item.extraCarabiner.length
  const karabinersRevenue =
    (includedKarabiner ? ROGALIK_MOUNTING_KARABINER_PRICE : 0) +
    extraKarabinerCount * EXTRA_KARABINER_PRICE

  return {
    base: baseUnit * qty,
    charms: charmsRevenue * qty,
    karabiners: karabinersRevenue * qty,
    strings: (cordPrice + beadsPrice) * qty,
    stoppers: 0,
    stickers: 0,
    dialCode: item.dialCodeInfo ? DIAL_CODE_PRICE * qty : 0,
  }
}

export const rogalikItemQuantityParts = (item: PricedOrderItem) => {
  const qty = item.quantity > 0 ? item.quantity : 1
  const usesBeads = rogalikMountingUsesBeads(item.rogalikMounting ?? "")
  const stringUnits =
    (usesBeads && item.rogalikCordColor ? 1 : 0) + (usesBeads && item.rogalikBeads ? 1 : 0)

  return {
    base: qty,
    charms: (usesBeads ? (item.rogalikCharms?.length ?? 0) : 0) * qty,
    karabiners:
      ((usesBeads ? 0 : item.extraCarabiner.length) +
        (!usesBeads && rogalikMountingUsesKarabinczyk(item.rogalikMounting ?? "") ? 1 : 0)) *
      qty,
    strings: stringUnits * qty,
    stoppers: 0,
    stickers: 0,
    dialCode: 0,
  }
}
