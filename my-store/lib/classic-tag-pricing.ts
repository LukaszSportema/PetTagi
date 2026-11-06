import { getCatalogProduct } from "@/lib/catalog"
import { beadNecklacePaidAddonOrder, stringWithoutKarabinerPaidAddonOrder, tagOnlyWithKarabinerPaidAddonOrder } from "@/lib/configurator-options-order"
import {
  BEAD_NECKLACE_TAG_MODEL_ID,
  isStringWithoutKarabinerTagModel,
  isTagOnlyWithKarabinerTagModel,
  tagModelKarabinersAllUnitsPaid,
  tagModelLabel,
  tagModelSkipsStringAndStopperAddonCharges,
} from "@/lib/catalog-options"
import { beadNecklaceCostPln } from "@/lib/bead-necklace-pricing"
import { charmsTotalPln } from "@/lib/charm-pricing"
import type { CharmUnitPrices } from "@/lib/charm-unit-pricing"
import {
  inferGlowTextColorFromKarabiners,
  karabinerCatalogRingKey,
  karabinerRevenueFromOrder,
  orderKarabinersFromQuantities,
} from "@/lib/karabiner-pricing"
import type { RogalikPriceLine } from "@/lib/rogalik-pricing"
import {
  baseTagPrice,
  classicStringUnitPrice,
  DIAL_CODE_PRICE,
  glowStringUnitPrice,
  premiumStringUnitPrice,
  STOPPER_PRICE,
  stickerUnitPricePln,
  stringSizeFromNeckCm,
  stringSizeLabel,
} from "@/lib/pricing"
import { classicTagCatalogBaseUnitPrice, OPRAWA_KWIAT_SURCHARGE_PLN, type TagModelBasePrices } from "@/lib/tag-model-pricing"

export type ClassicTagPricingContext = {
  charmPrices?: CharmUnitPrices
  tagModelBasePrices?: TagModelBasePrices
}

export type ClassicTagPricingInput = {
  productSlug: string
  tagModel?: string | null
  ringColor: string
  baseCarabiner?: string
  extraCharms: string[]
  extraCarabiner: string[]
  stringPremium: string[]
  stringClassic: string[]
  stringGlow: string[]
  dogNeck?: string | null
  stoppers: string | null
  sticker: string | null
  dialCodeInfo?: boolean
  beadNecklaceColors?: string[]
}

const karabinerRingKey = (input: ClassicTagPricingInput) => {
  const product = getCatalogProduct(input.productSlug)
  const glowTextColor =
    product?.configuratorId === "glow-tag"
      ? inferGlowTextColorFromKarabiners(input.baseCarabiner ?? "-", input.extraCarabiner)
      : ""
  return karabinerCatalogRingKey({
    configuratorId: product?.configuratorId,
    ringColor: input.ringColor,
    glowTextColor,
  })
}

