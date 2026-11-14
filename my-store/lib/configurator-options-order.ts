import { productSkipsStickerAddons } from "@/lib/catalog"
import {
  BEAD_NECKLACE_TAG_MODEL_ID,
  isStringWithoutKarabinerTagModel,
  isTagOnlyWithKarabinerTagModel,
} from "@/lib/catalog-options"
import { rogalikAddonFlowSteps, type RogalikAddonFlowStep } from "@/lib/rogalik-options"

export type JewelryConfiguratorAddonKind = "sticker" | "karabiners" | "charms"

export type JewelryConfiguratorOptionBlock = { label: string; values: string[] }

export const isBeadNecklaceTagModel = (tagModel?: string | null) =>
  tagModel?.trim() === BEAD_NECKLACE_TAG_MODEL_ID

/**
 * Kolejność płatnych addonów — model „Naszyjnik z koralikami” (kroki: grafiki → koraliki → sznurek → charms → karabińczyki).
 */
export type BeadNecklacePaidAddonKind =
  | "sticker"
  | "beadNecklace"
  | "neckCircumference"
  | "stringsPremium"
  | "stringsClassic"
  | "stringsGlow"
  | "charms"
  | "karabiners"
  | "stopers"
  | "dialCode"

export const beadNecklacePaidAddonOrder = (
  ringColor?: string,
  productSlug?: string,
): BeadNecklacePaidAddonKind[] => {
  const order: BeadNecklacePaidAddonKind[] = [
    "sticker",
    "beadNecklace",
    "neckCircumference",
    "stringsPremium",
    "stringsClassic",
    "stringsGlow",
    "charms",
    "karabiners",
    "stopers",
    "dialCode",
  ]
  if (ringColor?.trim() === "kwiat" || (productSlug && productSkipsStickerAddons(productSlug))) {
    return order.filter((kind) => kind !== "sticker")
  }
  return order
}

/** Kolejność addonów — model „Na sznurku (bez karabińczyka)” (bez koralików). */
export const stringWithoutKarabinerPaidAddonOrder = (
  ringColor?: string,
  productSlug?: string,
): BeadNecklacePaidAddonKind[] =>
  beadNecklacePaidAddonOrder(ringColor, productSlug).filter((kind) => kind !== "beadNecklace")

/** Kolejność addonów — model „Sama adresówka z karabińczykiem”. */
export const tagOnlyWithKarabinerPaidAddonOrder = (
  ringColor?: string,
  productSlug?: string,
): BeadNecklacePaidAddonKind[] => {
  const order: BeadNecklacePaidAddonKind[] = ["sticker", "karabiners", "charms", "dialCode"]
  if (ringColor?.trim() === "kwiat" || (productSlug && productSkipsStickerAddons(productSlug))) {
    return order.filter((kind) => kind !== "sticker")
  }
  return order
}

export type ConfiguratorSummaryAddonKind =
  | BeadNecklacePaidAddonKind
  | JewelryConfiguratorAddonKind
  | "beadNecklaceDecorative"

/** Id kroku treści (contentStep) konfiguratora, na którym ustawia się dany addon. */
export const configuratorAddonKindContentStepId = (
  kind: ConfiguratorSummaryAddonKind,
  input: { tagModel?: string | null },
): number => {
  if (kind === "neckCircumference") {
    return isBeadNecklaceTagModel(input.tagModel) ? 14 : 7
  }
  const stepByKind: Record<
    Exclude<ConfiguratorSummaryAddonKind, "neckCircumference">,
    number
  > = {
    sticker: 9,
    beadNecklace: 14,
    beadNecklaceDecorative: 14,
    stringsPremium: 7,
    stringsClassic: 7,
    stringsGlow: 7,
    charms: 3,
    karabiners: 5,
    stopers: 7,
    dialCode: 10,
  }
  return stepByKind[kind]
}

/**
 * Kolejność kroków addons w konfiguratorze biżuterii (pozostałe modele):
 * - classic (z naklejkami): grafiki → karabińczyki → charms
 * - glow / kwiat: charms → karabińczyki
 */
export const jewelryConfiguratorAddonOrder = (input: {
  configuratorId?: string | null
  ringColor?: string
  tagModel?: string | null
  productSlug?: string
}): JewelryConfiguratorAddonKind[] => {
  if (isBeadNecklaceTagModel(input.tagModel)) {
    const kinds: JewelryConfiguratorAddonKind[] = ["sticker", "charms", "karabiners"]
    if (input.productSlug && productSkipsStickerAddons(input.productSlug)) {
      return kinds.filter((kind) => kind !== "sticker")
    }
    return kinds
  }
  const ring = input.ringColor?.trim() ?? ""
  const withStickers =
    input.configuratorId === "classic-tag" &&
    ring !== "kwiat" &&
    !(input.productSlug && productSkipsStickerAddons(input.productSlug))
  if (withStickers) {
    return ["sticker", "karabiners", "charms"]
  }
  return ["charms", "karabiners"]
}

export const appendBeadNecklaceOrderedOptions = (
  target: JewelryConfiguratorOptionBlock[],
  input: {
    ringColor: string
    productSlug?: string
    sticker: JewelryConfiguratorOptionBlock | null
    beadNecklace: JewelryConfiguratorOptionBlock | null
    neckCircumference: JewelryConfiguratorOptionBlock | null
    stringsPremium: JewelryConfiguratorOptionBlock | null
    stringsClassic: JewelryConfiguratorOptionBlock | null
    stringsGlow: JewelryConfiguratorOptionBlock | null
    charms: JewelryConfiguratorOptionBlock | null
    karabiners: JewelryConfiguratorOptionBlock | null
    stopers: JewelryConfiguratorOptionBlock | null
    dialCode: JewelryConfiguratorOptionBlock | null
  },
) => {
  for (const kind of beadNecklacePaidAddonOrder(input.ringColor, input.productSlug)) {
    const block = input[kind]
    if (block) target.push(block)
  }
}

