import { warsawYmd } from "@/lib/report-periods"

export type VercelDailyVisit = {
  day: string
  uniqueVisitors: number
  pageviews: number
}

type VercelAggregateRow = {
  timestamp?: string
  visitors?: number
  pageviews?: number
  visits?: number
}

type VercelProject = {
  id: string
  name: string
  accountId?: string
}

const ANALYTICS_WINDOW_DAYS = 30
const PROJECT_NAME_HINTS = ["pettagi", "my-store"]

const toCount = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
}

export const vercelAnalyticsWindowStart = (now = new Date()) => {
  const start = new Date(now.getTime() - (ANALYTICS_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000)
  return warsawYmd(start.toISOString())
}

const vercelGet = async (path: string, token: string, params?: Record<string, string>) => {
  const url = new URL(`https://api.vercel.com${path}`)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) url.searchParams.set(key, value)
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null
  return { ok: response.ok, status: response.status, body }
}

const pickProject = (projects: VercelProject[], preferredName?: string) => {
  if (preferredName) {
    const exact = projects.find((project) => project.name === preferredName)
    if (exact) return exact
  }
  return (
    PROJECT_NAME_HINTS.map((hint) =>
      projects.find((project) => project.name.toLowerCase().includes(hint)),
    ).find(Boolean) ?? (projects.length === 1 ? projects[0] : undefined)
  )
}

const listProjects = async (token: string, teamId?: string) => {
  const { ok, body } = await vercelGet("/v10/projects", token, {
    limit: "100",
    ...(teamId ? { teamId } : {}),
  })
  const projects = Array.isArray(body?.projects) ? (body.projects as VercelProject[]) : []
  return ok ? projects : []
}

const resolveVercelContext = async () => {
  const token = process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN
  if (!token) {
    return {
      ok: false as const,
      message: "Brak VERCEL_API_TOKEN. Dodaj token z Vercel → Account Settings → Tokens do .env.local.",
    }
  }

  const envProjectId = process.env.VERCEL_PROJECT_ID
  const envTeamId = process.env.VERCEL_ORG_ID || process.env.VERCEL_TEAM_ID
  const envProjectName = process.env.VERCEL_PROJECT_NAME
  if (envProjectId) {
    return { ok: true as const, token, projectId: envProjectId, teamId: envTeamId }
  }

  const teamsResult = await vercelGet("/v2/teams", token, { limit: "20" })
  const teams = Array.isArray(teamsResult.body?.teams)
    ? (teamsResult.body.teams as { id: string }[])
    : []
  const teamIds = [envTeamId, ...teams.map((team) => team.id)].filter(
    (value, index, all): value is string => Boolean(value) && all.indexOf(value) === index,
  )

  const projects: VercelProject[] = []
  projects.push(...(await listProjects(token)))
  for (const teamId of teamIds) {
    projects.push(...(await listProjects(token, teamId)))
  }

  const unique = [...new Map(projects.map((project) => [project.id, project])).values()]
  const project = pickProject(unique, envProjectName)
  if (!project) {
    return {
      ok: false as const,
      message:
        "Nie znaleziono projektu Vercel. Dodaj VERCEL_PROJECT_ID z Vercel → Project → Settings → General.",
    }
  }

  return {
    ok: true as const,
    token,
    projectId: project.id,
    teamId: envTeamId || project.accountId,
  }
}

export async function fetchVercelDailyVisits(
  sinceYmd: string,
  untilYmd: string,
): Promise<{ ok: true; days: VercelDailyVisit[] } | { ok: false; message: string }> {
  const context = await resolveVercelContext()
  if (!context.ok) return context

  const { ok, status, body } = await vercelGet(
    "/v1/query/web-analytics/visits/aggregate",
    context.token,
    {
      projectId: context.projectId,
      ...(context.teamId ? { teamId: context.teamId } : {}),
      since: sinceYmd,
      until: untilYmd,
      by: "day",
      limit: "100",
    },
  )

  if (!ok) {
    const detail =
      (body?.error as { message?: string } | undefined)?.message || `HTTP ${status}`
    console.error("Vercel analytics fetch failed", status, body)
    return {
      ok: false,
      message: `Nie udało się pobrać analityki z Vercel (${detail}).`,
    }
  }

  const rows = Array.isArray(body?.data) ? (body.data as VercelAggregateRow[]) : []
  const byDay = new Map<string, VercelDailyVisit>()
  for (const row of rows) {
    if (!row.timestamp) continue
    const day = warsawYmd(row.timestamp)
    const uniqueVisitors = toCount(row.visitors ?? row.visits)
    const pageviews = toCount(row.pageviews)
    const previous = byDay.get(day)
    if (!previous || uniqueVisitors >= previous.uniqueVisitors) {
      byDay.set(day, { day, uniqueVisitors, pageviews })
    }
  }

  return { ok: true, days: [...byDay.values()] }
}
