export const WARSAW_TZ = "Europe/Warsaw"

export type ReportPeriod = {
  key: string
  label: string
  startYmd: string
  endYmd: string
  highlight: boolean
}

export const warsawYmd = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: WARSAW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))

export const monthLabel = (year: number, month: number) => {
  const label = new Date(year, month - 1, 1).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  })
  return label.charAt(0).toLocaleUpperCase("pl-PL") + label.slice(1)
}

const pad2 = (value: number) => String(value).padStart(2, "0")

const lastDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate()

export const inPeriod = (ymd: string, period: ReportPeriod) =>
  ymd >= period.startYmd && ymd <= period.endYmd

export const reportPeriods = (nowIso = new Date().toISOString()): ReportPeriod[] => {
  const today = warsawYmd(nowIso)
  const currentYear = Number(today.slice(0, 4))
  const currentMonth = Number(today.slice(5, 7))
  const previousYear = currentYear - 1
  const currentMonthKey = `${currentYear}-${pad2(currentMonth)}`

  const periods: ReportPeriod[] = [
    {
      key: `year-${currentYear}`,
      label: `Bieżący rok (${currentYear})`,
      startYmd: `${currentYear}-01-01`,
      endYmd: today,
      highlight: true,
    },
    {
      key: `year-${previousYear}`,
      label: `Poprzedni rok (${previousYear})`,
      startYmd: `${previousYear}-01-01`,
      endYmd: `${previousYear}-12-31`,
      highlight: true,
    },
    {
      key: `month-current-${currentMonthKey}`,
      label: `Aktualny miesiąc (${monthLabel(currentYear, currentMonth)})`,
      startYmd: `${currentMonthKey}-01`,
      endYmd: today,
      highlight: true,
    },
  ]

  for (let month = currentMonth - 1; month >= 1; month -= 1) {
    periods.push({
      key: `${currentYear}-${pad2(month)}`,
      label: monthLabel(currentYear, month),
      startYmd: `${currentYear}-${pad2(month)}-01`,
      endYmd: `${currentYear}-${pad2(month)}-${pad2(lastDayOfMonth(currentYear, month))}`,
      highlight: false,
    })
  }

  return periods
}
