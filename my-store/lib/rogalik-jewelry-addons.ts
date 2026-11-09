import { CLASSIC_TAG_PRODUCT } from "@/lib/catalog"
import {
  BEAD_NECKLACE_TAG_MODEL_ID,
  tagModelKarabinersAllUnitsPaid,
  tagModelSkipsStringAndStopperAddonCharges,
} from "@/lib/catalog-options"
import { classicTagAddonPriceLines } from "@/lib/classic-tag-pricing"
import { beadNecklaceCostPln } from "@/lib/bead-necklace-pricing"
import { charmsTotalPln } from "@/lib/charm-pricing"
import type { CharmUnitPrices } from "@/lib/charm-unit-pricing"
import {
  karabinerRevenueFromOrder,
  orderKarabinersFromQuantities,
  type KarabinerCatalogRingKey,
} from "@/lib/karabiner-pricing"
import {
  classicStringUnitPrice,
  glowStringUnitPrice,
  premiumStringUnitPrice,
  STOPPER_PRICE,
  stringSizeFromNeckCm,
} from "@/lib/pricing"
import { rogalikMountingToTagModel } from "@/lib/rogalik-options"

export const rogalikOrderUsesLegacyRogalikAddons = (item: {
  rogalikCordColor?: string | null
  rogalikBeads?: string | null
  rogalikCharms?: string[] | null
  beadNecklaceColors?: string[] | null
  extraCharms?: string[] | null
  stringPremium?: string[] | null
  stringClassic?: string[] | null
  stringGlow?: string[] | null
}) => {
  const hasJewelry =
    (item.beadNecklaceColors?.length ?? 0) > 0 ||
    (item.extraCharms?.length ?? 0) > 0 ||
    (item.stringPremium?.length ?? 0) > 0 ||
    (item.stringClassic?.length ?? 0) > 0 ||
    (item.stringGlow?.length ?? 0) > 0
  if (hasJewelry) return false
  return Boolean(item.rogalikCordColor || item.rogalikBeads || (item.rogalikCharms?.length ?? 0) > 0)
}

type RogalikJewelryAddonSource = {
  rogalikMounting?: string | null
  dogNeck?: string | null
  beadNecklaceColors?: string[] | null
  extraCharms?: string[] | null
  stringPremium?: string[] | null
  stringClassic?: string[] | null
  stringGlow?: string[] | null
  stoppers?: string | null
  baseCarabiner?: string | null
  extraCarabiner?: string[] | null
  karabinerQuantities?: Record<string, number>
  dialCodeInfo?: boolean
}

const karabinersFromRogalikSource = (
  source: RogalikJewelryAddonSource,
  ringKey: KarabinerCatalogRingKey,
) => {
  if (source.karabinerQuantities && Object.keys(source.karabinerQuantities).length > 0) {
    return orderKarabinersFromQuantities(source.karabinerQuantities, ringKey)
  }
  return {
    baseCarabiner: source.baseCarabiner ?? "-",
    extraCarabiner: source.extraCarabiner ?? [],
  }
}

export const rogalikJewelryAddonRevenueParts = (
  source: RogalikJewelryAddonSource,
  charmPrices?: CharmUnitPrices,
  karabinerRing: KarabinerCatalogRingKey = "złoty",
) => {
  const tagModel = rogalikMountingToTagModel(source.rogalikMounting ?? "")
  const size = stringSizeFromNeckCm(source.dogNeck)
  const skipStringsStopper = tagModelSkipsStringAndStopperAddonCharges(tagModel)
  const beadColors = source.beadNecklaceColors ?? []
  const premium = source.stringPremium ?? []
  const classic = source.stringClassic ?? []
  const glow = source.stringGlow ?? []
  const charms = charmsTotalPln(source.extraCharms ?? [], charmPrices)
  const stopperRevenue = skipStringsStopper || !source.stoppers ? 0 : STOPPER_PRICE
  const strings = skipStringsStopper
    ? 0
    : (premiumStringUnitPrice(size) ?? 0) * premium.length +
      (classicStringUnitPrice(size) ?? 0) * classic.length +
      (glowStringUnitPrice(size) ?? 0) * glow.length
  const beads =
    tagModel === BEAD_NECKLACE_TAG_MODEL_ID && beadColors.length > 0
      ? beadNecklaceCostPln(size, beadColors.length)
      : 0
  const { baseCarabiner, extraCarabiner } = karabinersFromRogalikSource(source, karabinerRing)
  const karabinerOpts = tagModelKarabinersAllUnitsPaid(tagModel)
    ? { allUnitsPaid: true as const }
    : undefined
  const karabiners = karabinerRevenueFromOrder(
    baseCarabiner,
    extraCarabiner,
    karabinerRing,
    karabinerOpts,
  )

  return {
    charms,
    karabiners,
    strings,
    beads,
    stoppers: stopperRevenue,
  }
}

export const rogalikJewelryAddonPriceLines = (
  source: RogalikJewelryAddonSource,
  charmPrices?: CharmUnitPrices,
  karabinerRing: KarabinerCatalogRingKey = "złoty",
) => {
  const tagModel = rogalikMountingToTagModel(source.rogalikMounting ?? "")
  if (!tagModel) return []
  const { baseCarabiner, extraCarabiner } = karabinersFromRogalikSource(source, karabinerRing)
  return classicTagAddonPriceLines(
    {
      productSlug: CLASSIC_TAG_PRODUCT.slug,
      tagModel,
      ringColor: "złoty",
      baseCarabiner,
      extraCharms: source.extraCharms ?? [],
      extraCarabiner,
      stringPremium: source.stringPremium ?? [],
      stringClassic: source.stringClassic ?? [],
      stringGlow: source.stringGlow ?? [],
      dogNeck: source.dogNeck,
      stoppers: source.stoppers ?? null,
      sticker: null,
      dialCodeInfo: source.dialCodeInfo,
      beadNecklaceColors: source.beadNecklaceColors ?? [],
    },
    { charmPrices },
  )
}
