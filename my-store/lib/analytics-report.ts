import { inPeriod, reportPeriods, warsawYmd } from "@/lib/report-periods"

export type AnalyticsVisitDay = {
  day: string
  uniqueVisitors: number
}

export type AnalyticsOrder = {
  createdAt: string
  status: string
}

export type AnalyticsTotals = {
  visits: number
  orders: number
  paidOrders: number
}

export type AnalyticsRow = AnalyticsTotals & {
  key: string
  label: string
}

const emptyTotals = (): AnalyticsTotals => ({
  visits: 0,
  orders: 0,
  paidOrders: 0,
})

export const buildAnalyticsRows = (
  visits: AnalyticsVisitDay[],
  orders: AnalyticsOrder[],
  nowIso = new Date().toISOString(),
): AnalyticsRow[] =>
  reportPeriods(nowIso).map((period) => {
    const totals = emptyTotals()
    for (const day of visits) {
      if (inPeriod(day.day, period)) totals.visits += day.uniqueVisitors
    }
    for (const order of orders) {
      if (!inPeriod(warsawYmd(order.createdAt), period)) continue
      totals.orders += 1
      if (order.status !== "pending" && order.status !== "cancelled") totals.paidOrders += 1
    }
    return {
      key: period.key,
      label: period.label,
      ...totals,
    }
  })
