import { BEAD_NECKLACE_TAG_MODEL_ID } from "@/lib/catalog-options"

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

export const beadNecklacePaidAddonOrder = (ringColor?: string): BeadNecklacePaidAddonKind[] => {
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
  if (ringColor?.trim() === "kwiat") {
    return order.filter((kind) => kind !== "sticker")
  }
  return order
}

/** Kolejność addonów — model „Na sznurku (bez karabińczyka)” (bez koralików). */
export const stringWithoutKarabinerPaidAddonOrder = (
  ringColor?: string,
): BeadNecklacePaidAddonKind[] =>
  beadNecklacePaidAddonOrder(ringColor).filter((kind) => kind !== "beadNecklace")

/** Kolejność addonów — model „Sama adresówka z karabińczykiem”. */
export const tagOnlyWithKarabinerPaidAddonOrder = (
  ringColor?: string,
): BeadNecklacePaidAddonKind[] => {
  const order: BeadNecklacePaidAddonKind[] = ["sticker", "karabiners", "charms", "dialCode"]
  if (ringColor?.trim() === "kwiat") {
    return order.filter((kind) => kind !== "sticker")
  }
  return order
}

export type ConfiguratorSummaryAddonKind = BeadNecklacePaidAddonKind | JewelryConfiguratorAddonKind

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
}): JewelryConfiguratorAddonKind[] => {
  if (isBeadNecklaceTagModel(input.tagModel)) {
    return ["sticker", "charms", "karabiners"]
  }
  const ring = input.ringColor?.trim() ?? ""
  const withStickers = input.configuratorId === "classic-tag" && ring !== "kwiat"
  if (withStickers) {
    return ["sticker", "karabiners", "charms"]
  }
  return ["charms", "karabiners"]
}

export const appendBeadNecklaceOrderedOptions = (
  target: JewelryConfiguratorOptionBlock[],
  input: {
    ringColor: string
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
  for (const kind of beadNecklacePaidAddonOrder(input.ringColor)) {
    const block = input[kind]
    if (block) target.push(block)
  }
}

export const appendJewelryConfiguratorAddonOptions = (
  target: JewelryConfiguratorOptionBlock[],
  input: {
    configuratorId?: string | null
    ringColor: string
    tagModel?: string | null
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
