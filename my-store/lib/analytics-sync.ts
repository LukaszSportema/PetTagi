import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import { isOnOrAfterVisitsSince, resolveAnalyticsVisitsSince } from "@/lib/analytics-visits-since"
import { warsawYmd } from "@/lib/report-periods"
import { fetchVercelDailyVisits, vercelAnalyticsWindowStart } from "@/lib/vercel-analytics"

const createServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createSupabaseClient(url, serviceKey)
}

const upsertDailyVisits = async (
  supabase: SupabaseClient,
  days: { day: string; uniqueVisitors: number; pageviews: number }[],
) => {
  const { error } = await supabase.rpc("admin_upsert_analytics_daily", {
    p_rows: days.map((day) => ({
      day: day.day,
      unique_visitors: day.uniqueVisitors,
      pageviews: day.pageviews,
    })),
  })

  if (error) {
    console.error("admin_upsert_analytics_daily failed", error)
    if (error.message.includes("Could not find the function")) {
      return {
        ok: false as const,
        message: "Brak funkcji analityki w Supabase. Wklej skrypt SQL z supabase/migrations/20260819_analytics.sql.",
      }
    }
    if (error.message.includes("Brak uprawnień administratora")) {
      return {
        ok: false as const,
        message: "Brak uprawnień administratora. Wyloguj się i zaloguj ponownie.",
      }
    }
    if (error.message.includes("permission denied") || error.code === "42501") {
      return {
        ok: false as const,
        message:
          "Brak uprawnień do zapisu analityki. Wklej migrację supabase/migrations/20260909_admin_analytics_upsert_auth.sql w Supabase SQL Editor.",
      }
    }
    return {
      ok: false as const,
      message: `Nie udało się zapisać analityki: ${error.message}`,
    }
  }

  return { ok: true as const }
}

const pruneVisitsBeforeSince = async (supabase: SupabaseClient, sinceYmd: string) => {
  const { error } = await supabase.rpc("admin_delete_analytics_daily_before", {
    p_before: sinceYmd,
  })

  if (error) {
    console.error("admin_delete_analytics_daily_before failed", error)
    if (error.message.includes("Could not find the function")) {
      return {
        ok: false as const,
        message:
          "Brak funkcji czyszczenia analityki. Wklej migrację supabase/migrations/20260910_store_settings_analytics_visits_since.sql w Supabase SQL Editor.",
      }
    }
    return {
      ok: false as const,
      message: `Nie udało się wyczyścić starych wejść: ${error.message}`,
    }
  }

  return { ok: true as const }
}

export async function syncVercelAnalytics(
  supabase: SupabaseClient,
  visitsSince: string | null,
): Promise<{ ok: true; saved: number } | { ok: false; message: string }> {
  const until = warsawYmd(new Date().toISOString())
  const since = visitsSince ?? vercelAnalyticsWindowStart()
  const fetched = await fetchVercelDailyVisits(since, until)
  if (!fetched.ok) return fetched

  if (visitsSince) {
    const pruned = await pruneVisitsBeforeSince(supabase, visitsSince)
    if (!pruned.ok) return pruned
  }

  const days = visitsSince
    ? fetched.days.filter((day) => isOnOrAfterVisitsSince(day.day, visitsSince))
    : fetched.days
  if (!days.length) return { ok: true, saved: 0 }

  const saved = await upsertDailyVisits(supabase, days)
  if (!saved.ok) return saved

  return { ok: true, saved: days.length }
}

export async function syncVercelAnalyticsWithServiceRole(): Promise<
  { ok: true; saved: number } | { ok: false; message: string }
> {
  const supabase = createServiceClient()
  if (!supabase) {
    return {
      ok: false,
      message: "Brak SUPABASE_SERVICE_ROLE_KEY na serwerze. Dodaj klucz w Vercel → Settings → Environment Variables.",
    }
  }

  return syncVercelAnalytics(supabase, await resolveAnalyticsVisitsSince(supabase))
}
