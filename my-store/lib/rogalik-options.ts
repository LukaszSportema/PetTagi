import {
  parseNeckCircumferenceCm,
  type StringSize,
} from "@/lib/pricing"

export const ROGALIK_NECK_MIN = 16
export const ROGALIK_NECK_MAX = 50

/** Rogalik: S 16–24 cm, M 25–34 cm, L 35–50 cm (bez XL). */
export const rogalikStringSizeFromNeckCm = (value: string | null | undefined): StringSize | null => {
  const cm = parseNeckCircumferenceCm(value)
  if (cm === null || cm < ROGALIK_NECK_MIN || cm > ROGALIK_NECK_MAX) return null
  if (cm <= 24) return "S"
  if (cm <= 34) return "M"
  return "L"
}

export const isValidRogalikNeckCircumference = (value: string | null | undefined) =>
  rogalikStringSizeFromNeckCm(value) !== null

/** Numer na tagu rogalika: 9 cyfr, bez zera na początku. */
export const isValidRogalikPhoneNumber = (digits: string) =>
  /^\d{9}$/.test(digits.trim()) && !digits.trim().startsWith("0")

export const ROGALIK_BASE_PRICE = 50

/** Dopłata za mocowanie „Na karabińczyku” (karabińczyk w komplecie). */
export const ROGALIK_MOUNTING_KARABINER_PRICE = 5

/** Dopłata za sznureczek wg rozmiaru (obwód szyi → S / M / L / XL). */
export const ROGALIK_CORD_PRICES: Record<StringSize, number> = {
  S: 9,
  M: 12,
  L: 15,
  XL: 15,
}

export const rogalikCordUnitPrice = (size: StringSize | null) =>
  size ? ROGALIK_CORD_PRICES[size] : null

/** Koraliki — cena wg rozmiaru sznurka (S / M / L). */
export const ROGALIK_BEADS_PRICES: Record<"S" | "M" | "L", number> = {
  S: 16,
  M: 18,
  L: 21,
}

export const rogalikBeadsUnitPrice = (size: StringSize | null) => {
  if (size === "S" || size === "M" || size === "L") return ROGALIK_BEADS_PRICES[size]
  return null
}

export type RogalikOption = {
  id: string
  label: string
  image?: string
  comingSoon?: boolean
}

export const ROGALIK_COLOR_OPTIONS: RogalikOption[] = [
  { id: "kremowy", label: "Kremowy", image: "/rogalik/rogalikkremowy.jpg" },
  { id: "bezowy", label: "Beżowy", image: "/rogalik/rogalikbezowy.jpg" },
  { id: "jasny-braz", label: "Jasny brąz", image: "/rogalik/rogalikjasnybraz.jpg" },
]

export const ROGALIK_MOUNTING_OPTIONS: RogalikOption[] = [
  { id: "koraliki", label: "Z koralikami" },
  { id: "karabinczyk", label: "Na karabińczyku" },
  { id: "sznureczek", label: "Na sznureczku", comingSoon: true },
  { id: "sznureczek-karabinczyk", label: "Na sznureczku z karabińczykiem", comingSoon: true },
]

export const ROGALIK_CORD_COLOR_OPTIONS: RogalikOption[] = [
  { id: "kremowy", label: "Kremowy", image: "/rogalik/sznurekkremowy.jpg" },
  { id: "jasny-braz", label: "Jasny brąz", image: "/rogalik/sznurekjasnybraz.jpg" },
  { id: "czekoladowy", label: "Czekoladowy", image: "/rogalik/sznurekczekoladowy.jpg" },
]

export const ROGALIK_BEADS_OPTIONS: RogalikOption[] = [
  { id: "opcja-1", label: "Opcja 1", image: "/rogalik/koralikiopcja1.jpg" },
  { id: "opcja-2", label: "Opcja 2", image: "/rogalik/koralikiopcja2.jpg" },
  { id: "opcja-3", label: "Opcja 3", image: "/rogalik/koralikiopcja3.jpg" },
]

export const ROGALIK_CHARM_OPTIONS: RogalikOption[] = [
  { id: "charm-1", label: "Charms 1", image: "/rogalik/rogalikicharms1.jpg" },
  { id: "charm-2", label: "Charms 2", image: "/rogalik/rogalikicharms2.jpg" },
  { id: "charm-3", label: "Charms 3", image: "/rogalik/rogalikicharms3.jpg" },
  { id: "charm-4", label: "Charms 4", image: "/rogalik/rogalikicharms4.jpg" },
  { id: "charm-5", label: "Charms 5", image: "/rogalik/rogalikicharms5.jpg" },
  { id: "charm-6", label: "Charms 6", image: "/rogalik/rogalikicharms6.jpg" },
]

export const ROGALIK_MAX_CHARMS = 4

export const rogalikMountingUsesBeads = (mounting: string) => mounting === "koraliki"

export const rogalikMountingUsesKarabinczyk = (mounting: string) => mounting === "karabinczyk"

export type RogalikFlowStep =
  | "kolor"
  | "mocowanie"
  | "dodatki"
  | "free-karabinier"
  | "extra-karabinier"
  | "dane"
  | "podsumowanie"

/** Mapowanie numeru kroku w UI na ekran (zależy od mocowania). */
export const rogalikFlowStepAt = (mounting: string, stepIndex: number): RogalikFlowStep => {
  if (stepIndex <= 1) return "kolor"
  if (stepIndex === 2) return "mocowanie"

  if (rogalikMountingUsesBeads(mounting)) {
    if (stepIndex === 3) return "dodatki"
    if (stepIndex === 4) return "dane"
    return "podsumowanie"
  }

  if (stepIndex === 3) return "free-karabinier"
  if (stepIndex === 4) return "extra-karabinier"
  if (stepIndex === 5) return "dane"
  return "podsumowanie"
}

export const rogalikOptionLabel = (options: RogalikOption[], id: string) =>
  options.find((option) => option.id === id)?.label ?? id