const rogalikSummaryKindsForAddonStep = (
  step: RogalikAddonFlowStep,
  mounting: string,
): ConfiguratorSummaryAddonKind[] => {
  switch (step) {
    case "koraliki":
      return ["neckCircumference", "beadNecklace"]
    case "sznurek": {
      const kinds: ConfiguratorSummaryAddonKind[] = ["stringsPremium", "stringsClassic", "stopers"]
      if (mounting !== "koraliki") {
        return ["neckCircumference", ...kinds]
      }
      return kinds
    }
    case "charms":
      return ["charms"]
    case "karabinier":
      return ["karabiners"]
    default:
      return []
  }
}

/** Kolejność pozycji w podsumowaniu — zgodna z krokami rogalika. */
export const rogalikConfiguratorSummaryAddonOrder = (mounting: string): ConfiguratorSummaryAddonKind[] => {
  const kinds: ConfiguratorSummaryAddonKind[] = []
  for (const step of rogalikAddonFlowSteps(mounting)) {
    kinds.push(...rogalikSummaryKindsForAddonStep(step, mounting))
  }
  kinds.push("dialCode")
  return kinds
}

const classicContentStepAddonKinds = (
  contentStepId: number,
  input: {
    isBeadNecklace: boolean
    isTagOnlyWithKarabiner: boolean
    isGlowConfigurator: boolean
  },
): ConfiguratorSummaryAddonKind[] => {
  switch (contentStepId) {
    case 9:
      return ["sticker"]
    case 14:
      return ["neckCircumference", "beadNecklace", "beadNecklaceDecorative"]
    case 7: {
      const kinds: ConfiguratorSummaryAddonKind[] = [
        "stringsPremium",
        "stringsClassic",
        ...(input.isGlowConfigurator ? (["stringsGlow"] as const) : []),
        "stopers",
      ]
      if (!input.isBeadNecklace && !input.isTagOnlyWithKarabiner) {
        return ["neckCircumference", ...kinds]
      }
      return kinds
    }
    case 3:
      return ["charms"]
    case 5:
      return ["karabiners"]
    case 10:
      return ["dialCode"]
    default:
      return []
  }
}

const classicConfiguratorContentStepOrder = (tagModel: string): number[] => {
  if (isBeadNecklaceTagModel(tagModel)) {
    return [13, 1, 9, 14, 7, 3, 5, 10, 11]
  }
  if (isTagOnlyWithKarabinerTagModel(tagModel)) {
    return [13, 1, 9, 5, 3, 10, 11]
  }
  if (isStringWithoutKarabinerTagModel(tagModel)) {
    return [13, 1, 9, 7, 3, 5, 10, 11]
  }
  return [13, 1, 9, 5, 3, 7, 10, 11]
}

/** Kolejność pozycji w podsumowaniu — zgodna z kolejnością kroków classic / glow. */
export const classicConfiguratorSummaryAddonOrder = (input: {
  tagModel?: string | null
  configuratorId?: string | null
  productSlug?: string
}): ConfiguratorSummaryAddonKind[] => {
  const tagModel = input.tagModel?.trim() ?? ""
  if (!tagModel) return []
  const isGlow = input.configuratorId === "glow-tag"
  const skipSticker =
    input.productSlug != null && productSkipsStickerAddons(input.productSlug)
  const stepOrder = (
    isGlow ? [13, 1, 12, 3, 5, 7, 10, 11] : classicConfiguratorContentStepOrder(tagModel)
  ).filter((stepId) => !(skipSticker && stepId === 9))
  const kinds: ConfiguratorSummaryAddonKind[] = []
  for (const stepId of stepOrder) {
    kinds.push(
      ...classicContentStepAddonKinds(stepId, {
        isBeadNecklace: isBeadNecklaceTagModel(tagModel),
        isTagOnlyWithKarabiner: isTagOnlyWithKarabinerTagModel(tagModel),
        isGlowConfigurator: isGlow,
      }),
    )
  }
  return kinds
}

export const appendJewelryConfiguratorAddonOptions = (
  target: JewelryConfiguratorOptionBlock[],
  input: {
    configuratorId?: string | null
    ringColor: string
    tagModel?: string | null
    productSlug?: string
    charms: JewelryConfiguratorOptionBlock | null
    karabiners: JewelryConfiguratorOptionBlock | null
    sticker: JewelryConfiguratorOptionBlock | null
    legacyKarabiners?: JewelryConfiguratorOptionBlock[]
    legacyCharmMounting?: JewelryConfiguratorOptionBlock | null
  },
) => {
  const order = jewelryConfiguratorAddonOrder({
    configuratorId: input.configuratorId,
    ringColor: input.ringColor,
    tagModel: input.tagModel,
    productSlug: input.productSlug,
  })

  for (const kind of order) {
    if (kind === "sticker" && input.sticker) target.push(input.sticker)
    if (kind === "karabiners") {
      if (input.karabiners) {
        target.push(input.karabiners)
      } else if (input.legacyKarabiners) {
        for (const block of input.legacyKarabiners) target.push(block)
      }
    }
    if (kind === "charms") {
      if (input.charms) target.push(input.charms)
      if (input.legacyCharmMounting) target.push(input.legacyCharmMounting)
    }
  }
}
