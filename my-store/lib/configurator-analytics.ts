import type { CharmMountingId } from "@/lib/catalog-options"

export type ConfiguratorStepMeta = {
  key: string
  label: string
  order: number
}

export const CONFIGURATOR_STEP_CATALOG: ConfiguratorStepMeta[] = [
  { key: "1", label: "Oprawa", order: 1 },
  { key: "2", label: "Baza", order: 2 },
  { key: "12", label: "NAPIS", order: 3 },
  { key: "3", label: "Darmowy charms", order: 4 },
  { key: "4", label: "Dodatkowe charmsy", order: 5 },
  { key: "5", label: "Darmowy karabińczyk", order: 6 },
  { key: "6", label: "Dodatkowe karabińczyki", order: 7 },
  { key: "7", label: "Sznurek", order: 8 },
  { key: "8", label: "Stopery", order: 9 },
  { key: "9", label: "GRAFIKA", order: 10 },
  { key: "10", label: "Dane na adresówce", order: 11 },
  { key: "11", label: "Podsumowanie zamówienia", order: 12 },
]

export type ConfiguratorChoiceInput = {
  choiceKey: string
  choiceValue: string
}

export type ConfiguratorFormSnapshot = {
  ringColor: string
  glowTextColor: string
  baseOption: string
  charmOption: string
  charmMounting: CharmMountingId
  wantExtraCharms: string
  extraCharms: string[]
  karabinerOption: string
  wantExtraKarabiners: string
  extraKarabiners: string[]
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
  if (productSlug.includes("glow") && stepKey === "2") return "Kolor"
  return CONFIGURATOR_STEP_CATALOG.find((step) => step.key === stepKey)?.label ?? `Krok ${stepKey}`
}

export const visibleStepKeys = (productSlug: string, ringColor: string) => {
  const isGlow = productSlug.includes("glow")
  const skipsGraphics = isGlow || ringColor === "kwiat"
  return CONFIGURATOR_STEP_CATALOG.filter((step) => {
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
    case "1":
      return [{ choiceKey: "oprawa", choiceValue: form.ringColor || "—" }]
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
        { choiceKey: "charms", choiceValue: form.charmOption || "—" },
        { choiceKey: "mocowanie", choiceValue: form.charmMounting || "—" },
      ]
    case "4":
      return [
        { choiceKey: "dodatkowe_charmsy", choiceValue: form.wantExtraCharms },
        ...(form.extraCharms.length
          ? form.extraCharms.map((item, index) => ({
              choiceKey: `charms_${index + 1}`,
              choiceValue: item,
            }))
          : []),
      ]
    case "5":
      return [{ choiceKey: "karabinczyk", choiceValue: form.karabinerOption || "—" }]
    case "6":
      return [
        { choiceKey: "dodatkowe_karabinczyki", choiceValue: form.wantExtraKarabiners },
        ...(form.extraKarabiners.length
          ? form.extraKarabiners.map((item, index) => ({
              choiceKey: `karabinczyk_${index + 1}`,
              choiceValue: item,
            }))
          : []),
      ]
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
      ]
    case "8":
      return [
        { choiceKey: "stopery", choiceValue: form.wantStopers },
        ...(form.extraStopers.length
          ? [{ choiceKey: "stopery_wybor", choiceValue: form.extraStopers.join(", ") }]
          : []),
      ]
    case "9":
      return [
        { choiceKey: "naklejka", choiceValue: form.wantSticker },
        { choiceKey: "grafika", choiceValue: form.stickerOption || "—" },
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
