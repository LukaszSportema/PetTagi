import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { sendOrderPaymentReminderEmail } from "@/lib/email"

const REMINDER_AFTER_MS = 24 * 60 * 60 * 1000

const createServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createSupabaseClient(url, serviceKey)
}

type PendingReminderRow = {
  id: string
  order_id: string
  client_email: string
  client_name: string
  client_surname: string
}

export type PaymentReminderRunResult =
  | { ok: true; checked: number; sent: number; failed: number }
  | { ok: false; message: string }

export async function sendDuePaymentReminders(): Promise<PaymentReminderRunResult> {
  const supabase = createServiceClient()
  if (!supabase) {
    return {
      ok: false,
      message: "Brak SUPABASE_SERVICE_ROLE_KEY na serwerze. Dodaj klucz w Vercel → Settings → Environment Variables.",
    }
  }

  const cutoff = new Date(Date.now() - REMINDER_AFTER_MS).toISOString()
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_id, client_email, client_name, client_surname")
    .eq("status", "pending")
    .is("payment_reminder_sent_at", null)
    .lte("created_at", cutoff)

  if (error) {
    console.error("payment reminder query failed", error)
    if (error.message.includes("payment_reminder_sent_at")) {
      return {
        ok: false,
        message:
          "Baza Supabase wymaga aktualizacji. Uruchom migrację supabase/migrations/20260913_order_payment_reminder.sql.",
      }
    }
    return { ok: false, message: "Nie udało się pobrać zamówień do przypomnienia o płatności." }
  }

  const orders = (data ?? []) as PendingReminderRow[]
  let sent = 0
  let failed = 0

  for (const order of orders) {
    const emailSent = await sendOrderPaymentReminderEmail({
      orderId: order.order_id,
      clientEmail: order.client_email,
      clientName: order.client_name,
      clientSurname: order.client_surname,
    })

    if (!emailSent) {
      failed += 1
      continue
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("orders")
      .update({ payment_reminder_sent_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "pending")
      .is("payment_reminder_sent_at", null)
      .select("id")

    if (updateError || !updatedRows?.length) {
      console.error("payment reminder mark failed", updateError)
      failed += 1
      continue
    }

    sent += 1
  }

  return { ok: true, checked: orders.length, sent, failed }
}
