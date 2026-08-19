"use server"

import { buildPopularityRows, type PopularityItem, type PopularityRow } from "@/lib/popularity"
import type { ReportPeriod } from "@/lib/report-periods"
import { createClient } from "@/lib/supabase/server"

export type PopularityReportResult =
  | { ok: true; periods: ReportPeriod[]; rows: PopularityRow[] }
  | { ok: false; message: string }

type PopularityItemRow = {
  created_at: string
  quantity: number | string
  ring_color: string
  base_color: string
  base_charms: string
  extra_charms: unknown
  base_carabiner: string
  extra_carabiner: unknown
  string_classic: unknown
  string_premium: unknown
  stoppers: string | null
  sticker: string | null
}

const toCount = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? n : 1
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
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

const mapItem = (row: PopularityItemRow): PopularityItem => ({
  createdAt: row.created_at,
  quantity: toCount(row.quantity),
  ringColor: row.ring_color,
  baseColor: row.base_color,
  baseCharms: row.base_charms,
  extraCharms: toStringArray(row.extra_charms),
  baseCarabiner: row.base_carabiner,
  extraCarabiner: toStringArray(row.extra_carabiner),
  stringClassic: toStringArray(row.string_classic),
  stringPremium: toStringArray(row.string_premium),
  stoppers: row.stoppers,
  sticker: row.sticker,
})

export async function getPopularityReport(): Promise<PopularityReportResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_popularity_items")

  if (error) {
    console.error("admin_popularity_items failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_popularity_items")
        ? "Brak funkcji admin_popularity_items w Supabase. Wklej skrypt SQL z supabase/migrations/20260819_popularity.sql."
        : "Nie udało się pobrać popularności. Spróbuj ponownie.",
    }
  }

  const items = asArray<PopularityItemRow>(data).map(mapItem)
  return { ok: true, ...buildPopularityRows(items) }
}
