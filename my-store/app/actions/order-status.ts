"use server"

import {
  publicOrderStatusMessage,
  type PublicOrderLookupPayload,
} from "@/lib/order-status-public"
import { createClient } from "@/lib/supabase/server"
import type { OrderStatus } from "@/lib/types/order"

type LookupRpcRow = {
  found?: boolean
  status?: string
  fast_delivery?: boolean
  created_at?: string
}

export type LookupPublicOrderStatusResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

export async function lookupPublicOrderStatus(
  email: string,
  orderId: string,
): Promise<LookupPublicOrderStatusResult> {
  const trimmedEmail = email.trim()
  const trimmedOrderId = orderId.trim()

  if (!trimmedEmail || !trimmedOrderId) {
    return {
      ok: false,
      message: "Podaj adres e-mail z zamówienia oraz numer zamówienia.",
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("lookup_order_status", {
    p_email: trimmedEmail,
    p_order_id: trimmedOrderId,
  })

  if (error) {
    console.error("lookup_order_status", error.message)
    return {
      ok: false,
      message: "Nie udało się sprawdzić zamówienia. Spróbuj ponownie za chwilę.",
    }
  }

  const raw = data as LookupRpcRow | null
  const payload: PublicOrderLookupPayload =
    raw?.found === true
      ? {
          found: true,
          status: raw.status as OrderStatus,
          fastDelivery: raw.fast_delivery ?? false,
          createdAt: raw.created_at,
        }
      : { found: false }

  return { ok: true, message: publicOrderStatusMessage(payload) }
}
