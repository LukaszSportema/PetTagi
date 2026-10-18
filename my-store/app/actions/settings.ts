"use server"

import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"
import {
  asPaymentRecipientId,
  DEFAULT_PAYMENT_RECIPIENT,
  parsePaymentRecipientId,
  type PaymentRecipientId,
} from "@/lib/payment"

export type GetPaymentRecipientResult =
  | { ok: true; recipient: PaymentRecipientId }
  | { ok: false; message: string }

export type SetPaymentRecipientResult =
  | { ok: true; recipient: PaymentRecipientId }
  | { ok: false; message: string }

export async function getPaymentRecipient(): Promise<GetPaymentRecipientResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_payment_recipient")

    if (error) {
      console.error("get_payment_recipient failed", error)
    } else {
      const fromDb = parsePaymentRecipientId(data)
      if (fromDb) return { ok: true, recipient: fromDb }
    }
  } catch (error) {
    console.error("get_payment_recipient failed", error)
  }

  return { ok: true, recipient: DEFAULT_PAYMENT_RECIPIENT }
}

export async function setPaymentRecipient(
  recipient: PaymentRecipientId,
): Promise<SetPaymentRecipientResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const value = asPaymentRecipientId(recipient)

  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc("admin_set_payment_recipient", {
      p_recipient: value,
    })
    if (error) {
      console.error("admin_set_payment_recipient failed", error)
    }
  } catch (error) {
    console.error("admin_set_payment_recipient failed", error)
  }

  return { ok: true, recipient: value }
}

export type GetExpressShippingEnabledResult =
  | { ok: true; enabled: boolean }
  | { ok: false; message: string }

export type SetExpressShippingEnabledResult =
  | { ok: true; enabled: boolean }
  | { ok: false; message: string }

export async function getExpressShippingEnabled(): Promise<GetExpressShippingEnabledResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_express_shipping_enabled")

    if (error) {
      console.error("get_express_shipping_enabled failed", error)
      return {
        ok: false,
        message: error.message.includes("get_express_shipping_enabled")
          ? "Brak ustawienia w Supabase. Uruchom migrację express_shipping_setting."
          : "Nie udało się pobrać ustawienia wysyłki ekspres.",
      }
    }

    return { ok: true, enabled: data !== false }
  } catch (error) {
    console.error("get_express_shipping_enabled failed", error)
    return { ok: false, message: "Nie udało się pobrać ustawienia wysyłki ekspres." }
  }
}

export async function setExpressShippingEnabled(
  enabled: boolean,
): Promise<SetExpressShippingEnabledResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("admin_set_express_shipping_enabled", {
      p_enabled: enabled,
    })
    if (error) {
      console.error("admin_set_express_shipping_enabled failed", error)
      return { ok: false, message: "Nie udało się zapisać ustawienia wysyłki ekspres." }
    }
    return { ok: true, enabled: data !== false }
  } catch (error) {
    console.error("admin_set_express_shipping_enabled failed", error)
    return { ok: false, message: "Nie udało się zapisać ustawienia wysyłki ekspres." }
  }
}
