import { getCatalogProduct, ROGALIK_TAG_PRODUCT } from "@/lib/catalog"
import { ROGALIK_ORDER_RING_COLOR } from "@/lib/order-from-cart"
import type { CartItemForOrder } from "@/lib/order-from-cart"
import { baseTagPrice } from "@/lib/pricing"
import { ROGALIK_BASE_PRICE } from "@/lib/rogalik-options"

export const roundMoney = (value: number) => Math.round(value * 100) / 100

/** Cena bazowa z zapisanego wiersza zamówienia (bez pełnego config). */
export const orderItemBaseUnitPriceFromOrder = (item: {
  productSlug: string
  ringColor: string
}) => {
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
  return baseTagPrice(item.ringColor)
}

/** Cena bazowa jednej adresówki (bez dodatków) — z konfiguracji koszyka. */
export const cartItemBaseUnitPrice = (
  item: Pick<CartItemForOrder, "productSlug" | "config">,
): number => {
  const product = getCatalogProduct(item.productSlug)
  if (product?.configuratorId === "rogalik-tag" || item.productSlug === ROGALIK_TAG_PRODUCT.slug) {
    return ROGALIK_BASE_PRICE
  }
  if (product?.configuratorId === "glow-tag") {
    return baseTagPrice("glow")
  }
  return baseTagPrice(item.config.ringColor)
}

export type CartLineForDiscount = {
  price: number
  quantity: number
  productSlug: string
  baseUnitPrice: number
}

const lineBaseUnitPrice = (line: CartLineForDiscount) => line.baseUnitPrice

/** Wartość produktów po rabacie % tylko od ceny bazowej każdej pozycji. */
export const discountedProductsValue = (
  lines: CartLineForDiscount[],
  percentOff: number,
): number => {
  if (percentOff <= 0) {
    return roundMoney(lines.reduce((sum, line) => sum + line.price * line.quantity, 0))
  }
  const factor = percentOff / 100
  return roundMoney(
    lines.reduce((sum, line) => {
      const base = lineBaseUnitPrice(line)
      const unitAfter = roundMoney(line.price - roundMoney(base * factor))
      return sum + unitAfter * line.quantity
    }, 0),
  )
}

export const discountAmountForLines = (lines: CartLineForDiscount[], percentOff: number) => {
  const before = roundMoney(lines.reduce((sum, line) => sum + line.price * line.quantity, 0))
  const after = discountedProductsValue(lines, percentOff)
  return roundMoney(before - after)
}