/** Pozycje cenowe klasycznej / glow adresówki (koszyk, maile, podsumowania). */
export const classicTagPriceBreakdown = (
  input: ClassicTagPricingInput,
  ctx: ClassicTagPricingContext = {},
): RogalikPriceLine[] => {
  const product = getCatalogProduct(input.productSlug)
  const configuratorId = product?.configuratorId
  if (configuratorId !== "classic-tag" && configuratorId !== "glow-tag") return []

  const lines: RogalikPriceLine[] = []
  const baseUnit =
    configuratorId === "glow-tag"
      ? baseTagPrice("glow")
      : classicTagCatalogBaseUnitPrice({
          tagModel: input.tagModel,
          ringColor: input.ringColor,
          tagModelBasePrices: ctx.tagModelBasePrices,
        })

  const baseLabel =
    configuratorId === "glow-tag"
      ? "Adresówka Glow"
      : input.tagModel?.trim()
        ? tagModelLabel(input.tagModel)
        : "Adresówka"

  lines.push({ label: baseLabel, amountPln: baseUnit, isBase: true })

  if (configuratorId === "classic-tag" && input.ringColor === "kwiat") {
    lines.push({ label: "Oprawa kwiat", amountPln: OPRAWA_KWIAT_SURCHARGE_PLN })
  }

  const size = stringSizeFromNeckCm(input.dogNeck)
  const sizeText = stringSizeLabel(size)
  const isBead = input.tagModel === BEAD_NECKLACE_TAG_MODEL_ID
  const skipStringsStopperCharges = tagModelSkipsStringAndStopperAddonCharges(input.tagModel)
  const skipsSticker = configuratorId === "glow-tag" || input.ringColor === "kwiat"
  const ring = karabinerRingKey(input)

  const pushLine = (line: RogalikPriceLine | null) => {
    if (line) lines.push(line)
  }

  const stickerLine: RogalikPriceLine | null =
    !skipsSticker && input.sticker
      ? { label: "Naklejka", amountPln: stickerUnitPricePln(input.sticker) }
      : null

  const colorCount = input.beadNecklaceColors?.length ?? 0
  const beadLine: RogalikPriceLine | null =
    isBead && colorCount > 0
      ? (() => {
          const amount = beadNecklaceCostPln(size, colorCount)
          if (amount <= 0) return null
          const detailParts = [sizeText].filter(Boolean)
          return {
            label: "Koraliki",
            amountPln: amount,
            detail: detailParts.length > 0 ? detailParts.join(" · ") : undefined,
          }
        })()
      : null

  const premiumUnit = premiumStringUnitPrice(size) ?? 0
  const classicUnit = classicStringUnitPrice(size) ?? 0
  const glowUnit = glowStringUnitPrice(size) ?? 0

  const premiumStringsLine: RogalikPriceLine | null =
    !skipStringsStopperCharges &&
    input.stringPremium.length > 0 &&
    premiumUnit > 0
      ? {
          label: `Sznurek Premium ×${input.stringPremium.length}`,
          amountPln: input.stringPremium.length * premiumUnit,
          detail: sizeText ?? undefined,
        }
      : null
  const classicStringsLine: RogalikPriceLine | null =
    !skipStringsStopperCharges &&
    input.stringClassic.length > 0 &&
    classicUnit > 0
      ? {
          label: `Sznurek Klasyczny ×${input.stringClassic.length}`,
          amountPln: input.stringClassic.length * classicUnit,
          detail: sizeText ?? undefined,
        }
      : null
  const glowStringsLine: RogalikPriceLine | null =
    !skipStringsStopperCharges && input.stringGlow.length > 0 && glowUnit > 0
      ? {
          label: `Sznurek Glow ×${input.stringGlow.length}`,
          amountPln: input.stringGlow.length * glowUnit,
          detail: sizeText ?? undefined,
        }
      : null

  const charmsTotal = charmsTotalPln(input.extraCharms, ctx.charmPrices)
  const charmsLine: RogalikPriceLine | null =
    charmsTotal > 0
      ? { label: `Charmsy ×${input.extraCharms.length}`, amountPln: charmsTotal }
      : null

  const karabinerCharge = karabinerRevenueFromOrder(
        input.baseCarabiner ?? "-",
        input.extraCarabiner,
        ring,
        tagModelKarabinersAllUnitsPaid(input.tagModel) ? { allUnitsPaid: true } : undefined,
      )
  const karabinersLine: RogalikPriceLine | null =
    karabinerCharge > 0 ? { label: "Karabińczyki", amountPln: karabinerCharge } : null

  const stopersLine: RogalikPriceLine | null =
    !skipStringsStopperCharges && input.stoppers
      ? { label: "Stopery", amountPln: STOPPER_PRICE }
      : null

  const dialCodeLine: RogalikPriceLine | null = input.dialCodeInfo
    ? { label: "Numer kierunkowy na adresówce", amountPln: DIAL_CODE_PRICE }
    : null

  if (isBead) {
    for (const kind of beadNecklacePaidAddonOrder(input.ringColor)) {
      switch (kind) {
        case "sticker":
          pushLine(stickerLine)
          break
        case "beadNecklace":
          pushLine(beadLine)
          break
        case "neckCircumference":
          break
        case "stringsPremium":
          pushLine(premiumStringsLine)
          break
        case "stringsClassic":
          pushLine(classicStringsLine)
          break
        case "stringsGlow":
          pushLine(glowStringsLine)
          break
        case "charms":
          pushLine(charmsLine)
          break
        case "karabiners":
          pushLine(karabinersLine)
          break
        case "stopers":
          pushLine(stopersLine)
          break
        case "dialCode":
          pushLine(dialCodeLine)
          break
      }
    }
    return lines
  }

  if (isStringWithoutKarabinerTagModel(input.tagModel)) {
    for (const kind of stringWithoutKarabinerPaidAddonOrder(input.ringColor)) {
      switch (kind) {
        case "sticker":
          pushLine(stickerLine)
          break
        case "neckCircumference":
          break
        case "stringsPremium":
          pushLine(premiumStringsLine)
          break
        case "stringsClassic":
          pushLine(classicStringsLine)
          break
        case "stringsGlow":
          pushLine(glowStringsLine)
          break
        case "charms":
          pushLine(charmsLine)
          break
        case "karabiners":
          pushLine(karabinersLine)
          break
        case "stopers":
          pushLine(stopersLine)
          break
        case "dialCode":
          pushLine(dialCodeLine)
          break
      }
    }
    return lines
  }

  if (isTagOnlyWithKarabinerTagModel(input.tagModel)) {
    for (const kind of tagOnlyWithKarabinerPaidAddonOrder(input.ringColor)) {
      switch (kind) {
        case "sticker":
          pushLine(stickerLine)
          break
        case "karabiners":
          pushLine(karabinersLine)
          break
        case "charms":
          pushLine(charmsLine)
          break
        case "dialCode":
          pushLine(dialCodeLine)
          break
      }
    }
    return lines
  }

  pushLine(charmsLine)
  pushLine(karabinersLine)
  pushLine(premiumStringsLine)
  pushLine(classicStringsLine)
  pushLine(glowStringsLine)
  pushLine(stopersLine)
  pushLine(stickerLine)
  pushLine(dialCodeLine)

  return lines
}

