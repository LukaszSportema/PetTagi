import { TAG_MODEL_OPTIONS } from "@/lib/catalog-options"
import { baseTagPrice } from "@/lib/pricing"

export type TagModelId = (typeof TAG_MODEL_OPTIONS)[number]["id"]

export type TagModelStartPrices = Record<TagModelId, number>

export type TagModelBasePrices = Record<TagModelId, number>

export const TAG_MODEL_IDS: TagModelId[] = TAG_MODEL_OPTIONS.map((option) => option.id)

export const DEFAULT_TAG_MODEL_START_PRICES: TagModelStartPrices = {
  "sznurek-karabinier": 60,
  "sznurek-bez-karabinier": 67,
  "naszyjnik-koraliki": 60,
  "sama-karabinier": 60,
}

/** Cena bazowa w konfiguratorze (bez dopłat) — może różnić się od „od X zł” na kaflach modelu. */
export const DEFAULT_TAG_MODEL_BASE_PRICES: TagModelBasePrices = {
  "sznurek-karabinier": 60,
  "sznurek-bez-karabinier": 67,
  "naszyjnik-koraliki": 60,
  "sama-karabinier": 60,
}

const isTagModelId = (value: string): value is TagModelId =>
  TAG_MODEL_IDS.includes(value as TagModelId)

const parseTagModelPriceRecord = <T extends Record<TagModelId, number>>(
  raw: unknown,
  defaults: T,
): T => {
  const merged = { ...defaults }
  if (!raw || typeof raw !== "object") return merged

  for (const id of TAG_MODEL_IDS) {
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

export const parseTagModelStartPrices = (raw: unknown): TagModelStartPrices =>
  parseTagModelPriceRecord(raw, DEFAULT_TAG_MODEL_START_PRICES)

export const parseTagModelBasePrices = (raw: unknown): TagModelBasePrices =>
  parseTagModelPriceRecord(raw, DEFAULT_TAG_MODEL_BASE_PRICES)

export const OPRAWA_KWIAT_SURCHARGE_PLN = 1

export const oprawaKwiatSurchargePln = (ringColor?: string | null) =>
  ringColor?.trim() === "kwiat" ? OPRAWA_KWIAT_SURCHARGE_PLN : 0

/** Cena bazowa bez dopłaty za oprawę kwiat (model / złoty–srebrny). */
export const classicTagCatalogBaseUnitPrice = (input: {
  tagModel?: string | null
  ringColor: string
  tagModelBasePrices?: TagModelBasePrices
}): number => {
  const id = input.tagModel?.trim()
  const prices = input.tagModelBasePrices ?? DEFAULT_TAG_MODEL_BASE_PRICES
  if (id && isTagModelId(id)) {
    return prices[id]
  }
  if (input.ringColor === "kwiat") {
    return baseTagPrice("złoty")
  }
  return baseTagPrice(input.ringColor)
}

/** Cena bazowa jednej adresówki classic — model z cennika + ewentualna dopłata za oprawę kwiat. */
export const classicTagBaseUnitPrice = (input: {
  tagModel?: string | null
  ringColor: string
  tagModelBasePrices?: TagModelBasePrices
}): number =>
  classicTagCatalogBaseUnitPrice(input) + oprawaKwiatSurchargePln(input.ringColor)

export const tagModelStartPriceLabel = (amountPln: number) => {
  const formatted =
    Number.isInteger(amountPln) || amountPln % 1 === 0
      ? String(Math.round(amountPln))
      : amountPln.toFixed(2).replace(".", ",")
  return `od ${formatted} zł`
}

export const tagModelStartPricesToJson = (prices: TagModelStartPrices): Record<string, number> => {
  const payload: Record<string, number> = {}
  for (const id of TAG_MODEL_IDS) {
    if (isTagModelId(id)) payload[id] = prices[id]
  }
  return payload
}

export const tagModelBasePricesToJson = (prices: TagModelBasePrices): Record<string, number> => {
  const payload: Record<string, number> = {}
  for (const id of TAG_MODEL_IDS) {
    if (isTagModelId(id)) payload[id] = prices[id]
  }
  return payload
}
