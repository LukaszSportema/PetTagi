import { ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import {
  EXTRA_CHARM_PRICE,
  EXTRA_KARABINER_PRICE,
  type PricedOrderItem,
} from "@/lib/pricing"
import {
  ROGALIK_BASE_PRICE,
  rogalikBeadsUnitPrice,
  rogalikCordUnitPrice,
  rogalikMountingUsesBeads,
  rogalikStringSizeFromNeckCm,
} from "@/lib/rogalik-options"
import { ROGALIK_ORDER_RING_COLOR } from "@/lib/order-from-cart"

export const isRogalikRevenueItem = (item: Pick<PricedOrderItem, "ringColor" | "productSlug">) =>
  item.ringColor === ROGALIK_ORDER_RING_COLOR || item.productSlug === ROGALIK_TAG_PRODUCT.slug

export const rogalikItemRevenueParts = (item: PricedOrderItem) => {
  const qty = item.quantity > 0 ? item.quantity : 1
  const usesBeads = rogalikMountingUsesBeads(item.rogalikMounting ?? "")
  const size = rogalikStringSizeFromNeckCm(item.dogNeck)
  const cordPrice =
    usesBeads && item.rogalikCordColor ? rogalikCordUnitPrice(size) ?? 0 : 0
  const beadsPrice = usesBeads && item.rogalikBeads ? rogalikBeadsUnitPrice(size) ?? 0 : 0
  const charmCount = usesBeads ? (item.rogalikCharms?.length ?? 0) : 0
  const karabinerCount = usesBeads ? 0 : item.extraCarabiner.length

  return {
    base: ROGALIK_BASE_PRICE * qty,
    charms: charmCount * EXTRA_CHARM_PRICE * qty,
    karabiners: karabinerCount * EXTRA_KARABINER_PRICE * qty,
    strings: (cordPrice + beadsPrice) * qty,
    stoppers: 0,
    stickers: 0,
    dialCode: 0,
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
    karabiners: (usesBeads ? 0 : item.extraCarabiner.length) * qty,
    strings: stringUnits * qty,
    stoppers: 0,
    stickers: 0,
    dialCode: 0,
  }
}
