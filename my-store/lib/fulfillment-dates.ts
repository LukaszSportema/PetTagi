const WARSAW_TIME_ZONE = "Europe/Warsaw"

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

export const formatFulfillmentDate = (date: Date) =>
  date.toLocaleDateString("pl-PL", {
    timeZone: WARSAW_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  })

export const standardFulfillmentRangeLabel = (from = new Date()) => {
  const start = addBusinessDays(from, 7)
  const end = addBusinessDays(from, 11)
  return `Standardowy czas realizacji - ${formatFulfillmentDate(start)} do ${formatFulfillmentDate(end)}`
}

export const expressFulfillmentRangeLabel = (from = new Date()) => {
  const start = addBusinessDays(from, 4)
  const end = addBusinessDays(from, 5)
  return `Skróć czas realizacji do ${formatFulfillmentDate(start)} do ${formatFulfillmentDate(end)} - 15 zł`
}
