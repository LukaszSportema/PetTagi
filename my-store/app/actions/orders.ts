"use server"

import { sendOrderPlacedEmail } from "@/lib/email"
import { DEFAULT_PAYMENT_RECIPIENT, parsePaymentRecipientId } from "@/lib/payment"
import { getPaymentRecipient } from "@/app/actions/settings"
import { createClient } from "@/lib/supabase/server"
import type {
  CreateOrderInput,
  CreateOrderResult,
  DeliveryType,
  GetOrderResult,
  ListOrdersResult,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  UpdateOrderStatusResult,
} from "@/lib/types/order"

type PlaceOrderRow = {
  id: string
  order_id: string
}

const roundMoney = (value: number) => Math.round(value * 100) / 100

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!input.items.length) {
    return { ok: false, message: "Koszyk jest pusty." }
  }

  if (input.deliveryType === "paczkomat" && !input.inpostId?.trim()) {
    return { ok: false, message: "Wybierz paczkomat." }
  }

  const supabase = await createClient()

  const paymentSetting = await getPaymentRecipient()
  const paymentRecipient = paymentSetting.ok
    ? paymentSetting.recipient
    : DEFAULT_PAYMENT_RECIPIENT

  const orderRow = {
    client_name: input.clientName.trim(),
    client_surname: input.clientSurname.trim(),
    client_email: input.clientEmail.trim(),
    client_phone: input.clientPhone.trim(),
    client_address: input.clientAddress.trim(),
    client_postcode: input.clientPostcode.trim(),
    client_city: input.clientCity.trim(),
    delivery_type: input.deliveryType,
    inpost_id: input.deliveryType === "paczkomat" ? input.inpostId?.trim() ?? null : null,
    discount_code: input.discountCode?.trim() || null,
    products_value: roundMoney(input.productsValue),
    shipping_cost: roundMoney(input.shippingCost),
    fast_delivery: Boolean(input.fastDelivery),
    fast_delivery_cost: roundMoney(input.fastDelivery ? input.fastDeliveryCost : 0),
    payment_recipient: paymentRecipient,
    total: roundMoney(input.total),
  }

  const items = input.items.map((item, index) => ({
    sort_order: index,
    quantity: item.quantity,
    unit_price: roundMoney(item.unitPrice),
    line_total: roundMoney(item.unitPrice * item.quantity),
    image_url: item.imageUrl,
    ring_color: item.ringColor,
    base_color: item.baseColor,
    base_charms: item.baseCharms,
    extra_charms: item.extraCharms,
    base_carabiner: item.baseCarabiner,
    extra_carabiner: item.extraCarabiner,
    string_premium: item.stringPremium,
    string_classic: item.stringClassic,
    dog_neck: item.dogNeck,
    stoppers: item.stoppers,
    sticker: item.sticker,
    dog_name: item.dogName.trim(),
    number_on_tag: item.numberOnTag.trim(),
    dial_code_info: item.dialCodeInfo,
  }))

  const { data, error } = await supabase.rpc("place_order", {
    order_row: orderRow,
    items,
  })

  if (error) {
    console.error("place_order failed", error)
    return {
      ok: false,
      message: error.message.includes("place_order")
        ? "Brak funkcji place_order w Supabase. Wklej skrypt SQL z supabase/migrations/20260818_place_order.sql."
        : "Nie udało się złożyć zamówienia. Spróbuj ponownie.",
    }
  }

  const row = data as PlaceOrderRow | PlaceOrderRow[] | null
  const placed = Array.isArray(row) ? row[0] : row
  if (!placed?.order_id) {
    return { ok: false, message: "Zamówienie nie zwróciło numeru. Spróbuj ponownie." }
  }

  await sendOrderPlacedEmail({
    orderId: placed.order_id,
    paymentRecipient,
    order: {
      ...input,
      clientName: orderRow.client_name,
      clientSurname: orderRow.client_surname,
      clientEmail: orderRow.client_email,
      clientPhone: orderRow.client_phone,
      clientAddress: orderRow.client_address,
      clientPostcode: orderRow.client_postcode,
      clientCity: orderRow.client_city,
      productsValue: orderRow.products_value,
      shippingCost: orderRow.shipping_cost,
      fastDelivery: orderRow.fast_delivery,
      fastDeliveryCost: orderRow.fast_delivery_cost,
      total: orderRow.total,
    },
  })

  return { ok: true, orderId: placed.order_id, paymentRecipient }
}

type OrderRow = {
  id: string
  order_id: string
  client_name: string
  client_surname: string
  client_email: string
  client_phone: string
  client_address: string
  client_postcode: string
  client_city: string
  delivery_type: string
  inpost_id: string | null
  inpost_code?: string | null
  discount_code: string | null
  status: string
  products_value: number | string
  shipping_cost: number | string
  fast_delivery?: boolean | string | null
  fast_delivery_cost?: number | string | null
  payment_recipient?: string | null
  total: number | string
  created_at: string
}

