import {
  BASE_OPTIONS,
  CHARM_OPTIONS,
  CLASSIC_STRING_OPTIONS,
  KARABINER_OPTIONS,
  PREMIUM_STRING_OPTIONS,
  RING_OPTIONS,
  STICKER_OPTIONS,
  STOPPER_OPTIONS,
  optionLabel,
  type CatalogOption,
} from "@/lib/catalog-options"
import { inPeriod, popularityPeriods, warsawYmd, type ReportPeriod } from "@/lib/report-periods"

export type PopularityItem = {
  createdAt: string
  quantity: number
  ringColor: string
  baseColor: string
  baseCharms: string
  extraCharms: string[]
  baseCarabiner: string
  extraCarabiner: string[]
  stringClassic: string[]
  stringPremium: string[]
  stoppers: string | null
  sticker: string | null
}

export type PopularityRow = {
  key: string
  groupKey: string
  label: string
  isGroup: boolean
  counts: Record<string, number>
}

type GroupDef = {
  key: string
  label: string
  options: CatalogOption[]
  values: (item: PopularityItem) => string[]
}

const GROUPS: GroupDef[] = [
  { key: "ring", label: "Obręcz", options: RING_OPTIONS, values: (item) => (item.ringColor ? [item.ringColor] : []) },
  { key: "base", label: "Kolor bazy", options: BASE_OPTIONS, values: (item) => (item.baseColor ? [item.baseColor] : []) },
  {
    key: "base-charm",
    label: "Bezpłatny charms",
    options: CHARM_OPTIONS,
    values: (item) => (item.baseCharms ? [item.baseCharms] : []),
  },
  { key: "extra-charm", label: "Płatne charms", options: CHARM_OPTIONS, values: (item) => item.extraCharms },
  {
    key: "base-carabiner",
    label: "Bezpłatny karabińczyk",
    options: KARABINER_OPTIONS,
    values: (item) => (item.baseCarabiner ? [item.baseCarabiner] : []),
  },
  {
    key: "extra-carabiner",
    label: "Płatny karabińczyk",
    options: KARABINER_OPTIONS,
    values: (item) => item.extraCarabiner,
  },
  {
    key: "classic-string",
    label: "Sznurek Klasyczny",
    options: CLASSIC_STRING_OPTIONS,
    values: (item) => item.stringClassic,
  },
  {
    key: "premium-string",
    label: "Sznurek Premium",
    options: PREMIUM_STRING_OPTIONS,
    values: (item) => item.stringPremium,
  },
  {
    key: "stopper",
    label: "Stopery",
    options: STOPPER_OPTIONS,
    values: (item) => (item.stoppers ? [item.stoppers] : []),
  },
  {
    key: "sticker",
    label: "Naklejka",
    options: STICKER_OPTIONS,
    values: (item) => (item.sticker ? [item.sticker] : []),
  },
]

export const DEFAULT_POPULARITY_GROUP = "base"

export const POPULARITY_GROUPS = GROUPS.map((group) => ({
  key: group.key,
  label: group.label,
}))

const emptyCounts = (periods: ReportPeriod[]) =>
  Object.fromEntries(periods.map((period) => [period.key, 0])) as Record<string, number>

const addCount = (counts: Record<string, number>, period: ReportPeriod, amount: number) => {
  counts[period.key] += amount
}

export const buildPopularityRows = (
  items: PopularityItem[],
  nowIso = new Date().toISOString(),
): { periods: ReportPeriod[]; rows: PopularityRow[] } => {
  const periods = popularityPeriods(nowIso)
  const rows: PopularityRow[] = []

  for (const group of GROUPS) {
    const groupCounts = emptyCounts(periods)
    const childCounts = new Map<string, Record<string, number>>()
    for (const option of group.options) {
      childCounts.set(option.id, emptyCounts(periods))
    }

    for (const item of items) {
      const ymd = warsawYmd(item.createdAt)
      const qty = item.quantity > 0 ? item.quantity : 1
      const values = group.values(item).filter(Boolean)
      for (const value of values) {
        if (!childCounts.has(value)) childCounts.set(value, emptyCounts(periods))
        for (const period of periods) {
          if (!inPeriod(ymd, period)) continue
          addCount(groupCounts, period, qty)
          addCount(childCounts.get(value)!, period, qty)
        }
      }
    }

    rows.push({
      key: group.key,
      groupKey: group.key,
      label: group.label,
      isGroup: true,
      counts: groupCounts,
    })

    const sortPeriod = periods[0]?.key
    const children = [...childCounts.entries()].sort((a, b) => {
      const byCurrent = (b[1][sortPeriod] ?? 0) - (a[1][sortPeriod] ?? 0)
      if (byCurrent !== 0) return byCurrent
      const catalogIndex = (id: string) => group.options.findIndex((option) => option.id === id)
      const aIndex = catalogIndex(a[0])
      const bIndex = catalogIndex(b[0])
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a[0].localeCompare(b[0], "pl")
    })

    for (const [id, counts] of children) {
      rows.push({
        key: `${group.key}-${id}`,
        groupKey: group.key,
        label: optionLabel(group.options, id),
        isGroup: false,
        counts,
      })
    }
  }

  return { periods, rows }
}
