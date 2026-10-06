import { cartItemBaseUnitPrice } from "@/lib/cart-item-pricing"
import { getCatalogProduct, ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import { rogalikMountingUsesBeads, rogalikStringSizeFromNeckCm } from "@/lib/rogalik-options"
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
    ringColor: string
    baseOption: string
    charmOption: string
    wantExtraCharms: string
    extraCharms: string[]
    karabinerOption: string
    wantExtraKarabiners: string
    extraKarabiners: string[]
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

export const mapRogalikCartItemToOrderItem = (item: CartItemForOrder): CreateOrderItemInput => {
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
    baseUnitPrice: cartItemBaseUnitPrice(item),
    imageUrl: item.image,
    productSlug: item.productSlug,
    productName: item.productName,
    ringColor: ROGALIK_ORDER_RING_COLOR,
    baseColor: config.rogalikColor,
    baseCharms: PLACEHOLDER,
    extraCharms: [],
    baseCarabiner: usesBeads ? PLACEHOLDER : config.karabinerOption,
    extraCarabiner:
      !usesBeads && config.wantExtraKarabiners === "tak" ? config.extraKarabiners : [],
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
  }
}

export const mapClassicCartItemToOrderItem = (item: CartItemForOrder): CreateOrderItemInput => {
  const config = item.config
  const product = getCatalogProduct(item.productSlug)
  const skipsSticker = product?.configuratorId === "glow-tag" || config.ringColor === "kwiat"

  return {
    quantity: item.quantity,
    unitPrice: item.price,
    baseUnitPrice: cartItemBaseUnitPrice(item),
    imageUrl: item.image,
    productSlug: item.productSlug,
    productName: item.productName,
    ringColor: config.ringColor,
    baseColor: config.baseOption,
    baseCharms: config.charmOption,
    extraCharms: config.wantExtraCharms === "tak" ? config.extraCharms : [],
    baseCarabiner: config.karabinerOption,
    extraCarabiner: config.wantExtraKarabiners === "tak" ? config.extraKarabiners : [],
    stringPremium: config.wantString === "tak" ? config.premiumStrings : [],
    stringClassic: config.wantString === "tak" ? config.classicStrings : [],
    stringGlow: config.wantString === "tak" ? config.glowStrings : [],
    dogNeck:
      config.wantString === "tak" && config.stringLength ? `${config.stringLength} cm` : null,
    stoppers:
      config.wantStopers === "tak" && config.extraStopers.length > 0
        ? config.extraStopers.join(",")
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
    charmMounting: config.charmMounting,
    nameLayout: config.petName.trim().length > 6 ? "imie6plus" : config.nameLayout,
    rogalikMounting: null,
    rogalikCordColor: null,
    rogalikBeads: null,
    rogalikCharms: [],
  }
}

export const cartItemToCreateOrderItem = (item: CartItemForOrder): CreateOrderItemInput => {
  const mapped = isRogalikCartItem(item)
    ? mapRogalikCartItemToOrderItem(item)
    : mapClassicCartItemToOrderItem(item)
  return {
    ...mapped,
    baseUnitPrice: cartItemBaseUnitPrice(item),
  }
}
