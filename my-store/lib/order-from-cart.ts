import { cartItemBaseUnitPrice } from "@/lib/cart-item-pricing"
import type { RogalikMountingBasePrices } from "@/lib/rogalik-admin-pricing"
import type { TagModelBasePrices } from "@/lib/tag-model-pricing"
import { getCatalogProduct, ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import { rogalikMountingUsesBeads, rogalikStringSizeFromNeckCm } from "@/lib/rogalik-options"
import {
  karabinerCatalogRingKey,
  firstRowKarabinerIds,
  karabinerQuantitiesTotal,
  orderKarabinersFromQuantities,
} from "@/lib/karabiner-pricing"
import { TAG_ONLY_WITH_KARABINER_TAG_MODEL_ID } from "@/lib/catalog-options"
import { stringSizeLabel } from "@/lib/pricing"
import type { CreateOrderItemInput } from "@/lib/types/order"

/** Wiersz order_items — rogalik vs klasyczna biżuteria. */
export const ROGALIK_ORDER_RING_COLOR = "rogalik"

const PLACEHOLDER = "-"

export type CartItemForOrder = {
  quantity: number
  price: number
  image: string
  productSlug: string
  productName: string
  config: {
    tagModel?: string
    beadNecklaceColors?: string[]
    ringColor: string
    glowTextColor?: string
    baseOption: string
    extraCharms: string[]
    wantExtraCharms: string
    karabinerOption: string
    wantExtraKarabiners: string
    extraKarabiners: string[]
    karabinerQuantities?: Record<string, number>
    wantString: string
    premiumStrings: string[]
    classicStrings: string[]
    glowStrings: string[]
    stringLength: string
    wantStopers: string
    extraStopers: string[]
    wantSticker: string
    stickerOption: string
    petName: string
    phoneNumber: string
    phoneCode: string
    includePhoneCode: string
    charmMounting: string
    nameLayout: string
    rogalikColor: string
    rogalikMounting: string
    rogalikCordColor: string
    rogalikBeads: string
    rogalikCharms: string[]
  }
}

const formatPhoneGroupsClassic = (digits: string, code: string) => {
  if (code === "+48") {
    const parts: string[] = []
    for (let i = 0; i < digits.length; i += 3) {
      parts.push(digits.slice(i, i + 3))
    }
    return parts.filter(Boolean).join(" ")
  }
  return digits
}

export const isRogalikCartItem = (item: Pick<CartItemForOrder, "productSlug">) => {
  const product = getCatalogProduct(item.productSlug)
  return product?.configuratorId === "rogalik-tag" || item.productSlug === ROGALIK_TAG_PRODUCT.slug
}

export const mapRogalikCartItemToOrderItem = (
  item: CartItemForOrder,
  tagModelBasePrices?: TagModelBasePrices,
  rogalikMountingBasePrices?: RogalikMountingBasePrices,
  legacyRogalikSingleBasePln?: number,
): CreateOrderItemInput => {
  const config = item.config
  const usesBeads = rogalikMountingUsesBeads(config.rogalikMounting)
  const stringSize = rogalikStringSizeFromNeckCm(config.stringLength)
  const sizeLabel = stringSizeLabel(stringSize)
  const dogNeck =
    usesBeads && config.stringLength.trim()
      ? sizeLabel
        ? `${config.stringLength} cm (${sizeLabel})`
        : `${config.stringLength} cm`
      : null

  return {
    quantity: item.quantity,
    unitPrice: item.price,
    baseUnitPrice: cartItemBaseUnitPrice(
      item,
      tagModelBasePrices,
      rogalikMountingBasePrices,
      legacyRogalikSingleBasePln,
    ),
    imageUrl: item.image,
    productSlug: item.productSlug,
    productName: item.productName,
    tagModel: null,
    ringColor: ROGALIK_ORDER_RING_COLOR,
    baseColor: config.rogalikColor,
    baseCharms: PLACEHOLDER,
    extraCharms: [],
    baseCarabiner: usesBeads
      ? PLACEHOLDER
      : config.karabinerQuantities &&
          Object.keys(config.karabinerQuantities).length > 0
        ? orderKarabinersFromQuantities(
            config.karabinerQuantities,
            karabinerCatalogRingKey({
              configuratorId: "rogalik-tag",
              ringColor: config.ringColor,
              glowTextColor: config.glowTextColor ?? "",
            }),
          ).baseCarabiner
        : config.karabinerOption,
    extraCarabiner: usesBeads
      ? []
      : config.karabinerQuantities &&
          Object.keys(config.karabinerQuantities).length > 0
        ? orderKarabinersFromQuantities(
            config.karabinerQuantities,
            karabinerCatalogRingKey({
              configuratorId: "rogalik-tag",
              ringColor: config.ringColor,
              glowTextColor: config.glowTextColor ?? "",
            }),
          ).extraCarabiner
        : config.wantExtraKarabiners === "tak"
          ? config.extraKarabiners
          : [],
    stringPremium: [],
    stringClassic: [],
    stringGlow: [],
    dogNeck,
    stoppers: null,
    sticker: null,
    dogName: config.petName,
    numberOnTag: config.phoneNumber.trim(),
    dialCodeInfo: false,
    charmMounting: null,
    nameLayout: null,
    rogalikMounting: config.rogalikMounting,
    rogalikCordColor: usesBeads ? config.rogalikCordColor || null : null,
    rogalikBeads: usesBeads ? config.rogalikBeads || null : null,
    rogalikCharms: usesBeads ? config.rogalikCharms : [],
    beadNecklaceColors: [],
  }
}

export const mapClassicCartItemToOrderItem = (
  item: CartItemForOrder,
  tagModelBasePrices?: TagModelBasePrices,
): CreateOrderItemInput => {
  const config = item.config
  const product = getCatalogProduct(item.productSlug)
  const skipsSticker = product?.configuratorId === "glow-tag" || config.ringColor === "kwiat"
  const karabinerRing = karabinerCatalogRingKey({
    configuratorId: product?.configuratorId,
    ringColor: config.ringColor,
    glowTextColor: config.glowTextColor ?? "",
  })
  const usesQuantityKarabiners =
    (product?.configuratorId === "classic-tag" ||
      product?.configuratorId === "glow-tag" ||
      product?.configuratorId === "rogalik-tag") &&
    config.karabinerQuantities &&
    Object.keys(config.karabinerQuantities).length > 0
  const karabiners = usesQuantityKarabiners
    ? orderKarabinersFromQuantities(config.karabinerQuantities!, karabinerRing)
    : {
        baseCarabiner: config.karabinerOption,
        extraCarabiner:
          config.wantExtraKarabiners === "tak" ? config.extraKarabiners : [],
      }

  const tagOnlyWithKarabiner = config.tagModel?.trim() === TAG_ONLY_WITH_KARABINER_TAG_MODEL_ID
  let resolvedKarabiners = karabiners
  if (tagOnlyWithKarabiner) {
    const qtyFromConfig = config.karabinerQuantities
      ? karabinerQuantitiesTotal(config.karabinerQuantities)
      : 0
    const hasStoredKarabiner =
      (resolvedKarabiners.baseCarabiner?.trim() &&
        resolvedKarabiners.baseCarabiner !== "-") ||
      resolvedKarabiners.extraCarabiner.length > 0
    if (qtyFromConfig === 0 && !hasStoredKarabiner) {
      const defaultId = firstRowKarabinerIds(karabinerRing)[0] ?? "-"
      resolvedKarabiners = { baseCarabiner: defaultId, extraCarabiner: [] }
    }
  }

  return {
    quantity: item.quantity,
    unitPrice: item.price,
    baseUnitPrice: cartItemBaseUnitPrice(item, tagModelBasePrices),
    imageUrl: item.image,
    productSlug: item.productSlug,
    productName: item.productName,
    tagModel: config.tagModel?.trim() || null,
    ringColor: config.ringColor,
    baseColor: config.baseOption,
    baseCharms: PLACEHOLDER,
    extraCharms: config.wantExtraCharms === 'tak' ? config.extraCharms : [],
    baseCarabiner: resolvedKarabiners.baseCarabiner,
    extraCarabiner: resolvedKarabiners.extraCarabiner,
    stringPremium: tagOnlyWithKarabiner ? [] : config.premiumStrings,
    stringClassic: tagOnlyWithKarabiner ? [] : config.classicStrings,
    stringGlow: tagOnlyWithKarabiner ? [] : config.glowStrings,
    dogNeck: tagOnlyWithKarabiner ? null : config.stringLength ? `${config.stringLength} cm` : null,
    stoppers: tagOnlyWithKarabiner
      ? null
      : config.wantStopers === "tak"
        ? config.extraStopers[0] ?? (karabinerRing === "srebrny" ? "2" : "1")
        : null,
    sticker: skipsSticker
      ? null
      : config.wantSticker === "tak"
        ? config.stickerOption || null
        : null,
    dogName: config.petName,
    numberOnTag:
      config.includePhoneCode === "tak"
        ? `${config.phoneCode} ${formatPhoneGroupsClassic(config.phoneNumber, config.phoneCode)}`
        : formatPhoneGroupsClassic(config.phoneNumber, config.phoneCode),
    dialCodeInfo: config.includePhoneCode === "tak",
    charmMounting: null,
    nameLayout: config.petName.trim().length > 6 ? "imie6plus" : config.nameLayout,
    rogalikMounting: null,
    rogalikCordColor: null,
    rogalikBeads: null,
    rogalikCharms: [],
    beadNecklaceColors: config.beadNecklaceColors ?? [],
  }
}

export const cartItemToCreateOrderItem = (
  item: CartItemForOrder,
  tagModelBasePrices?: TagModelBasePrices,
  rogalikMountingBasePrices?: RogalikMountingBasePrices,
  legacyRogalikSingleBasePln?: number,
): CreateOrderItemInput => {
  const mapped = isRogalikCartItem(item)
    ? mapRogalikCartItemToOrderItem(
        item,
        tagModelBasePrices,
        rogalikMountingBasePrices,
        legacyRogalikSingleBasePln,
      )
    : mapClassicCartItemToOrderItem(item, tagModelBasePrices)
  return {
    ...mapped,
    baseUnitPrice: cartItemBaseUnitPrice(
      item,
      tagModelBasePrices,
      rogalikMountingBasePrices,
      legacyRogalikSingleBasePln,
    ),
  }
}
