import {
  ROGALIK_BASE_PRICE,
  ROGALIK_MOUNTING_IDS,
  type RogalikMountingBasePrices,
  type RogalikMountingId,
} from "@/lib/rogalik-mounting-ids"

export type { RogalikMountingBasePrices, RogalikMountingId }

export type RogalikMountingStartPrices = Record<RogalikMountingId, number>

const mountingIds = [...ROGALIK_MOUNTING_IDS] as RogalikMountingId[]

/** Domyślne „od X zł” na kafelach mocowania rogalika (zgodne z pierwszym wdrożeniem). */
export const DEFAULT_ROGALIK_MOUNTING_START_PRICES: RogalikMountingStartPrices = {
  koraliki: 88,
  karabinczyk: 72,
  sznureczek: 67,
  "sznureczek-karabinczyk": 65,
}

export const DEFAULT_ROGALIK_BASE_UNIT_PRICE_PLN = ROGALIK_BASE_PRICE

/** Domyślne ceny bazowe per model mocowania (gdy brak mapy w ustawieniach). */
export const DEFAULT_ROGALIK_MOUNTING_BASE_PRICES: RogalikMountingBasePrices = {
  koraliki: ROGALIK_BASE_PRICE,
  karabinczyk: ROGALIK_BASE_PRICE,
  sznureczek: ROGALIK_BASE_PRICE,
  "sznureczek-karabinczyk": ROGALIK_BASE_PRICE,
}

const isMountingId = (value: string): value is RogalikMountingId =>
  (mountingIds as string[]).includes(value)

export const parseRogalikMountingStartPrices = (raw: unknown): RogalikMountingStartPrices => {
  const merged = { ...DEFAULT_ROGALIK_MOUNTING_START_PRICES }
  if (!raw || typeof raw !== "object") return merged

  for (const id of mountingIds) {
    const value = (raw as Record<string, unknown>)[id]
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      merged[id] = Math.round(value * 100) / 100
    } else if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value.replace(",", "."))
      if (Number.isFinite(parsed) && parsed >= 0) {
        merged[id] = Math.round(parsed * 100) / 100
      }
    }
  }

  return merged
}

export const rogalikMountingStartPricesToJson = (
  prices: RogalikMountingStartPrices,
): Record<string, number> => {
  const payload: Record<string, number> = {}
  for (const id of mountingIds) {
    payload[id] = prices[id]
  }
  return payload
}

export const parseRogalikMountingBasePrices = (raw: unknown): RogalikMountingBasePrices => {
  const merged = { ...DEFAULT_ROGALIK_MOUNTING_BASE_PRICES }
  if (!raw || typeof raw !== "object") return merged

  for (const id of mountingIds) {
    const value = (raw as Record<string, unknown>)[id]
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      merged[id] = Math.round(value * 100) / 100
    } else if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value.replace(",", "."))
      if (Number.isFinite(parsed) && parsed >= 0) {
        merged[id] = Math.round(parsed * 100) / 100
      }
    }
  }

  return merged
}

export const rogalikMountingBasePricesToJson = (
  prices: RogalikMountingBasePrices,
): Record<string, number> => {
  const payload: Record<string, number> = {}
  for (const id of mountingIds) {
    payload[id] = prices[id]
  }
  return payload
}

/** Cena bazowa dla wybranego mocowania albo stała domyślna ROGALIK_BASE_PRICE. */
export const rogalikBaseUnitPriceForMounting = (
  mountingId: string | null | undefined,
  map?: RogalikMountingBasePrices,
): number => {
  const id = mountingId?.trim() ?? ""
  if (!isMountingId(id)) return ROGALIK_BASE_PRICE
  const resolved = map?.[id]
  if (typeof resolved === "number" && Number.isFinite(resolved) && resolved >= 0) {
    return Math.round(resolved * 100) / 100
  }
  return DEFAULT_ROGALIK_MOUNTING_BASE_PRICES[id]
}

export const parseRogalikBaseUnitPricePln = (raw: unknown): number => {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return Math.round(raw * 100) / 100
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw.replace(",", "."))
    if (Number.isFinite(parsed) && parsed >= 0) return Math.round(parsed * 100) / 100
  }
  return DEFAULT_ROGALIK_BASE_UNIT_PRICE_PLN
}

/** „Od X zł” na kaflu mocowania — z mapy ustawień lub domyślnej. */
export const rogalikMountingStartPricePln = (
  mountingId: string,
  prices: RogalikMountingStartPrices | undefined,
): number | undefined => {
  const id = mountingId.trim()
  if (!isMountingId(id)) return undefined
  const map = prices ?? DEFAULT_ROGALIK_MOUNTING_START_PRICES
  return map[id]
}
