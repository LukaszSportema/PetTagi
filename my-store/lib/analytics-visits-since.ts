const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Pierwszy dzień liczony w „Wejścia na stronę” (YYYY-MM-DD). Ustaw w Vercel, żeby wyzerować licznik. */
export const analyticsVisitsSince = (): string | null => {
  const raw = process.env.ANALYTICS_VISITS_SINCE?.trim().slice(0, 10)
  if (!raw || !DATE_RE.test(raw)) return null
  return raw
}

export const isOnOrAfterVisitsSince = (dayYmd: string, sinceYmd: string | null) =>
  !sinceYmd || dayYmd >= sinceYmd
