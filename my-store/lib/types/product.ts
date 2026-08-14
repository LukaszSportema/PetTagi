export interface RimColor {
  id: string
  product_id: string
  name: string
  hex_code: string
  image_url: string | null
  sort_order: number | null
  created_at: string
}

export interface BaseColor {
  id: string
  product_id: string
  name: string
  hex_code: string
  image_url: string | null
  sort_order: number | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  image_url: string | null
  created_at: string
  rim_colors: RimColor[]
  base_colors: BaseColor[]
}
