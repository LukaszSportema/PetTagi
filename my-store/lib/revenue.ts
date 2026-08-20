import { itemRevenueParts, type PricedOrderItem } from "@/lib/pricing"
import { inPeriod, reportPeriods, warsawYmd, type ReportPeriod } from "@/lib/report-periods"

export type RevenueOrder = {
  createdAt: string
  total: number
  shippingCost: number
  fastDeliveryCost: number
  items: PricedOrderItem[]
}

export type RevenueTotals = {
  total: number
  base: number
  charms: number
  karabiners: number
  strings: number
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
  stoppers: roundMoney(totals.stoppers),
  stickers: roundMoney(totals.stickers),
  dialCode: roundMoney(totals.dialCode),
  express: roundMoney(totals.express),
  shipping: roundMoney(totals.shipping),
})

const addOrder = (totals: RevenueTotals, order: RevenueOrder) => {
  totals.total += order.total
  totals.express += order.fastDeliveryCost
  totals.shipping += order.shippingCost
  for (const item of order.items) {
    const parts = itemRevenueParts(item)
    totals.base += parts.base
    totals.charms += parts.charms
    totals.karabiners += parts.karabiners
    totals.strings += parts.strings
    totals.stoppers += parts.stoppers
    totals.stickers += parts.stickers
    totals.dialCode += parts.dialCode
  }
}

const totalsForPeriod = (period: ReportPeriod, orders: RevenueOrder[]) => {
  const totals = emptyTotals()
  for (const order of orders) {
    if (inPeriod(warsawYmd(order.createdAt), period)) addOrder(totals, order)
  }
  return roundTotals(totals)
}

export const buildRevenueRows = (orders: RevenueOrder[], nowIso = new Date().toISOString()): RevenueRow[] =>
  reportPeriods(nowIso).map((period) => ({
    key: period.key,
    label: period.label,
    ...totalsForPeriod(period, orders),
  }))
