"use server"

import { buildAnalyticsRows, type AnalyticsOrder, type AnalyticsRow, type AnalyticsVisitDay } from "@/lib/analytics-report"
import { syncVercelAnalytics } from "@/lib/analytics-sync"
import { createClient } from "@/lib/supabase/server"

export type AnalyticsReportResult =
  | { ok: true; rows: AnalyticsRow[]; warning?: string }
  | { ok: false; message: string }

type AnalyticsDayRow = {
  day: string
  unique_visitors: number | string
}

type AnalyticsOrderRow = {
  created_at: string
  status: string
}

const toCount = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const asArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}

export async function getAnalyticsReport(): Promise<AnalyticsReportResult> {
  const supabase = await createClient()
  const sync = await syncVercelAnalytics(supabase)
  const warning = sync.ok ? undefined : sync.message

  const [visitsResult, ordersResult] = await Promise.all([
    supabase.rpc("admin_list_analytics_daily"),
    supabase.rpc("admin_analytics_orders"),
  ])

  if (visitsResult.error) {
    console.error("admin_list_analytics_daily failed", visitsResult.error)
    return {
      ok: false,
      message: visitsResult.error.message.includes("admin_list_analytics_daily")
        ? "Brak funkcji analityki w Supabase. Wklej skrypt SQL z supabase/migrations/20260819_analytics.sql."
        : "Nie udało się pobrać analityki. Spróbuj ponownie.",
    }
  }

  if (ordersResult.error) {
    console.error("admin_analytics_orders failed", ordersResult.error)
    return {
      ok: false,
      message: "Nie udało się pobrać zamówień do analityki. Spróbuj ponownie.",
    }
  }

  const visits: AnalyticsVisitDay[] = asArray<AnalyticsDayRow>(visitsResult.data).map((row) => ({
    day: String(row.day).slice(0, 10),
    uniqueVisitors: toCount(row.unique_visitors),
  }))

  const orders: AnalyticsOrder[] = asArray<AnalyticsOrderRow>(ordersResult.data).map((row) => ({
    createdAt: row.created_at,
    status: row.status,
  }))

  return { ok: true, rows: buildAnalyticsRows(visits, orders), warning }
}
