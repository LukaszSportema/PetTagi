import {
  discountAmountForLines,
  discountedProductsValue,
  orderItemBaseUnitPriceFromOrder,
  roundMoney,
} from "@/lib/cart-item-pricing"
import type {
  CreateOrderItemInput,
  OrderDiscountDetails,
  OrderItemRecord,
} from "@/lib/types/order"

export type { OrderDiscountDetails }

const linesFromOrderItems = (
  items: Pick<OrderItemRecord, "unitPrice" | "quantity" | "productSlug" | "ringColor">[],
) =>
  items.map((item) => ({
    price: item.unitPrice,
    quantity: item.quantity,
    productSlug: item.productSlug,
    baseUnitPrice: orderItemBaseUnitPriceFromOrder(item),
  }))

const linesFromCreateItems = (items: CreateOrderItemInput[]) =>
  items.map((item) => ({
    price: item.unitPrice,
    quantity: item.quantity,
    productSlug: item.productSlug,
    baseUnitPrice: item.baseUnitPrice,
  }))

export const orderDiscountDetailsFromItems = (
  items: Pick<OrderItemRecord, "unitPrice" | "quantity" | "productSlug" | "ringColor">[],
  code: string,
  label: string,
  percent: number,
): OrderDiscountDetails => {
  const lines = linesFromOrderItems(items)
  const productsValueBefore = roundMoney(
    lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
  )
  const discountAmount = discountAmountForLines(lines, percent)
  return {
    code,
    label,
    percent,
    productsValueBefore,
    discountAmount,
  }
}

export const orderDiscountDetailsFromCreateItems = (
  items: CreateOrderItemInput[],
  code: string,
  label: string,
  percent: number,
): OrderDiscountDetails => {
  const lines = linesFromCreateItems(items)
  const productsValueBefore = roundMoney(
    lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
  )
  const discountAmount = discountAmountForLines(lines, percent)
  return {
    code,
    label,
    percent,
    productsValueBefore,
    discountAmount,
  }
}

/** Weryfikacja: productsValue po rabacie zgadza się z pozycjami. */
export const orderProductsValueAfterDiscount = (
  items: Pick<OrderItemRecord, "unitPrice" | "quantity" | "productSlug" | "ringColor">[],
  percent: number,
) => discountedProductsValue(linesFromOrderItems(items), percent)
