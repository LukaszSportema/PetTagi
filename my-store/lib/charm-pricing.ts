import {
  CHARM_LABEL_OPTIONS,
  optionLabel,
  type CharmCatalogItem,
} from "@/lib/catalog-options"
import {
  buildDefaultCharmUnitPrices,
  mergeCharmUnitPrices,
  type CharmUnitPrices,
} from "@/lib/charm-unit-pricing"
import { EXTRA_CHARM_PRICE } from "@/lib/pricing-constants"

export type { CharmUnitPrices } from "@/lib/charm-unit-pricing"
export { buildDefaultCharmUnitPrices, mergeCharmUnitPrices } from "@/lib/charm-unit-pricing"

const fallbackCharmUnitPricePln = (charmId: string): number =>
  buildDefaultCharmUnitPrices()[charmId] ?? EXTRA_CHARM_PRICE

export const charmUnitPricePln = (
  charmId: string,
  prices?: CharmUnitPrices,
): number => prices?.[charmId] ?? fallbackCharmUnitPricePln(charmId)

export const charmsTotalPln = (
  charmIds: readonly string[],
  prices?: CharmUnitPrices,
): number => charmIds.reduce((sum, id) => sum + charmUnitPricePln(id, prices), 0)

/** Wiersz w podsumowaniu / koszyku / mailu, np. „Serce (+4 zł)”. */
export const charmSummaryLine = (
  charmId: string,
  label?: string,
  prices?: CharmUnitPrices,
): string => {
  const name = (label?.trim() || optionLabel(CHARM_LABEL_OPTIONS, charmId)).trim()
  const price = charmUnitPricePln(charmId, prices)
  return `${name} (+${price} zł)`
}

/** Pomocniczo przy edycji katalogu — domyślna cena, gdy pole nie ustawione. */
export const resolveCharmPricePln = (item: Pick<CharmCatalogItem, "pricePln">): number =>
  item.pricePln ?? EXTRA_CHARM_PRICE
