export type CatalogOption = { id: string; label: string }

export type StringOption = CatalogOption & {
  images: string[]
}

const numbered = (count: number, start = 1): CatalogOption[] =>
  Array.from({ length: count }, (_, index) => {
    const id = String(start + index)
    return { id, label: `Podpis ${id}` }
  })

export const RING_OPTIONS: CatalogOption[] = [
  { id: "złoty", label: "Złoty" },
  { id: "srebrny", label: "Srebrny" },
  { id: "kwiat", label: "Kwiat" },
  { id: "glow", label: "Glow" },
]

export const BASE_OPTIONS: CatalogOption[] = [
  ...numbered(24),
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `kwiat${index + 1}`,
    label: `Podpis ${index + 1}`,
  })),
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `glow${index + 1}`,
    label: `Podpis ${index + 1}`,
  })),
]

export const CHARM_OPTIONS = numbered(53)

export const KARABINER_OPTIONS = numbered(12)

export const PREMIUM_STRING_CATALOG: StringOption[] = [
  {
    id: "cappuccino",
    label: "Cappuccino",
    images: ["/sznurek/premiumcappuccino1.jpg", "/sznurek/premiumcappuccino2.jpg"],
  },
  {
    id: "czekoladowy",
    label: "Czekoladowy",
    images: ["/sznurek/premiumczekoladowy1.jpg", "/sznurek/premiumczekoladowy2.jpg"],
  },
  {
    id: "ecru",
    label: "Ecru",
    images: ["/sznurek/premiumecru1.jpg", "/sznurek/premiumecru2.jpg"],
  },
  {
    id: "jasny-braz",
    label: "Jasny brąz",
    images: ["/sznurek/premiumjasnybraz1.jpg", "/sznurek/premiumjasnybraz2.jpg"],
  },
  {
    id: "kremowy",
    label: "Kremowy",
    images: ["/sznurek/premiumkremowy1.jpg", "/sznurek/premiumkremowy2.jpg"],
  },
  {
    id: "lawenda",
    label: "Lawenda",
    images: ["/sznurek/premiumlawenda1.jpg", "/sznurek/premiumlawenda2.jpg"],
  },
  {
    id: "teal",
    label: "Teal",
    images: ["/sznurek/premiumteal1.jpg", "/sznurek/premiumteal2.jpg"],
  },
  {
    id: "winny",
    label: "Winny",
    images: ["/sznurek/premiumwinny1.jpg", "/sznurek/premiumwinny2.jpg"],
  },
]

export const PREMIUM_STRING_OPTIONS: CatalogOption[] = PREMIUM_STRING_CATALOG.map(({ id, label }) => ({
  id,
  label,
}))

export const CLASSIC_STRING_CATALOG: StringOption[] = [
  {
    id: "bezowy",
    label: "Beżowy",
    images: ["/sznurek/klasycznybezowy1.jpg", "/sznurek/klasycznybezowy2.jpg"],
  },
  {
    id: "braz",
    label: "Brąz",
    images: ["/sznurek/klasycznybraz1.jpg", "/sznurek/klasycznybraz2.jpg"],
  },
  {
    id: "butelkowy",
    label: "Butelkowy",
    images: ["/sznurek/klasycznybutelkowy1.jpg", "/sznurek/klasycznybutelkowy2.jpg"],
  },
  {
    id: "ciemny-bez",
    label: "Ciemny beż",
    images: ["/sznurek/klasycznyciemnybez1.jpg", "/sznurek/klasycznyciemnybez2.jpg"],
  },
  {
    id: "czarny",
    label: "Czarny",
    images: ["/sznurek/klasycznyczarny1.jpg", "/sznurek/klasycznyczarny2.jpg"],
  },
  {
    id: "czerwony",
    label: "Czerwony",
    images: ["/sznurek/klasycznyczerwony1.jpg", "/sznurek/klasycznyczerwony2.jpg"],
  },
  {
    id: "granatowy",
    label: "Granatowy",
    images: ["/sznurek/klasycznygranatowy1.jpg", "/sznurek/klasycznygranatowy2.jpg"],
  },
  {
    id: "jasnorozowy",
    label: "Jasnoróżowy",
    images: ["/sznurek/klasycznyjasnorozowy1.jpg", "/sznurek/klasycznyjasnorozowy2.jpg"],
  },
  {
    id: "niebieski",
    label: "Niebieski",
    images: ["/sznurek/klasycznyniebieski1.jpg", "/sznurek/klasycznyniebieski2.jpg"],
  },
  {
    id: "srebrny",
    label: "Srebrny",
    images: ["/sznurek/klasycznysrebrny1.jpg", "/sznurek/klasycznysrebrny2.jpg"],
  },
]

export const CLASSIC_STRING_OPTIONS: CatalogOption[] = CLASSIC_STRING_CATALOG.map(({ id, label }) => ({
  id,
  label,
}))

export const STOPPER_OPTIONS: CatalogOption[] = [
  { id: "1", label: "Złote" },
  { id: "2", label: "Srebrne" },
]

export const STICKER_OPTIONS: CatalogOption[] = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  label: `Pies ${index + 1}`,
}))

export const optionLabel = (options: CatalogOption[], id: string) =>
  options.find((option) => option.id === id)?.label ?? `Podpis ${id}`
