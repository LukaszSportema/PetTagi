/** Polskie dni ustawowo wolne od pracy (kalendarz gregoriański). */

const pad2 = (value: number) => String(value).padStart(2, "0")

export const ymdFromParts = (year: number, month: number, day: number) =>
  `${year}-${pad2(month)}-${pad2(day)}`

/** Niedziela Wielkanocna — algorytm Meeusa/Jonesa/Butchera (Gregorian). */
export const easterSundayYmd = (year: number): string => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return ymdFromParts(year, month, day)
}

export const addDaysToYmd = (ymd: string, days: number): string => {
  const [y, m, d] = ymd.split("-").map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + days))
  return ymdFromParts(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())
}

const weekdayFromYmd = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

const holidayCache = new Map<number, Set<string>>()

/** Daty (YYYY-MM-DD) świąt ustawowych w danym roku kalendarzowym. */
export const polishPublicHolidayDates = (year: number): Set<string> => {
  const cached = holidayCache.get(year)
  if (cached) return cached

  const easter = easterSundayYmd(year)
  const holidays = new Set<string>([
    ymdFromParts(year, 1, 1),
    ymdFromParts(year, 1, 6),
    ymdFromParts(year, 5, 1),
    ymdFromParts(year, 5, 3),
    ymdFromParts(year, 8, 15),
    ymdFromParts(year, 11, 1),
    ymdFromParts(year, 11, 11),
    ymdFromParts(year, 12, 25),
    ymdFromParts(year, 12, 26),
    easter,
    addDaysToYmd(easter, 1),
    addDaysToYmd(easter, 49),
    addDaysToYmd(easter, 60),
  ])

  holidayCache.set(year, holidays)
  return holidays
}

export const isPolishPublicHolidayYmd = (ymd: string) => {
  const year = Number(ymd.slice(0, 4))
  if (!Number.isFinite(year)) return false
  return polishPublicHolidayDates(year).has(ymd)
}

export const isPolishBusinessDayYmd = (ymd: string) => {
  const weekday = weekdayFromYmd(ymd)
  if (weekday === 0 || weekday === 6) return false
  return !isPolishPublicHolidayYmd(ymd)
}
