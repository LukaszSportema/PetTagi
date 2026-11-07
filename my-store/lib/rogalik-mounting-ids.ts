/**
 * Id wariantów mocowania rogalika (krok MODEL) — jeden moduł bez importu z rogalalik-options/pricing,
 * żeby uniknąć cykli ES modules i błędu „Cannot access before initialization”.
 */
export const ROGALIK_MOUNTING_IDS = [
  "koraliki",
  "karabinczyk",
  "sznureczek",
  "sznureczek-karabinczyk",
] as const

export type RogalikMountingId = (typeof ROGALIK_MOUNTING_IDS)[number]

/** Cena bazowa (punkt wyjścia) per wariant mocowania. */
export type RogalikMountingBasePrices = Record<RogalikMountingId, number>

/** Domyślna cena bazowa rogalika (gdy brak ustawień) — stała bez cykli importów. */
export const ROGALIK_BASE_PRICE = 50
