const WARSAW_TIME_ZONE = "Europe/Warsaw"

export const STANDARD_FULFILLMENT_START_DAYS = 6
export const STANDARD_FULFILLMENT_END_DAYS = 10
export const EXPRESS_FULFILLMENT_START_DAYS = 3
export const EXPRESS_FULFILLMENT_END_DAYS = 4

export const addBusinessDays = (start: Date, businessDays: number) => {
  const result = new Date(start)
  let added = 0

  while (added < businessDays) {
    result.setDate(result.getDate() + 1)
    const weekday = result.getDay()
    if (weekday !== 0 && weekday !== 6) added += 1
  }

  return result
}

const warsawDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("pl-PL", {
    timeZone: WARSAW_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date)

  return {
    day: parts.find((part) => part.type === "day")?.value ?? "",
    month: parts.find((part) => part.type === "month")?.value ?? "",
    year: parts.find((part) => part.type === "year")?.value ?? "",
  }
}

export const formatFulfillmentDate = (date: Date) =>
  date.toLocaleDateString("pl-PL", {
    timeZone: WARSAW_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  })

export const formatFulfillmentRangeCompact = (start: Date, end: Date) => {
  const startParts = warsawDateParts(start)
  const endParts = warsawDateParts(end)

  if (startParts.month === endParts.month && startParts.year === endParts.year) {
    return `${startParts.day}–${endParts.day} ${startParts.month} ${startParts.year} r.`
  }

  return `${startParts.day} ${startParts.month} ${startParts.year} r. – ${endParts.day} ${endParts.month} ${endParts.year} r.`
}

export const standardFulfillmentRangeCompact = (from = new Date()) => {
  const start = addBusinessDays(from, STANDARD_FULFILLMENT_START_DAYS)
  const end = addBusinessDays(from, STANDARD_FULFILLMENT_END_DAYS)
  return formatFulfillmentRangeCompact(start, end)
}

export const expressFulfillmentRangeCompact = (from = new Date()) => {
  const start = addBusinessDays(from, EXPRESS_FULFILLMENT_START_DAYS)
  const end = addBusinessDays(from, EXPRESS_FULFILLMENT_END_DAYS)
  return formatFulfillmentRangeCompact(start, end)
}
