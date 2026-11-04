import { CLASSIC_TAG_PRODUCT, LEGACY_CLASSIC_TAG_SLUG } from "@/lib/catalog"
import type { CharmMountingId } from "@/lib/catalog-options"
import { tagModelLabel, stickerLabel } from "@/lib/catalog-options"

export type ConfiguratorStepMeta = {
  key: string
  label: string
  order: number
}

export const CONFIGURATOR_STEP_CATALOG: ConfiguratorStepMeta[] = [
  { key: "13", label: "Model", order: 0 },
  { key: "1", label: "Oprawa", order: 1 },
  { key: "2", label: "Baza", order: 2 },
  { key: "12", label: "NAPIS", order: 3 },
  { key: "3", label: "CHARMS (ZAWIESZKI)", order: 4 },
  { key: "4", label: "Dodatkowe charmsy", order: 5 },
  { key: "5", label: "Karabińczyki", order: 6 },
  { key: "6", label: "Dodatkowe karabińczyki (legacy)", order: 7 },
  { key: "7", label: "Sznurek", order: 8 },
  { key: "8", label: "Stopery", order: 9 },
  { key: "9", label: "GRAFIKI I DODATKI", order: 10 },
  { key: "10", label: "Dane na adresówce", order: 11 },
  { key: "11", label: "Podsumowanie zamówienia", order: 12 },
]

export type ConfiguratorChoiceInput = {
  choiceKey: string
  choiceValue: string
}

export type ConfiguratorFormSnapshot = {
  tagModel: string
  ringColor: string
  glowTextColor: string
  baseOption: string
  charmMounting: CharmMountingId
  extraCharms: string[]
  wantExtraCharms: string
  karabinerOption: string
  wantExtraKarabiners: string
  extraKarabiners: string[]
  karabinerQuantities?: Record<string, number>
  wantString: string
  stringLength: string
  premiumStrings: string[]
  classicStrings: string[]
  glowStrings: string[]
  wantStopers: string
  extraStopers: string[]
  wantSticker: string
  stickerOption: string
  petName: string
  nameLayout: string
  includePhoneCode: string
}

export const stepLabelForProduct = (stepKey: string, productSlug: string) => {
  if (isClassicJewelrySlug(productSlug) && stepKey === "1") return "KSZTAŁT I KOLOR"
  if (isClassicJewelrySlug(productSlug) && stepKey === "9") return "GRAFIKI I DODATKI"
  if ((isClassicJewelrySlug(productSlug) || productSlug.includes("glow")) && stepKey === "3") {
    return "CHARMS (ZAWIESZKI)"
  }
  if ((isClassicJewelrySlug(productSlug) || productSlug.includes("glow")) && stepKey === "7") {
    return "SZNUREK I STOPERY"
  }
  if (productSlug.includes("glow") && stepKey === "2") return "Kolor"
  return CONFIGURATOR_STEP_CATALOG.find((step) => step.key === stepKey)?.label ?? `Krok ${stepKey}`
}

const isClassicJewelrySlug = (productSlug: string) =>
  productSlug === CLASSIC_TAG_PRODUCT.slug || productSlug === LEGACY_CLASSIC_TAG_SLUG

const CLASSIC_JEWELRY_STEP_KEY_ORDER = [
  "13",
  "1",
  "9",
  "5",
  "3",
  "7",
  "10",
  "11",
] as const

export const visibleStepKeys = (productSlug: string, ringColor: string) => {
  const isGlow = productSlug.includes("glow")
  const skipsGraphics = isGlow || ringColor === "kwiat"

  if (isClassicJewelrySlug(productSlug)) {
    return CLASSIC_JEWELRY_STEP_KEY_ORDER.filter((key) => {
      if (skipsGraphics && key === "9") return false
      return true
    })
  }

  return CONFIGURATOR_STEP_CATALOG.filter((step) => {
    if (step.key === "13") return isClassicJewelrySlug(productSlug)
    if (step.key === "2" && isClassicJewelrySlug(productSlug)) return false
    if ((isClassicJewelrySlug(productSlug) || isGlow) && step.key === "4") return false
    if (isGlow && step.key === "1") return false
    if (!isGlow && step.key === "12") return false
    if (skipsGraphics && step.key === "9") return false
    return true
  }).map((step) => step.key)
}

