const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const parseVisitsSinceDate = (raw: unknown): string | null => {
  if (raw == null) return null
  const ymd = String(raw).trim().slice(0, 10)
  if (!DATE_RE.test(ymd)) return null
  return ymd
}

export const isOnOrAfterVisitsSince = (dayYmd: string, sinceYmd: string | null) =>
  !sinceYmd || dayYmd >= sinceYmd

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
}

/** Data resetu wejść z Supabase (store_settings.analytics_visits_since). */
export async function resolveAnalyticsVisitsSince(client: RpcClient): Promise<string | null> {
  const { data, error } = await client.rpc("get_analytics_visits_since")
  if (error) return null
  return parseVisitsSinceDate(data)
}