type OrderItemRow = {
  id: string
  quantity: number | string
  unit_price: number | string
  line_total: number | string
  image_url: string | null
  ring_color: string
  base_color: string
  base_charms: string
  extra_charms: unknown
  extra_carabiner: unknown
  string_premium: unknown
  string_classic: unknown
  base_carabiner: string
  dog_neck: string | null
  stoppers: string | null
  sticker: string | null
  dog_name: string
  number_on_tag: string
  dial_code_info: boolean | string
}

const toMoney = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
]

const asStatus = (value: string): OrderStatus =>
  ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : "pending"

const asDelivery = (value: string): DeliveryType =>
  value === "paczkomat" ? "paczkomat" : "kurier"

const mapOrder = (row: OrderRow): OrderRecord => ({
  id: row.id,
  orderId: row.order_id,
  clientName: row.client_name,
  clientSurname: row.client_surname,
  clientEmail: row.client_email,
  clientPhone: row.client_phone,
  clientAddress: row.client_address,
  clientPostcode: row.client_postcode,
  clientCity: row.client_city,
  deliveryType: asDelivery(row.delivery_type),
  inpostId: row.inpost_id,
  inpostCode: row.inpost_code ?? null,
  discountCode: row.discount_code,
  status: asStatus(row.status),
  productsValue: toMoney(row.products_value),
  shippingCost: toMoney(row.shipping_cost),
  fastDelivery: row.fast_delivery === true || row.fast_delivery === "true",
  fastDeliveryCost: toMoney(row.fast_delivery_cost),
  paymentRecipient: parsePaymentRecipientId(row.payment_recipient),
  total: toMoney(row.total),
  createdAt: row.created_at,
})

const mapItem = (row: OrderItemRow): OrderItemRecord => ({
  id: row.id,
  quantity: Number(row.quantity) || 1,
  unitPrice: toMoney(row.unit_price),
  lineTotal: toMoney(row.line_total),
  imageUrl: row.image_url,
  ringColor: row.ring_color,
  baseColor: row.base_color,
  baseCharms: row.base_charms,
  extraCharms: toStringArray(row.extra_charms),
  baseCarabiner: row.base_carabiner,
  extraCarabiner: toStringArray(row.extra_carabiner),
  stringPremium: toStringArray(row.string_premium),
  stringClassic: toStringArray(row.string_classic),
  dogNeck: row.dog_neck,
  stoppers: row.stoppers,
  sticker: row.sticker,
  dogName: row.dog_name,
  numberOnTag: row.number_on_tag,
  dialCodeInfo: row.dial_code_info === true || row.dial_code_info === "true",
})

const missingAdminSqlMessage =
  "Brak funkcji admin_list_orders w Supabase. Wklej skrypt SQL z supabase/migrations/20260818_admin_orders.sql."

export async function listOrders(): Promise<ListOrdersResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_list_orders")

  if (error) {
    console.error("admin_list_orders failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_list_orders")
        ? missingAdminSqlMessage
        : "Nie udało się pobrać zamówień. Spróbuj ponownie.",
    }
  }

  return { ok: true, orders: ((data ?? []) as OrderRow[]).map(mapOrder) }
}

export async function getOrder(id: string): Promise<GetOrderResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_get_order", { p_id: id })

  if (error) {
    console.error("admin_get_order failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_get_order")
        ? missingAdminSqlMessage
        : "Nie udało się pobrać zamówienia. Spróbuj ponownie.",
    }
  }

  const payload = data as { order: OrderRow; items: OrderItemRow[] } | null
  if (!payload?.order) {
    return { ok: false, message: "Nie znaleziono zamówienia." }
  }

  return {
    ok: true,
    order: {
      ...mapOrder(payload.order),
      items: (payload.items ?? []).map(mapItem),
    },
  }
}

export async function saveInpostCode(orderUuid: string, code: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_inpost_code", {
    p_id: orderUuid,
    p_code: code,
  })
  if (error) {
    console.error("admin_set_inpost_code failed", error)
  }
}

const WRITABLE_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "cancelled",
]

export async function updateOrderStatus(
  orderUuid: string,
  status: OrderStatus,
): Promise<UpdateOrderStatusResult> {
  if (!WRITABLE_STATUSES.includes(status)) {
    return { ok: false, message: "Nieprawidłowy status zamówienia." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_order_status", {
    p_id: orderUuid,
    p_status: status,
  })

  if (error) {
    console.error("admin_set_order_status failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_set_order_status")
        ? "Brak funkcji admin_set_order_status w Supabase. Wklej skrypt SQL z supabase/migrations/20260819_order_status.sql."
        : "Nie udało się zmienić statusu. Spróbuj ponownie.",
    }
  }

  return { ok: true }
}
