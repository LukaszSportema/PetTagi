import { charmsTotalPln } from "@/lib/charm-pricing"
import type { CharmUnitPrices } from "@/lib/charm-unit-pricing"
import { ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import { rogalikBaseUnitPriceForMounting } from "@/lib/rogalik-admin-pricing"
import {
  DIAL_CODE_PRICE,
  type ItemQuantityParts,
  type ItemRevenueParts,
  type ItemRevenuePricingContext,
  type PricedOrderItem,
} from "@/lib/pricing"
import { karabinerRevenueFromOrder } from "@/lib/karabiner-pricing"
import {
  rogalikJewelryAddonRevenueParts,
  rogalikOrderUsesLegacyRogalikAddons,
} from "@/lib/rogalik-jewelry-addons"
import {
  rogalikBeadsUnitPrice,
  rogalikCordUnitPrice,
  rogalikStringSizeFromNeckCm,
} from "@/lib/rogalik-options"
import { ROGALIK_ORDER_RING_COLOR } from "@/lib/order-from-cart"

export const isRogalikRevenueItem = (item: Pick<PricedOrderItem, "ringColor" | "productSlug">) =>
  item.ringColor === ROGALIK_ORDER_RING_COLOR || item.productSlug === ROGALIK_TAG_PRODUCT.slug

export const rogalikItemRevenueParts = (
  item: PricedOrderItem,
  charmPrices?: CharmUnitPrices,
  ctx?: Pick<ItemRevenuePricingContext, "rogalikBaseUnitPricePln" | "rogalikMountingBasePrices">,
): ItemRevenueParts => {
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
  const usesLegacyAddons = rogalikOrderUsesLegacyRogalikAddons(item)
  if (!usesLegacyAddons) {
    const jewelry = rogalikJewelryAddonRevenueParts(item, charmPrices, "złoty")
    return {
      base: baseUnit * qty,
      charms: jewelry.charms * qty,
      karabiners: jewelry.karabiners * qty,
      strings: jewelry.strings * qty,
      beads: jewelry.beads * qty,
      stoppers: jewelry.stoppers * qty,
      stickers: 0,
      dialCode: item.dialCodeInfo ? DIAL_CODE_PRICE * qty : 0,
    }
  }
  const size = rogalikStringSizeFromNeckCm(item.dogNeck)
  const cordPrice = item.rogalikCordColor ? rogalikCordUnitPrice(size) ?? 0 : 0
  const beadsPrice = item.rogalikBeads ? rogalikBeadsUnitPrice(size) ?? 0 : 0
  const charmsRevenue = charmsTotalPln(item.rogalikCharms ?? [], charmPrices)
  const hasRogalikKarabinerSelection =
    item.extraCarabiner.length > 0 ||
    Boolean(item.baseCarabiner?.trim() && item.baseCarabiner !== "-")
  const karabinersRevenue = hasRogalikKarabinerSelection
    ? karabinerRevenueFromOrder(item.baseCarabiner ?? "-", item.extraCarabiner, "złoty")
    : 0

  return {
    base: baseUnit * qty,
    charms: charmsRevenue * qty,
    karabiners: karabinersRevenue * qty,
    strings: cordPrice * qty,
    beads: beadsPrice * qty,
    stoppers: 0,
    stickers: 0,
    dialCode: item.dialCodeInfo ? DIAL_CODE_PRICE * qty : 0,
  }
}

export const rogalikItemQuantityParts = (item: PricedOrderItem): ItemQuantityParts => {
  const qty = item.quantity > 0 ? item.quantity : 1
  if (!rogalikOrderUsesLegacyRogalikAddons(item)) {
    const premium = item.stringPremium?.length ?? 0
    const classic = item.stringClassic?.length ?? 0
    const glow = item.stringGlow?.length ?? 0
    const beadUnits = (item.beadNecklaceColors?.length ?? 0) > 0 ? 1 : 0
    const charmsCount = item.extraCharms?.length ?? 0
    const hasRogalikKarabinerSelection =
      item.extraCarabiner.length > 0 ||
      Boolean(item.baseCarabiner?.trim() && item.baseCarabiner !== "-")
    return {
      base: qty,
      charms: charmsCount * qty,
      karabiners: hasRogalikKarabinerSelection
        ? (item.extraCarabiner.length +
            (item.baseCarabiner?.trim() && item.baseCarabiner !== "-" ? 1 : 0)) *
          qty
        : 0,
      strings: (premium + classic + glow) * qty,
      beads: beadUnits * qty,
      stoppers: item.stoppers ? qty : 0,
      stickers: 0,
      dialCode: 0,
    }
  }
  const cordUnits = item.rogalikCordColor ? 1 : 0
  const legacyBeadUnits = item.rogalikBeads ? 1 : 0
  const hasRogalikKarabinerSelection =
    item.extraCarabiner.length > 0 ||
    Boolean(item.baseCarabiner?.trim() && item.baseCarabiner !== "-")

  return {
    base: qty,
    charms: (item.rogalikCharms?.length ?? 0) * qty,
    karabiners: hasRogalikKarabinerSelection
      ? (item.extraCarabiner.length +
          (item.baseCarabiner?.trim() && item.baseCarabiner !== "-" ? 1 : 0)) *
        qty
      : 0,
    strings: cordUnits * qty,
    beads: legacyBeadUnits * qty,
    stoppers: 0,
    stickers: 0,
    dialCode: 0,
  }
}
