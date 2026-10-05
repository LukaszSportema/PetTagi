import {
  DIAL_CODE_PRICE,
  EXTRA_CHARM_PRICE,
  EXTRA_KARABINER_PRICE,
  stringSizeLabel,
  type StringSize,
} from "@/lib/pricing"
import {
  ROGALIK_BASE_PRICE,
  ROGALIK_MOUNTING_KARABINER_PRICE,
  rogalikBeadsUnitPrice,
  rogalikCordUnitPrice,
  rogalikMountingUsesBeads,
  rogalikMountingUsesKarabinczyk,
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
  includeDialCode?: boolean
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

/** Pozycje cenowe rogalika (konfigurator, koszyk, zamówienia, maile). */
export const rogalikPriceBreakdown = (input: RogalikPricingInput): RogalikPriceLine[] => {
  const lines: RogalikPriceLine[] = [
    { label: "Adresówka rogalik", amountPln: ROGALIK_BASE_PRICE, isBase: true },
  ]
  const mounting = input.rogalikMounting ?? ""
  const usesBeads = rogalikMountingUsesBeads(mounting)
  const size = resolveStringSize(input)
  const sizeText = stringSizeLabel(size)

  if (usesBeads) {
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
    const charmCount = input.rogalikCharms?.length ?? 0
    if (charmCount > 0) {
      lines.push({
        label: `Charmsy ×${charmCount}`,
        amountPln: charmCount * EXTRA_CHARM_PRICE,
        detail: `${EXTRA_CHARM_PRICE} zł/szt`,
      })
    }
  } else {
    if (rogalikMountingUsesKarabinczyk(mounting)) {
      lines.push({ label: "Karabińczyk", amountPln: ROGALIK_MOUNTING_KARABINER_PRICE })
    }
    const extraCount = input.extraKarabiners?.length ?? 0
    if (extraCount > 0) {
      lines.push({
        label: `Dodatkowe karabińczyki ×${extraCount}`,
        amountPln: extraCount * EXTRA_KARABINER_PRICE,
        detail: `${EXTRA_KARABINER_PRICE} zł/szt`,
      })
    }
  }

  if (input.includeDialCode) {
    lines.push({ label: "Numer kierunkowy na adresówce", amountPln: DIAL_CODE_PRICE })
  }

  return lines
}

export const rogalikPriceBreakdownTotal = (lines: RogalikPriceLine[]) =>
  lines.reduce((sum, line) => sum + line.amountPln, 0)
