import { ROGALIK_BEADS_PRICES, rogalikBeadsUnitPrice } from "@/lib/rogalik-options"
import type { StringSize } from "@/lib/pricing"

/** Cena naszyjnika z koralikami — ta sama tabela co rogalik (S/M/L); XL jak L. */
export const beadNecklaceUnitPrice = (size: StringSize | null): number | null => {
  if (!size) return null
  if (size === "XL") return ROGALIK_BEADS_PRICES.L
  return rogalikBeadsUnitPrice(size)
}

export const beadNecklaceCostPln = (
  size: StringSize | null,
  selectedColorCount: number,
): number => {
  if (selectedColorCount < 1) return 0
  const unit = beadNecklaceUnitPrice(size) ?? 0
  // 1 lub 2 rodzaje koralików — jedna stawka (jak za jeden wybór rozmiaru).
  return unit
}
