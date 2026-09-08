"use server"

import {
  type ConfiguratorAnalyticsReport,
  type ConfiguratorChoiceStat,
  type ConfiguratorFunnelStep,
} from "@/lib/configurator-analytics"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export type ConfiguratorAnalyticsResult =
  | { ok: true; report: ConfiguratorAnalyticsReport }
  | { ok: false; message: string }

const toNumber = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

export async function getConfiguratorAnalyticsReport(
  startedDay?: string,
): Promise<ConfiguratorAnalyticsResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_configurator_analytics", {
    p_started_day: startedDay ?? null,
  })

  if (error) {
    console.error("admin_configurator_analytics failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_configurator_analytics")
        ? "Brak analityki konfiguratora w Supabase. Wklej migrację supabase/migrations/20260908_configurator_analytics.sql."
        : "Nie udało się pobrać analityki konfiguratora. Spróbuj ponownie.",
    }
  }

  const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : {}

  const funnel: ConfiguratorFunnelStep[] = asArray<Record<string, unknown>>(payload.funnel).map((row) => ({
    stepKey: String(row.stepKey ?? ""),
    stepLabel: String(row.stepLabel ?? ""),
    stepIndex: toNumber(row.stepIndex),
    users: toNumber(row.users),
    avgDurationMs: toNumber(row.avgDurationMs),
    dropOffRate: row.dropOffRate === null || row.dropOffRate === undefined ? null : toNumber(row.dropOffRate),
  }))

  const choices: ConfiguratorChoiceStat[] = asArray<Record<string, unknown>>(payload.choices).map((row) => ({
    stepKey: String(row.stepKey ?? ""),
    stepLabel: String(row.stepLabel ?? ""),
    choiceKey: String(row.choiceKey ?? ""),
    choiceValue: String(row.choiceValue ?? ""),
    count: toNumber(row.count),
  }))

  return {
    ok: true,
    report: {
      startedSessions: toNumber(payload.startedSessions),
      avgCompletionMs: toNumber(payload.avgCompletionMs),
      conversionRate: toNumber(payload.conversionRate),
      funnel,
      choices,
    },
  }
}