export const classicTagPriceBreakdownTotal = (lines: RogalikPriceLine[]) =>
  lines.reduce((sum, line) => sum + line.amountPln, 0)

/** Rozbicie z wiersza koszyka (karabińczyki z ilości). */
export const classicCartPriceBreakdown = (
  item: import("@/lib/order-from-cart").CartItemForOrder,
  ctx: ClassicTagPricingContext = {},
): RogalikPriceLine[] => {
  const product = getCatalogProduct(item.productSlug)
  if (product?.configuratorId !== "classic-tag" && product?.configuratorId !== "glow-tag") {
    return []
  }

  const config = item.config
  const ring = karabinerCatalogRingKey({
    configuratorId: product.configuratorId,
    ringColor: config.ringColor,
    glowTextColor: config.glowTextColor ?? "",
  })
  const usesQuantityKarabiners =
    config.karabinerQuantities && Object.keys(config.karabinerQuantities).length > 0
  const karabiners = usesQuantityKarabiners
    ? orderKarabinersFromQuantities(config.karabinerQuantities!, ring)
    : {
        baseCarabiner: config.karabinerOption,
        extraCarabiner: config.wantExtraKarabiners === "tak" ? config.extraKarabiners : [],
      }

  const skipsSticker = product.configuratorId === "glow-tag" || config.ringColor === "kwiat"

  return classicTagPriceBreakdown(
    {
      productSlug: item.productSlug,
      tagModel: config.tagModel,
      ringColor: config.ringColor,
      baseCarabiner: karabiners.baseCarabiner,
      extraCharms: config.wantExtraCharms === "tak" ? config.extraCharms : [],
      extraCarabiner: karabiners.extraCarabiner,
      stringPremium: config.premiumStrings,
      stringClassic: config.classicStrings,
      stringGlow: config.glowStrings,
      dogNeck: config.stringLength ? `${config.stringLength} cm` : null,
      stoppers:
        config.wantStopers === "tak"
          ? config.extraStopers[0] ?? (ring === "srebrny" ? "2" : "1")
          : null,
      sticker:
        skipsSticker || config.wantSticker !== "tak" ? null : config.stickerOption || null,
      dialCodeInfo: config.includePhoneCode === "tak",
      beadNecklaceColors: config.beadNecklaceColors ?? [],
    },
    ctx,
  )
}
