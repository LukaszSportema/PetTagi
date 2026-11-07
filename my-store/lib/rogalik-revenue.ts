import { charmsTotalPln } from "@/lib/charm-pricing"
import type { CharmUnitPrices } from "@/lib/charm-unit-pricing"
import { ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import { rogalikBaseUnitPriceForMounting } from "@/lib/rogalik-admin-pricing"
import {
  DIAL_CODE_PRICE,
  type ItemRevenuePricingContext,
  type PricedOrderItem,
} from "@/lib/pricing"
import { karabinerRevenueFromOrder } from "@/lib/karabiner-pricing"
import {
  rogalikBeadsUnitPrice,
  rogalikCordUnitPrice,
  rogalikMountingUsesBeads,
  rogalikStringSizeFromNeckCm,
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
  const cordPrice = item.rogalikCordColor ? rogalikCordUnitPrice(size) ?? 0 : 0
  const beadsPrice = item.rogalikBeads ? rogalikBeadsUnitPrice(size) ?? 0 : 0
  const charmsRevenue = charmsTotalPln(item.rogalikCharms ?? [], charmPrices)
  const hasRogalikKarabinerSelection =
    !usesBeads &&
    (item.extraCarabiner.length > 0 ||
      (item.baseCarabiner?.trim() && item.baseCarabiner !== "-"))
  const karabinersRevenue = hasRogalikKarabinerSelection
    ? karabinerRevenueFromOrder(item.baseCarabiner ?? "-", item.extraCarabiner, "złoty")
    : 0

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
  const stringUnits = (item.rogalikCordColor ? 1 : 0) + (item.rogalikBeads ? 1 : 0)
  const hasRogalikKarabinerSelection =
    !usesBeads &&
    (item.extraCarabiner.length > 0 ||
      Boolean(item.baseCarabiner?.trim() && item.baseCarabiner !== "-"))

  return {
    base: qty,
    charms: (item.rogalikCharms?.length ?? 0) * qty,
    karabiners: hasRogalikKarabinerSelection
      ? (item.extraCarabiner.length +
          (item.baseCarabiner?.trim() && item.baseCarabiner !== "-" ? 1 : 0)) *
        qty
      : 0,
    strings: stringUnits * qty,
    stoppers: 0,
    stickers: 0,
    dialCode: 0,
  }
}
