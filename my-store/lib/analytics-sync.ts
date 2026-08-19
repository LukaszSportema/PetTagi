import { createClient } from "@supabase/supabase-js"
import { warsawYmd } from "@/lib/report-periods"
import { fetchVercelDailyVisits, vercelAnalyticsWindowStart } from "@/lib/vercel-analytics"

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ error: { message: string } | null }>
}

const createAnonClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }
  return createClient(url, anonKey)
}

export async function syncVercelAnalytics(
  client?: RpcClient,
): Promise<{ ok: true; saved: number } | { ok: false; message: string }> {
  const until = warsawYmd(new Date().toISOString())
  const since = vercelAnalyticsWindowStart()
  const fetched = await fetchVercelDailyVisits(since, until)
  if (!fetched.ok) return fetched
  if (!fetched.days.length) return { ok: true, saved: 0 }

  const supabase = client ?? createAnonClient()
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
      message: error.message.includes("admin_upsert_analytics_daily")
        ? "Brak funkcji analityki w Supabase. Wklej skrypt SQL z supabase/migrations/20260819_analytics.sql."
        : "Nie udało się zapisać analityki. Spróbuj ponownie.",
    }
  }

  return { ok: true, saved: fetched.days.length }
}