export const extractStepChoices = (
  stepKey: string,
  form: ConfiguratorFormSnapshot,
): ConfiguratorChoiceInput[] => {
  switch (stepKey) {
    case "13":
      return [
        {
          choiceKey: "model",
          choiceValue: form.tagModel ? tagModelLabel(form.tagModel) : "—",
        },
      ]
    case "1":
      return [
        { choiceKey: "oprawa", choiceValue: form.ringColor || "—" },
        ...(form.ringColor &&
        form.ringColor !== "glow" &&
        form.baseOption
          ? [{ choiceKey: "baza", choiceValue: form.baseOption }]
          : []),
      ]
    case "2":
      return [
        { choiceKey: "baza", choiceValue: form.baseOption || "—" },
        ...(form.glowTextColor
          ? [{ choiceKey: "kolor_napisu", choiceValue: form.glowTextColor }]
          : []),
      ]
    case "12":
      return [{ choiceKey: "napis", choiceValue: form.glowTextColor || "—" }]
    case "3":
      return [
        { choiceKey: "charms", choiceValue: form.wantExtraCharms },
        ...(form.wantExtraCharms === "tak" && form.extraCharms.length
          ? form.extraCharms.map((id, index) => ({
              choiceKey: `charms_${index + 1}`,
              choiceValue: id,
            }))
          : []),
      ]
    case "4":
      return []
    case "5":
      if (form.karabinerQuantities && Object.keys(form.karabinerQuantities).length > 0) {
        return Object.entries(form.karabinerQuantities)
          .filter(([, qty]) => qty > 0)
          .map(([id, qty]) => ({
            choiceKey: `karabinczyk_${id}`,
            choiceValue: String(qty),
          }))
      }
      return [
        { choiceKey: "karabinczyk", choiceValue: form.karabinerOption || "—" },
        { choiceKey: "dodatkowe_karabinczyki", choiceValue: form.wantExtraKarabiners },
        ...(form.extraKarabiners.length
          ? form.extraKarabiners.map((item, index) => ({
              choiceKey: `karabinczyk_${index + 1}`,
              choiceValue: item,
            }))
          : []),
      ]
    case "6":
      return []
    case "7":
      return [
        { choiceKey: "sznurek", choiceValue: form.wantString },
        { choiceKey: "obwod", choiceValue: form.stringLength || "—" },
        ...(form.premiumStrings.length
          ? [{ choiceKey: "sznurek_premium", choiceValue: form.premiumStrings.join(", ") }]
          : []),
        ...(form.classicStrings.length
          ? [{ choiceKey: "sznurek_klasyczny", choiceValue: form.classicStrings.join(", ") }]
          : []),
        ...(form.glowStrings.length
          ? [{ choiceKey: "sznurek_glow", choiceValue: form.glowStrings.join(", ") }]
          : []),
        { choiceKey: "stopery", choiceValue: form.wantStopers },
        ...(form.extraStopers.length
          ? [{ choiceKey: "stopery_wybor", choiceValue: form.extraStopers.join(", ") }]
          : []),
      ]
    case "8":
      return []
    case "9":
      return [
        { choiceKey: "naklejka", choiceValue: form.wantSticker },
        { choiceKey: "grafika", choiceValue: form.stickerOption ? stickerLabel(form.stickerOption) : "—" },
      ]
    case "10":
      return [
        { choiceKey: "imie", choiceValue: form.petName || "—" },
        { choiceKey: "uklad", choiceValue: form.nameLayout },
        { choiceKey: "kierunkowy", choiceValue: form.includePhoneCode },
      ]
    case "11":
      return [{ choiceKey: "podsumowanie", choiceValue: "dotarto" }]
    default:
      return []
  }
}

export type ConfiguratorFunnelStep = {
  stepKey: string
  stepLabel: string
  stepIndex: number
  users: number
  avgDurationMs: number
  dropOffRate: number | null
}

export type ConfiguratorChoiceStat = {
  stepKey: string
  stepLabel: string
  choiceKey: string
  choiceValue: string
  count: number
}

export type ConfiguratorAnalyticsReport = {
  startedSessions: number
  avgCompletionMs: number
  conversionRate: number
  funnel: ConfiguratorFunnelStep[]
  choices: ConfiguratorChoiceStat[]
}

export const formatDuration = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) return "—"
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds} s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`
}

export const formatPercent = (value: number) =>
  `${value.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}%`
