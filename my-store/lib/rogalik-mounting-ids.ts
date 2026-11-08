/**
 * Id wariantów mocowania rogalika (krok MODEL) — jeden moduł bez importu z rogalalik-options/pricing,
 * żeby uniknąć cykli ES modules i błędu „Cannot access before initialization”.
 */
/** Kolejność kafli w kroku MODEL (2×2: lewy-góra, prawy-góra, lewy-dół, prawy-dół). */
export const ROGALIK_MOUNTING_IDS = [
  "karabinczyk",
  "sznureczek",
  "koraliki",
  "sznureczek-karabinczyk",
] as const

export type RogalikMountingId = (typeof ROGALIK_MOUNTING_IDS)[number]

/** Cena bazowa (punkt wyjścia) per wariant mocowania. */
export type RogalikMountingBasePrices = Record<RogalikMountingId, number>

/** Domyślna cena bazowa rogalika (gdy brak ustawień) — stała bez cykli importów. */
export const ROGALIK_BASE_PRICE = 50
