import {
  CHARM_GOLD_KWIAT_CONFIGURATOR_SECTIONS,
  CHARM_SILVER_CONFIGURATOR_SECTIONS,
  CONFIGURATOR_CHARM_CATALOG,
} from "@/lib/catalog-options"
import { EXTRA_CHARM_PRICE } from "@/lib/pricing-constants"
import { ROGALIK_CHARM_OPTIONS } from "@/lib/rogalik-options"

export type CharmUnitPrices = Record<string, number>

export type CharmPriceAdminRow = {
  id: string
  label: string
  section: "Złote" | "Srebrne" | "Rogalik"
}

const catalogDefaultPrice = (item: { pricePln?: number }) => item.pricePln ?? EXTRA_CHARM_PRICE

export const CHARM_PRICE_ADMIN_ROWS: CharmPriceAdminRow[] = [
  ...CHARM_GOLD_KWIAT_CONFIGURATOR_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      id: item.id,
      label: item.label.replace(/\s*\(chwilowo niedostępny\)\s*$/i, "").trim(),
      section: "Złote" as const,
    })),
  ),
  ...CHARM_SILVER_CONFIGURATOR_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      id: item.id,
      label: item.label.replace(/\s*\(chwilowo niedostępny\)\s*$/i, "").trim(),
      section: "Srebrne" as const,
    })),
  ),
  ...ROGALIK_CHARM_OPTIONS.map((item) => ({
    id: item.id,
    label: item.label,
    section: "Rogalik" as const,
  })),
]

export const CHARM_PRICE_ADMIN_SECTIONS = ["Złote", "Srebrne", "Rogalik"] as const

export const buildDefaultCharmUnitPrices = (): CharmUnitPrices => {
  const prices: CharmUnitPrices = {}
  for (const item of CONFIGURATOR_CHARM_CATALOG) {
    prices[item.id] = catalogDefaultPrice(item)
  }
  for (const item of ROGALIK_CHARM_OPTIONS) {
    prices[item.id] = catalogDefaultPrice(item)
  }
  return prices
}

const parsePriceValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value * 100) / 100
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."))
    if (Number.isFinite(parsed) && parsed >= 0) return Math.round(parsed * 100) / 100
  }
  return null
}

/** Domyślny katalog + nadpisania z bazy (store_settings.charm_unit_prices). */
export const mergeCharmUnitPrices = (stored: unknown): CharmUnitPrices => {
  const merged = buildDefaultCharmUnitPrices()
  if (!stored || typeof stored !== "object") return merged

  for (const [id, value] of Object.entries(stored as Record<string, unknown>)) {
    if (!(id in merged)) continue
    const parsed = parsePriceValue(value)
    if (parsed !== null) merged[id] = parsed
  }
  return merged
}

export const charmUnitPricesToJson = (prices: CharmUnitPrices): Record<string, number> => {
  const defaults = buildDefaultCharmUnitPrices()
  const payload: Record<string, number> = {}
  for (const id of Object.keys(defaults)) {
    const value = prices[id]
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      payload[id] = Math.round(value * 100) / 100
    }
  }
  return payload
}

export const parseCharmUnitPricesDraft = (
  draft: Record<string, string>,
): CharmUnitPrices | null => {
  const defaults = buildDefaultCharmUnitPrices()
  const parsed: CharmUnitPrices = { ...defaults }
  for (const row of CHARM_PRICE_ADMIN_ROWS) {
    const raw = draft[row.id]?.trim().replace(",", ".") ?? ""
    if (raw === "") return null
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) return null
    parsed[row.id] = Math.round(value * 100) / 100
  }
  return parsed
}
