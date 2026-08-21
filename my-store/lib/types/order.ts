import type { PaymentRecipientId } from "@/lib/payment"

export type DeliveryType = "paczkomat" | "kurier"

export type CreateOrderItemInput = {
  quantity: number
  unitPrice: number
  imageUrl: string
  productSlug: string
  productName: string
  ringColor: string
  baseColor: string
  baseCharms: string
  extraCharms: string[]
  baseCarabiner: string
  extraCarabiner: string[]
  stringPremium: string[]
  stringClassic: string[]
  dogNeck: string | null
  stoppers: string | null
  sticker: string | null
  dogName: string
  numberOnTag: string
  dialCodeInfo: boolean
}

export type CreateOrderInput = {
  clientName: string
  clientSurname: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  clientPostcode: string
  clientCity: string
  deliveryType: DeliveryType
  inpostId: string | null
  discountCode: string | null
  productsValue: number
  shippingCost: number
  fastDelivery: boolean
  fastDeliveryCost: number
  total: number
  items: CreateOrderItemInput[]
}

export type CreateOrderResult =
  | { ok: true; orderId: string; paymentRecipient: PaymentRecipientId }
  | { ok: false; message: string }

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"

export type OrderRecord = {
  id: string
  orderId: string
  clientName: string
  clientSurname: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  clientPostcode: string
  clientCity: string
  deliveryType: DeliveryType
  inpostId: string | null
  inpostCode: string | null
  discountCode: string | null
  status: OrderStatus
  productsValue: number
  shippingCost: number
  fastDelivery: boolean
  fastDeliveryCost: number
  paymentRecipient: PaymentRecipientId | null
  total: number
  createdAt: string
}

export type OrderItemRecord = {
  id: string
  quantity: number
  unitPrice: number
  lineTotal: number
  imageUrl: string | null
  productSlug: string
  productName: string
  ringColor: string
  baseColor: string
  baseCharms: string
  extraCharms: string[]
  baseCarabiner: string
  extraCarabiner: string[]
  stringPremium: string[]
  stringClassic: string[]
  dogNeck: string | null
  stoppers: string | null
  sticker: string | null
  dogName: string
  numberOnTag: string
  dialCodeInfo: boolean
}

export type OrderDetail = OrderRecord & {
  items: OrderItemRecord[]
}

export type ListOrdersResult =
  | { ok: true; orders: OrderRecord[] }
  | { ok: false; message: string }

export type GetOrderResult =
  | { ok: true; order: OrderDetail }
  | { ok: false; message: string }

export type UpdateOrderStatusResult =
  | { ok: true }
  | { ok: false; message: string }
