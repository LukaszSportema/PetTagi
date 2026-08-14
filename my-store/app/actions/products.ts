"use server"

import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/types/product"

const PRODUCT_WITH_COLORS_SELECT = `
  *,
  rim_colors (*),
  base_colors (*)
` as const

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_COLORS_SELECT)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return (data ?? []) as Product[]
}
