import {
  CHARM_BESTSELLERS,
  CHARM_CATALOG,
  CHARM_LARGE_CATALOG,
  CHARM_SILVER_CATALOG,
  KARABINER_CATALOG,
} from "@/lib/catalog-options"
import { ROGALIK_CHARM_OPTIONS } from "@/lib/rogalik-options"

export type WarehouseKind = "charm" | "karabiner"

export type WarehouseCatalogItem = {
  id: string
  label: string
  kind: WarehouseKind
  image?: string
  group: string
}

const pushUnique = (items: WarehouseCatalogItem[], seen: Set<string>, entry: WarehouseCatalogItem) => {
  if (seen.has(entry.id)) return
  seen.add(entry.id)
  items.push(entry)
}

export const warehouseCatalogItems = (): WarehouseCatalogItem[] => {
  const seen = new Set<string>()
  const items: WarehouseCatalogItem[] = []

  for (const charm of CHARM_BESTSELLERS) {
    pushUnique(items, seen, {
      id: charm.id,
      label: charm.label.replace(/\s*\(chwilowo niedostępny\)\s*$/i, "").trim(),
      kind: "charm",
      image: charm.image,
      group: "Charmsy — bestsellery",
    })
  }
  for (const charm of CHARM_CATALOG) {
    pushUnique(items, seen, {
      id: charm.id,
      label: charm.label.replace(/\s*\(chwilowo niedostępny\)\s*$/i, "").trim(),
      kind: "charm",
      image: charm.image,
      group: "Charmsy — katalog",
    })
  }
  for (const charm of CHARM_SILVER_CATALOG) {
    pushUnique(items, seen, {
      id: charm.id,
      label: charm.label,
      kind: "charm",
      image: charm.image,
      group: "Charmsy — srebrne",
    })
  }
  for (const charm of CHARM_LARGE_CATALOG) {
    pushUnique(items, seen, {
      id: charm.id,
      label: charm.label.replace(/\s*\(chwilowo niedostępny\)\s*$/i, "").trim(),
      kind: "charm",
      image: charm.image,
      group: "Charmsy — duże",
    })
  }
  for (const charm of ROGALIK_CHARM_OPTIONS) {
    pushUnique(items, seen, {
      id: charm.id,
      label: charm.label,
      kind: "charm",
      image: charm.image,
      group: "Charmsy — rogalik",
    })
  }
  for (const karabiner of KARABINER_CATALOG) {
    pushUnique(items, seen, {
      id: karabiner.id,
      label: karabiner.label,
      kind: "karabiner",
      image: karabiner.image,
      group: "Karabińczyki",
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
