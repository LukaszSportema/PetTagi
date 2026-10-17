import {
  karabinersForRingColor,
  type KarabinerOption,
} from "@/lib/catalog-options"
import { roundMoney } from "@/lib/cart-item-pricing"

/** Klucz zestawu karabińczyków (złote vs srebrne + wspólne kolorowe). */
export type KarabinerCatalogRingKey = "złoty" | "srebrny"

export const karabinerCatalogRingKey = (input: {
  configuratorId?: string | null
  ringColor: string
  glowTextColor: string
}): KarabinerCatalogRingKey => {
  if (input.configuratorId === "glow-tag") {
    return input.glowTextColor === "srebrny" ? "srebrny" : "złoty"
  }
  if (input.configuratorId === "rogalik-tag") {
    return "złoty"
  }
  return input.ringColor === "srebrny" ? "srebrny" : "złoty"
}

/** Id pierwszego wiersza (3 kolumny) — stąd wybierany jest 1 darmowy karabińczyk na zamówienie. */
export const firstRowKarabinerIds = (ringColor: string): string[] =>
  karabinersForRingColor(ringColor)
    .slice(0, 3)
    .map((item) => item.id)

export const isFirstRowKarabiner = (id: string, ringColor: string) =>
  firstRowKarabinerIds(ringColor).includes(id)

const KARABINER_UNIT_PRICE_PLN: Record<string, number> = {
  klasyczny20g: 5,
  kolko20g: 5,
  kolko25g: 5,
  serce22g: 5,
  serce25g: 6,
  duzy25g: 6,
  kolko28g: 5,
  klasyczny17g: 12,
  serce16g: 12,
  mini14g: 12,
  koralikowy23g: 12,
  klasyczny20s: 5,
  kolko20s: 5,
  kolko25s: 5,
  serce22s: 5,
  klasyczny17s: 12,
  duzy25s: 6,
  kolko28s: 6,
  pomaranczowyklasyczny: 5,
  zoltyklasyczny: 5,
  bialyklasyczny: 5,
  zielonyklasyczny: 5,
  niebieskiklasyczny: 5,
  jasnorozowyklasyczny: 5,
}

export const karabinerUnitPricePln = (id: string) => KARABINER_UNIT_PRICE_PLN[id] ?? 5

export const karabinerQuantitiesTotal = (quantities: Record<string, number>) =>
  Object.values(quantities).reduce((sum, qty) => sum + Math.max(0, qty), 0)

const hasFirstRowSelection = (
  quantities: Record<string, number>,
  ringColor: string,
) =>
  firstRowKarabinerIds(ringColor).some((id) => (quantities[id] ?? 0) > 0)

/** Jedna sztuka z pierwszego wiersza gratis na całe zamówienie (kolejność wg katalogu). */
export const karabinerChargePln = (
  quantities: Record<string, number>,
  ringColor: string,
): number => {
  const firstRow = new Set(firstRowKarabinerIds(ringColor))
  let freeGrantsLeft = hasFirstRowSelection(quantities, ringColor) ? 1 : 0
  let total = 0
  for (const item of karabinersForRingColor(ringColor)) {
    const qty = Math.max(0, quantities[item.id] ?? 0)
    if (qty <= 0) continue
    const unit = karabinerUnitPricePln(item.id)
    let paidQty = qty
    if (firstRow.has(item.id) && freeGrantsLeft > 0) {
      const freeHere = Math.min(qty, freeGrantsLeft)
      paidQty = qty - freeHere
      freeGrantsLeft -= freeHere
    }
    total += paidQty * unit
  }
  return roundMoney(total)
}

export const karabinerPaidUnitsTotal = (
  quantities: Record<string, number>,
  ringColor: string,
): number => {
  const total = karabinerQuantitiesTotal(quantities)
  const freeUnits = hasFirstRowSelection(quantities, ringColor) ? 1 : 0
  return Math.max(0, total - freeUnits)
}

/** Rozkład na base + extra (magazyn, zamówienie) — każda sztuka fizycznie w base lub extra. */
export const orderKarabinersFromQuantities = (
  quantities: Record<string, number>,
  ringColor: string,
): { baseCarabiner: string; extraCarabiner: string[] } => {
  const firstRow = new Set(firstRowKarabinerIds(ringColor))
  const units: string[] = []
  for (const item of karabinersForRingColor(ringColor)) {
    const qty = Math.max(0, quantities[item.id] ?? 0)
    for (let i = 0; i < qty; i++) units.push(item.id)
  }

  if (units.length === 0) {
    return { baseCarabiner: "-", extraCarabiner: [] }
  }

  const baseIndex = units.findIndex((id) => firstRow.has(id))
  const useIndex = baseIndex >= 0 ? baseIndex : 0
  const baseCarabiner = units[useIndex]
  const extraCarabiner = units.filter((_, index) => index !== useIndex)

  return { baseCarabiner, extraCarabiner }
}

export const karabinerQuantitiesFromOrder = (
  baseCarabiner: string,
  extraCarabiner: string[],
): Record<string, number> => {
  const quantities: Record<string, number> = {}
  const add = (id: string) => {
    const trimmed = id.trim()
    if (!trimmed || trimmed === "-") return
    quantities[trimmed] = (quantities[trimmed] ?? 0) + 1
  }
  add(baseCarabiner)
  for (const id of extraCarabiner) add(id)
  return quantities
}

export const karabinerRevenueFromOrder = (
  baseCarabiner: string,
  extraCarabiner: string[],
  ringColor: string,
) =>
  karabinerChargePln(
    karabinerQuantitiesFromOrder(baseCarabiner, extraCarabiner),
    ringColor,
  )

export type KarabinerDisplayItem = KarabinerOption & {
  pricePln: number
  firstRowFreeHint: boolean
}

export const karabinersForConfigurator = (ringColor: string): KarabinerDisplayItem[] => {
  const firstRow = new Set(firstRowKarabinerIds(ringColor))
  return karabinersForRingColor(ringColor).map((item) => ({
    ...item,
    pricePln: karabinerUnitPricePln(item.id),
    firstRowFreeHint: firstRow.has(item.id),
  }))
}
