"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  asPaymentRecipientId,
  DEFAULT_PAYMENT_RECIPIENT,
  parsePaymentRecipientId,
  PAYMENT_RECIPIENT_COOKIE,
  type PaymentRecipientId,
} from "@/lib/payment"

export type GetPaymentRecipientResult =
  | { ok: true; recipient: PaymentRecipientId }
  | { ok: false; message: string }

export type SetPaymentRecipientResult =
  | { ok: true; recipient: PaymentRecipientId }
  | { ok: false; message: string }

const writeRecipientCookie = async (recipient: PaymentRecipientId) => {
  const cookieStore = await cookies()
  cookieStore.set(PAYMENT_RECIPIENT_COOKIE, recipient, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
}

const readRecipientCookie = async (): Promise<PaymentRecipientId | null> => {
  const cookieStore = await cookies()
  return parsePaymentRecipientId(cookieStore.get(PAYMENT_RECIPIENT_COOKIE)?.value)
}

export async function getPaymentRecipient(): Promise<GetPaymentRecipientResult> {
  const fromCookie = await readRecipientCookie()
  if (fromCookie) return { ok: true, recipient: fromCookie }

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
  const value = asPaymentRecipientId(recipient)
  await writeRecipientCookie(value)

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
