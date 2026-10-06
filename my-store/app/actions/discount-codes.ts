"use server"

import {
  DISCOUNT_COMMENT_MAX,
  DISCOUNT_LABEL_MAX,
  DISCOUNT_PERCENTS,
  DISCOUNT_VALIDITY_MONTHS,
  type DiscountCodeRecord,
  type DiscountPercent,
  type DiscountValidityMonths,
} from "@/lib/discount-codes"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

type DiscountCodeRow = {
  id: string
  code: string
  label: string
  admin_comment: string | null
  percent: number
  valid_months: number
  created_at: string
  expires_at: string
  used_at: string | null
}

const mapRow = (row: DiscountCodeRow): DiscountCodeRecord => ({
  id: row.id,
  code: row.code,
  label: row.label,
  adminComment: row.admin_comment?.trim() || null,
  percent: row.percent as DiscountPercent,
  validMonths: row.valid_months as DiscountValidityMonths,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  usedAt: row.used_at,
})

export type ListDiscountCodesResult =
  | { ok: true; codes: DiscountCodeRecord[] }
  | { ok: false; message: string }

export async function listDiscountCodes(): Promise<ListDiscountCodesResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_list_discount_codes")

  if (error) {
    console.error("admin_list_discount_codes failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_list_discount_codes")
        ? "Brak funkcji admin_list_discount_codes w Supabase. Uruchom migrację supabase/migrations/20261006_discount_codes.sql."
        : "Nie udało się pobrać kodów rabatowych.",
    }
  }

  return { ok: true, codes: ((data ?? []) as DiscountCodeRow[]).map(mapRow) }
}

export type GenerateDiscountCodeResult =
  | { ok: true; code: DiscountCodeRecord }
  | { ok: false; message: string }

export async function generateDiscountCode(input: {
  label: string
  validMonths: DiscountValidityMonths
  percent: DiscountPercent
}): Promise<GenerateDiscountCodeResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const label = input.label.trim().slice(0, DISCOUNT_LABEL_MAX)
  if (!label) {
    return { ok: false, message: "Podaj nazwę rabatu." }
  }

  if (!DISCOUNT_VALIDITY_MONTHS.includes(input.validMonths)) {
    return { ok: false, message: "Wybierz okres ważności kodu." }
  }

  if (!DISCOUNT_PERCENTS.includes(input.percent)) {
    return { ok: false, message: "Wybierz procent rabatu." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_generate_discount_code", {
    p_label: label,
    p_valid_months: input.validMonths,
    p_percent: input.percent,
  })

  if (error) {
    console.error("admin_generate_discount_code failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_generate_discount_code")
        ? "Brak funkcji admin_generate_discount_code w Supabase. Uruchom migrację supabase/migrations/20261006_discount_codes.sql."
        : "Nie udało się wygenerować kodu.",
    }
  }

  return { ok: true, code: mapRow(data as DiscountCodeRow) }
}

export type UpdateDiscountCommentResult = { ok: true } | { ok: false; message: string }

export async function updateDiscountCodeComment(
  id: string,
  comment: string,
): Promise<UpdateDiscountCommentResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_discount_code_comment", {
    p_id: id,
    p_comment: comment.trim().slice(0, DISCOUNT_COMMENT_MAX),
  })

  if (error) {
    console.error("admin_set_discount_code_comment failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_set_discount_code_comment")
        ? "Brak funkcji admin_set_discount_code_comment w Supabase. Uruchom migrację supabase/migrations/20261006_discount_codes.sql."
        : "Nie udało się zapisać komentarza.",
    }
  }

  return { ok: true }
}

export type DeleteDiscountCodeResult = { ok: true } | { ok: false; message: string }

export async function deleteDiscountCode(id: string): Promise<DeleteDiscountCodeResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  if (!id.trim()) {
    return { ok: false, message: "Brak identyfikatora kodu." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_delete_discount_code", { p_id: id })

  if (error) {
    console.error("admin_delete_discount_code failed", error)
    return {
      ok: false,
      message: error.message.includes("admin_delete_discount_code")
        ? "Brak funkcji admin_delete_discount_code w Supabase. Uruchom migrację supabase/migrations/20261006_admin_delete_discount_code.sql."
        : error.message.includes("discount code not found")
          ? "Nie znaleziono kodu rabatowego."
          : error.message.includes("discount code not active")
            ? "Można usunąć tylko aktywny kod rabatowy."
            : "Nie udało się usunąć kodu.",
    }
  }

  return { ok: true }
}

export type ValidateDiscountCodeResult =
  | { ok: true; code: string; percent: DiscountPercent; label: string }
  | { ok: false; message: string }

export async function validateDiscountCodeForCheckout(
  rawCode: string,
): Promise<ValidateDiscountCodeResult> {
  const code = rawCode.trim().toUpperCase()
  if (!/^[A-Z]{6}$/.test(code)) {
    return { ok: false, message: "Kod musi składać się z 6 wielkich liter." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("check_discount_code", { p_code: code })

  if (error) {
    console.error("check_discount_code failed", error)
    return { ok: false, message: "Nie udało się sprawdzić kodu. Spróbuj ponownie." }
  }

  if (!data || typeof data !== "object") {
    return { ok: false, message: "Kod jest nieprawidłowy, wykorzystany lub wygasł." }
  }

  const payload = data as { percent?: number; label?: string; code?: string }
  const percent = Number(payload.percent)
  if (!DISCOUNT_PERCENTS.includes(percent as DiscountPercent)) {
    return { ok: false, message: "Kod jest nieprawidłowy, wykorzystany lub wygasł." }
  }

  return {
    ok: true,
    code: String(payload.code ?? code),
    percent: percent as DiscountPercent,
    label: String(payload.label ?? ""),
  }
}
