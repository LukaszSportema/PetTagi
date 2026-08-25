export type ConfiguratorId = "classic-tag" | "glow-tag"

export type CatalogMedia = {
  type: "image" | "video"
  src: string
}

export type CatalogProduct = {
  slug: string
  name: string
  description: string
  emoji: string
  cta: string
  configuratorId: ConfiguratorId | null
  gallery: CatalogMedia[]
}

export const CLASSIC_TAG_PRODUCT: CatalogProduct = {
  slug: "adresowka-bizuteryjna",
  name: "Adresówka biżuteryjna",
  description:
    "W pełni personalizowana zawieszka z imieniem i numerem telefonu, wykończona złotą lub srebrną oprawą. Elegancka jak biżuteria, stworzona z myślą o Twoim pupilu.",
  emoji: "💍",
  cta: "Skonfiguruj własną",
  configuratorId: "classic-tag",
  gallery: [
    { type: "image", src: "/produkty/glowneklasyczne1.jpg" },
    { type: "image", src: "/produkty/glowneklasyczne2.jpg" },
  ],
}

export const LEGACY_CLASSIC_TAG_SLUG = "adresowka-klasyczna"
export const LEGACY_CLASSIC_TAG_NAME = "Adresówka klasyczna"

export const normalizeProductSlug = (slug: string) =>
  slug === LEGACY_CLASSIC_TAG_SLUG ? CLASSIC_TAG_PRODUCT.slug : slug

export const normalizeProductName = (name: string) =>
  name === LEGACY_CLASSIC_TAG_NAME ? CLASSIC_TAG_PRODUCT.name : name

export const GLOW_TAG_PRODUCT: CatalogProduct = {
  slug: "adresowka-glow",
  name: "Adresówka glow",
  description:
    "Personalizowana adresówka, która świeci w ciemności. Z imieniem i numerem telefonu — zapewnia lepszą widoczność pupila po zmroku.",
  emoji: "✨",
  cta: "Skonfiguruj własną",
  configuratorId: "glow-tag",
  gallery: [
    { type: "video", src: "/produkty/glow1vid.mp4" },
    { type: "image", src: "/produkty/glowneglow.jpg" },
  ],
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [CLASSIC_TAG_PRODUCT, GLOW_TAG_PRODUCT]

export const getCatalogProduct = (slug: string) =>
  CATALOG_PRODUCTS.find((product) => product.slug === slug)
  ?? (slug === LEGACY_CLASSIC_TAG_SLUG ? CLASSIC_TAG_PRODUCT : undefined)

export const productLineTitle = (productName: string, petName?: string | null) => {
  const name = normalizeProductName(productName.trim() || CLASSIC_TAG_PRODUCT.name)
  const pet = petName?.trim()
  return pet ? `${name} dla ${pet}` : name
}
