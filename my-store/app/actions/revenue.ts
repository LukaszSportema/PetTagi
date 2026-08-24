"use server"

import { buildRevenueRows, type RevenueOrder, type RevenueRow } from "@/lib/revenue"
import { createClient } from "@/lib/supabase/server"

type RevenueItemRow = {
  quantity: number | string
  extra_charms: unknown
  extra_carabiner: unknown
  string_premium: unknown
  string_classic: unknown
  string_glow: unknown
  dog_neck: string | null
  stoppers: string | null
  sticker: string | null
  dial_code_info: boolean | string | null
}

type RevenueOrderRow = {
  created_at: string
  total: number | string
  shipping_cost: number | string
  fast_delivery_cost: number | string | null
  items: RevenueItemRow[] | null
}

export type RevenueReportResult =
  | { ok: true; rows: RevenueRow[] }
  | { ok: false; message: string }

const toMoney = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
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

const mapOrder = (row: RevenueOrderRow): RevenueOrder => ({
  createdAt: row.created_at,
  total: toMoney(row.total),
  shippingCost: toMoney(row.shipping_cost),
  fastDeliveryCost: toMoney(row.fast_delivery_cost),
  items: (row.items ?? []).map((item) => ({
    quantity: Number(item.quantity) || 1,
    extraCharms: toStringArray(item.extra_charms),
    extraCarabiner: toStringArray(item.extra_carabiner),
    stringPremium: toStringArray(item.string_premium),
    stringClassic: toStringArray(item.string_classic),
    stringGlow: toStringArray(item.string_glow),
    dogNeck: item.dog_neck,
    stoppers: item.stoppers,
    sticker: item.sticker,
    dialCodeInfo: item.dial_code_info === true || item.dial_code_info === "true",
  })),
})

export async function getRevenueReport(): Promise<RevenueReportResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_revenue_orders")

  if (error) {
    console.error("admin_revenue_orders failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_revenue_orders")
        ? "Brak funkcji admin_revenue_orders w Supabase. Wklej skrypt SQL z supabase/migrations/20260819_admin_revenue.sql."
        : "Nie udało się pobrać przychodów. Spróbuj ponownie.",
    }
  }

  const rows = Array.isArray(data)
    ? (data as RevenueOrderRow[])
    : typeof data === "string"
      ? (JSON.parse(data) as RevenueOrderRow[])
      : []
  return { ok: true, rows: buildRevenueRows(rows.map(mapOrder)) }
}
