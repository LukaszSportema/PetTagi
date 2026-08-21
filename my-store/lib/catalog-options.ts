export type CatalogOption = { id: string; label: string }

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

export const PREMIUM_STRING_OPTIONS = numbered(8)

export const CLASSIC_STRING_OPTIONS: CatalogOption[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 9),
  label: `Podpis ${index + 1}`,
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
