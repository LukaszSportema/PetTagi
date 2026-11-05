export const WAREHOUSE_CHARM_LOW_THRESHOLD = 5
export const WAREHOUSE_KARABINER_LOW_THRESHOLD = 10
export const WAREHOUSE_STICKER_LOW_THRESHOLD = 5
export const WAREHOUSE_MAX_QUANTITY = 999

export type WarehouseKind = "charm" | "karabiner" | "sticker"

export const warehouseLowStockThreshold = (kind: WarehouseKind) => {
  if (kind === "charm") return WAREHOUSE_CHARM_LOW_THRESHOLD
  if (kind === "sticker") return WAREHOUSE_STICKER_LOW_THRESHOLD
  return WAREHOUSE_KARABINER_LOW_THRESHOLD
}

export const isWarehouseLowStock = (kind: WarehouseKind, quantity: number) =>
  quantity <= warehouseLowStockThreshold(kind)

/** Brak w magazynie — tylko gdy w bazie jest wpis z ilością 0. */
export const isWarehouseOutOfStock = (
  stockById: Record<string, number>,
  itemId: string,
  catalogUnavailable?: boolean,
) => catalogUnavailable || (itemId in stockById && stockById[itemId] <= 0)
