import { itemQuantityParts, itemRevenueParts, type ItemRevenuePricingContext, type PricedOrderItem } from "@/lib/pricing"
import {
  isRogalikRevenueItem,
  rogalikItemQuantityParts,
  rogalikItemRevenueParts,
} from "@/lib/rogalik-revenue"

const revenuePartsForItem = (item: PricedOrderItem, ctx: RevenuePricingContext) =>
  isRogalikRevenueItem(item)
    ? rogalikItemRevenueParts(item, ctx.charmPrices, ctx)
    : itemRevenueParts(item, ctx)

const quantityPartsForItem = (item: PricedOrderItem) =>
  isRogalikRevenueItem(item) ? rogalikItemQuantityParts(item) : itemQuantityParts(item)
import { inPeriod, reportPeriods, warsawYmd, type ReportPeriod } from "@/lib/report-periods"

import type { PaymentRecipientId } from "@/lib/payment"

export type RevenueOrder = {
  /** Data przypisania do okresu (Warszawa): paid_at od PT-20261031-0146, wcześniejsze — reguła hybrid. */
  revenueAt: string
  paymentRecipient: PaymentRecipientId
  total: number
  shippingCost: number
  fastDeliveryCost: number
  items: PricedOrderItem[]
}

export type RevenuePricingContext = ItemRevenuePricingContext

export type RevenueTotals = {
  total: number
  base: number
  charms: number
  karabiners: number
  strings: number
  beads: number
  stoppers: number
  stickers: number
  dialCode: number
  express: number
  shipping: number
}

export type RevenueRow = RevenueTotals & {
  key: string
  label: string
}

const emptyTotals = (): RevenueTotals => ({
  total: 0,
  base: 0,
  charms: 0,
  karabiners: 0,
  strings: 0,
  beads: 0,
  stoppers: 0,
  stickers: 0,
  dialCode: 0,
  express: 0,
  shipping: 0,
})

const roundMoney = (value: number) => Math.round(value * 100) / 100

const roundTotals = (totals: RevenueTotals): RevenueTotals => ({
  total: roundMoney(totals.total),
  base: roundMoney(totals.base),
  charms: roundMoney(totals.charms),
  karabiners: roundMoney(totals.karabiners),
  strings: roundMoney(totals.strings),
  beads: roundMoney(totals.beads),
  stoppers: roundMoney(totals.stoppers),
  stickers: roundMoney(totals.stickers),
  dialCode: roundMoney(totals.dialCode),
  express: roundMoney(totals.express),
  shipping: roundMoney(totals.shipping),
})

const addOrder = (totals: RevenueTotals, order: RevenueOrder, ctx: RevenuePricingContext) => {
  totals.total += order.total
  totals.express += order.fastDeliveryCost
  totals.shipping += order.shippingCost
  for (const item of order.items) {
    const parts = revenuePartsForItem(item, ctx)
    totals.base += parts.base
    totals.charms += parts.charms
    totals.karabiners += parts.karabiners
    totals.strings += parts.strings
    totals.beads += parts.beads
    totals.stoppers += parts.stoppers
    totals.stickers += parts.stickers
    totals.dialCode += parts.dialCode
  }
}

const totalsForPeriod = (
  period: ReportPeriod,
  orders: RevenueOrder[],
  ctx: RevenuePricingContext,
) => {
  const totals = emptyTotals()
  for (const order of orders) {
    if (inPeriod(warsawYmd(order.revenueAt), period)) addOrder(totals, order, ctx)
  }
  return roundTotals(totals)
}

const addOrderQuantity = (totals: RevenueTotals, order: RevenueOrder) => {
  let tagQty = 0
  for (const item of order.items) {
    tagQty += item.quantity > 0 ? item.quantity : 1
    const parts = quantityPartsForItem(item)
    totals.base += parts.base
    totals.charms += parts.charms
    totals.karabiners += parts.karabiners
    totals.strings += parts.strings
    totals.beads += parts.beads
    totals.stoppers += parts.stoppers
    totals.stickers += parts.stickers
    totals.dialCode += parts.dialCode
  }
  if (order.fastDeliveryCost > 0) totals.express += tagQty
  if (order.shippingCost > 0) totals.shipping += 1
}

const totalsForQuantityPeriod = (period: ReportPeriod, orders: RevenueOrder[]) => {
  const totals = emptyTotals()
  for (const order of orders) {
    if (inPeriod(warsawYmd(order.revenueAt), period)) addOrderQuantity(totals, order)
  }
  totals.total =
    totals.base +
    totals.charms +
    totals.karabiners +
    totals.strings +
    totals.beads +
    totals.stoppers +
    totals.stickers +
    totals.dialCode +
    totals.express +
    totals.shipping
  return totals
}

export const buildRevenueRows = (
  orders: RevenueOrder[],
  ctx: RevenuePricingContext = {},
  nowIso = new Date().toISOString(),
): RevenueRow[] =>
  reportPeriods(nowIso).map((period) => ({
    key: period.key,
    label: period.label,
    ...totalsForPeriod(period, orders, ctx),
  }))

export const buildQuantityRows = (orders: RevenueOrder[], nowIso = new Date().toISOString()): RevenueRow[] =>
  reportPeriods(nowIso).map((period) => ({
    key: period.key,
    label: period.label,
    ...totalsForQuantityPeriod(period, orders),
  }))
