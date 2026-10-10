"use server"

import {
  warehouseCatalogById,
  warehouseCatalogItems,
  type WarehouseKind,
} from "@/lib/warehouse-catalog"
import { WAREHOUSE_MAX_QUANTITY } from "@/lib/warehouse-stock"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

type StockRow = {
  item_id: string
  kind: WarehouseKind
  quantity: number
  updated_at: string
}

export type WarehouseAdminRow = {
  id: string
  label: string
  kind: WarehouseKind
  image?: string
  group: string
  quantity: number | null
  updatedAt: string | null
}

export type ListWarehouseStockAdminResult =
  | { ok: true; rows: WarehouseAdminRow[] }
  | { ok: false; message: string }

export async function listWarehouseStockAdmin(): Promise<ListWarehouseStockAdminResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_list_warehouse_stock")

  if (error) {
    console.error("admin_list_warehouse_stock failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_list_warehouse_stock")
        ? "Brak magazynu w Supabase. Uruchom migrację supabase/migrations/20261010_warehouse_stock.sql."
        : "Nie udało się pobrać stanów magazynowych.",
    }
  }

  const byId = new Map<string, StockRow>()
  for (const row of (data ?? []) as StockRow[]) {
    byId.set(row.item_id, row)
  }

  const catalog = warehouseCatalogById()
  const rows: WarehouseAdminRow[] = warehouseCatalogItems().map((item) => {
    const stock = byId.get(item.id)
    return {
      id: item.id,
      label: item.label,
      kind: item.kind,
      image: item.image,
      group: item.group,
      quantity: stock ? Number(stock.quantity) : null,
      updatedAt: stock?.updated_at ?? null,
    }
  })

  return { ok: true, rows }
}

export type SetWarehouseStockResult = { ok: true } | { ok: false; message: string }

export async function setWarehouseStock(
  itemId: string,
  kind: WarehouseKind,
  quantity: number,
): Promise<SetWarehouseStockResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const catalog = warehouseCatalogById()
  const item = catalog.get(itemId.trim())
  if (!item || item.kind !== kind) {
    return { ok: false, message: "Nieprawidłowy produkt magazynowy." }
  }

  const qty = Math.min(WAREHOUSE_MAX_QUANTITY, Math.max(0, Math.floor(quantity)))
  if (!Number.isFinite(qty)) {
    return { ok: false, message: "Podaj poprawną liczbę (0–999)." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_warehouse_stock", {
    p_item_id: itemId.trim(),
    p_kind: kind,
    p_quantity: qty,
  })

  if (error) {
    console.error("admin_set_warehouse_stock failed", error)
    return { ok: false, message: "Nie udało się zapisać stanu magazynowego." }
  }

  return { ok: true }
}

export type WarehouseStockMapResult =
  | { ok: true; stock: Record<string, number> }
  | { ok: false; message: string }

export async function fetchWarehouseStockMap(): Promise<WarehouseStockMapResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("list_warehouse_stock")

  if (error) {
    console.error("list_warehouse_stock failed", error)
    return { ok: false, message: "Nie udało się pobrać stanów magazynowych." }
  }

  const stock: Record<string, number> = {}
  if (data && typeof data === "object") {
    for (const [id, value] of Object.entries(data as Record<string, unknown>)) {
      const qty = Number(value)
      if (Number.isFinite(qty)) stock[id] = qty
    }
  }

  return { ok: true, stock }
}
