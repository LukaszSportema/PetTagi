export const BASE_TAG_PRICE = 50
export const EXTRA_CHARM_PRICE = 5
export const EXTRA_KARABINER_PRICE = 5
export const STOPPER_PRICE = 5
export const STICKER_PRICE = 5
export const PREMIUM_STRING_PRICE = 8
export const CLASSIC_STRING_PRICE = 6

export type PricedOrderItem = {
  quantity: number
  extraCharms: string[]
  extraCarabiner: string[]
  stringPremium: string[]
  stringClassic: string[]
  stoppers: string | null
  sticker: string | null
}

export const itemRevenueParts = (item: PricedOrderItem) => {
  const qty = item.quantity > 0 ? item.quantity : 1
  return {
    base: BASE_TAG_PRICE * qty,
    charms: item.extraCharms.length * EXTRA_CHARM_PRICE * qty,
    karabiners: item.extraCarabiner.length * EXTRA_KARABINER_PRICE * qty,
    strings:
      (item.stringPremium.length * PREMIUM_STRING_PRICE +
        item.stringClassic.length * CLASSIC_STRING_PRICE) *
      qty,
    stoppers: item.stoppers ? STOPPER_PRICE * qty : 0,
    stickers: item.sticker ? STICKER_PRICE * qty : 0,
  }
}
