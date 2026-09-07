import { createClient } from "@supabase/supabase-js"
import { warsawYmd } from "@/lib/report-periods"
import { fetchVercelDailyVisits, vercelAnalyticsWindowStart } from "@/lib/vercel-analytics"

const createServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}

export async function syncVercelAnalytics(): Promise<
  { ok: true; saved: number } | { ok: false; message: string }
> {
  const until = warsawYmd(new Date().toISOString())
  const since = vercelAnalyticsWindowStart()
  const fetched = await fetchVercelDailyVisits(since, until)
  if (!fetched.ok) return fetched
  if (!fetched.days.length) return { ok: true, saved: 0 }

  const supabase = createServiceClient()
  if (!supabase) {
    return {
      ok: false,
      message: "Brak SUPABASE_SERVICE_ROLE_KEY na serwerze. Dodaj klucz w Vercel → Settings → Environment Variables.",
    }
  }

  const { error } = await supabase.rpc("admin_upsert_analytics_daily", {
    p_rows: fetched.days.map((day) => ({
      day: day.day,
      unique_visitors: day.uniqueVisitors,
      pageviews: day.pageviews,
    })),
  })

  if (error) {
    console.error("admin_upsert_analytics_daily failed", error)
    return {
      ok: false,
      message: error.message.includes("Could not find the function")
        ? "Brak funkcji analityki w Supabase. Wklej skrypt SQL z supabase/migrations/20260819_analytics.sql."
        : `Nie udało się zapisać analityki: ${error.message}`,
    }
  }

  return { ok: true, saved: fetched.days.length }
}
