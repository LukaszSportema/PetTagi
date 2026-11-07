import {
  karabinerChargePln,
  karabinerQuantitiesTotal,
  type KarabinerCatalogRingKey,
} from "@/lib/karabiner-pricing"
import { charmUnitPricePln, type CharmUnitPrices } from "@/lib/charm-pricing"
import {
  DIAL_CODE_PRICE,
  EXTRA_KARABINER_PRICE,
  stringSizeLabel,
  type StringSize,
} from "@/lib/pricing"
import {
  ROGALIK_BASE_PRICE,
  ROGALIK_CHARM_OPTIONS,
  rogalikBeadsUnitPrice,
  rogalikCordUnitPrice,
  rogalikMountingUsesBeads,
  rogalikOptionLabel,
  rogalikStringSizeFromNeckCm,
} from "@/lib/rogalik-options"

export type RogalikPriceLine = {
  label: string
  amountPln: number
  /** Np. rozmiar sznurka/koralików lub stawka za szt. */
  detail?: string
  /** Pozycja bazowa (bez plusa w UI). */
  isBase?: boolean
}

export type RogalikPricingInput = {
  rogalikMounting: string
  /** Obwód w cm z konfiguratora / koszyka. */
  stringLength?: string
  /** Zapis w zamówieniu, np. „16 cm (Rozmiar S)”. */
  dogNeck?: string | null
  rogalikCordColor?: string | null
  rogalikBeads?: string | null
  rogalikCharms?: string[]
  extraKarabiners?: string[]
  karabinerQuantities?: Record<string, number>
  karabinerCatalogRingKey?: KarabinerCatalogRingKey
  includeDialCode?: boolean
  charmUnitPrices?: CharmUnitPrices
  /** Cena bazowa z admina / snapshotu; domyślnie ROGALIK_BASE_PRICE. */
  baseUnitPricePln?: number | null
}

const neckCmFromStored = (dogNeck: string | null | undefined): string | undefined => {
  if (!dogNeck?.trim()) return undefined
  const match = dogNeck.trim().match(/^(\d{1,2})/)
  return match?.[1]
}

const resolveStringSize = (input: RogalikPricingInput): StringSize | null => {
  const fromConfig = rogalikStringSizeFromNeckCm(input.stringLength)
  if (fromConfig) return fromConfig
  return rogalikStringSizeFromNeckCm(neckCmFromStored(input.dogNeck))
}

const resolveRogalikBaseUnitPln = (input: RogalikPricingInput): number => {
  const v = input.baseUnitPricePln
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
    return Math.round(v * 100) / 100
  }
  return ROGALIK_BASE_PRICE
}

/** Pozycje cenowe rogalika (konfigurator, koszyk, zamówienia, maile). */
export const rogalikPriceBreakdown = (input: RogalikPricingInput): RogalikPriceLine[] => {
  const basePln = resolveRogalikBaseUnitPln(input)
  const lines: RogalikPriceLine[] = [
    { label: "Adresówka rogalik", amountPln: basePln, isBase: true },
  ]
  const mounting = input.rogalikMounting ?? ""
  const usesBeads = rogalikMountingUsesBeads(mounting)
  const size = resolveStringSize(input)
  const sizeText = stringSizeLabel(size)

  if (input.rogalikCordColor) {
    const unit = rogalikCordUnitPrice(size)
    if (unit !== null) {
      lines.push({
        label: "Sznureczek",
        amountPln: unit,
        detail: sizeText ?? undefined,
      })
    }
  }
  if (input.rogalikBeads) {
    const unit = rogalikBeadsUnitPrice(size)
    if (unit !== null) {
      lines.push({
        label: "Koraliki",
        amountPln: unit,
        detail: sizeText ?? undefined,
      })
    }
  }
  for (const charmId of input.rogalikCharms ?? []) {
    const unit = charmUnitPricePln(charmId, input.charmUnitPrices)
    lines.push({
      label: rogalikOptionLabel(ROGALIK_CHARM_OPTIONS, charmId),
      amountPln: unit,
      detail: `${unit} zł`,
    })
  }
  if (!usesBeads) {
    const karabinerQtyTotal = input.karabinerQuantities
      ? karabinerQuantitiesTotal(input.karabinerQuantities)
      : 0
    if (karabinerQtyTotal > 0 && input.karabinerQuantities) {
      const ringKey = input.karabinerCatalogRingKey ?? "złoty"
      const charge = karabinerChargePln(input.karabinerQuantities, ringKey)
      lines.push({
        label: `Karabińczyki ×${karabinerQtyTotal}`,
        amountPln: charge,
      })
    } else {
      const extraCount = input.extraKarabiners?.length ?? 0
      if (extraCount > 0) {
        lines.push({
          label: `Dodatkowe karabińczyki ×${extraCount}`,
          amountPln: extraCount * EXTRA_KARABINER_PRICE,
          detail: `${EXTRA_KARABINER_PRICE} zł/szt`,
        })
      }
    }
  }

  if (input.includeDialCode) {
    lines.push({ label: "Numer kierunkowy na adresówce", amountPln: DIAL_CODE_PRICE })
  }

  return lines
}

export const rogalikPriceBreakdownTotal = (lines: RogalikPriceLine[]) =>
  lines.reduce((sum, line) => sum + line.amountPln, 0)
