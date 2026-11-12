import {
  CHARM_GOLD_KWIAT_WAREHOUSE_SECTIONS,
  CHARM_SILVER_CONFIGURATOR_SECTIONS,
  GOLD_RING_KARABINERS,
  SILVER_RING_KARABINERS,
  STICKER_CATALOG,
} from "@/lib/catalog-options"
import { STICKER_PREMIUM_ID } from "@/lib/pricing"
import { ROGALIK_CHARM_OPTIONS } from "@/lib/rogalik-options"

export type WarehouseKind = "charm" | "karabiner" | "sticker"

/** Sekcja w tabeli magazynu (charmsy). */
export type WarehouseCharmSection = "złote" | "srebrne" | "rogalik"

export type WarehouseCatalogItem = {
  id: string
  label: string
  kind: WarehouseKind
  image?: string
  group: string
  charmSection?: WarehouseCharmSection
}

const pushUnique = (items: WarehouseCatalogItem[], seen: Set<string>, entry: WarehouseCatalogItem) => {
  if (seen.has(entry.id)) return
  seen.add(entry.id)
  items.push(entry)
}

export const warehouseCatalogItems = (): WarehouseCatalogItem[] => {
  const seen = new Set<string>()
  const items: WarehouseCatalogItem[] = []

  const premiumSticker = STICKER_CATALOG.find((entry) => entry.id === STICKER_PREMIUM_ID)
  if (premiumSticker) {
    pushUnique(items, seen, {
      id: premiumSticker.id,
      label: premiumSticker.label,
      kind: "sticker",
      image: premiumSticker.image,
      group: "Grafiki — naklejki",
    })
  }

  for (const section of CHARM_GOLD_KWIAT_WAREHOUSE_SECTIONS) {
    for (const charm of section.items) {
      pushUnique(items, seen, {
        id: charm.id,
        label: charm.label.replace(/\s*\(chwilowo niedostępny\)\s*$/i, "").trim(),
        kind: "charm",
        image: charm.image,
        group: `Charmsy — ${section.title}`,
        charmSection: "złote",
      })
    }
  }
  for (const section of CHARM_SILVER_CONFIGURATOR_SECTIONS) {
    for (const charm of section.items) {
      pushUnique(items, seen, {
        id: charm.id,
        label: charm.label.replace(/\s*\(chwilowo niedostępny\)\s*$/i, "").trim(),
        kind: "charm",
        image: charm.image,
        group: `Charmsy — ${section.title}`,
        charmSection: "srebrne",
      })
    }
  }
  for (const charm of ROGALIK_CHARM_OPTIONS) {
    pushUnique(items, seen, {
      id: charm.id,
      label: charm.label,
      kind: "charm",
      image: charm.image,
      group: "Charmsy — rogalik",
      charmSection: "rogalik",
    })
  }
  for (const karabiner of GOLD_RING_KARABINERS) {
    pushUnique(items, seen, {
      id: karabiner.id,
      label: karabiner.label,
      kind: "karabiner",
      image: karabiner.image,
      group: "Karabińczyki — złote",
    })
  }
  for (const karabiner of SILVER_RING_KARABINERS) {
    pushUnique(items, seen, {
      id: karabiner.id,
      label: karabiner.label,
      kind: "karabiner",
      image: karabiner.image,
      group: "Karabińczyki — srebrne",
    })
  }

  return items
}

export const warehouseCatalogById = () => {
  const map = new Map<string, WarehouseCatalogItem>()
  for (const item of warehouseCatalogItems()) {
    map.set(item.id, item)
  }
  return map
}

/** Id grafik/naklejek objętych magazynem (stan 0 → niedostępne w konfiguratorze). */
export const warehouseStickerStockIds = (): Set<string> =>
  new Set(
    warehouseCatalogItems()
      .filter((item) => item.kind === "sticker")
      .map((item) => item.id),
  )
