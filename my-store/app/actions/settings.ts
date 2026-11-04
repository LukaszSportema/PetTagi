"use server"

import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"
import {
  parseTagModelBasePrices,
  parseTagModelStartPrices,
  tagModelBasePricesToJson,
  tagModelStartPricesToJson,
  type TagModelBasePrices,
  type TagModelStartPrices,
} from "@/lib/tag-model-pricing"
import {
  charmUnitPricesToJson,
  mergeCharmUnitPrices,
  type CharmUnitPrices,
} from "@/lib/charm-unit-pricing"
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

export type GetTagModelStartPricesResult =
  | { ok: true; prices: TagModelStartPrices }
  | { ok: false; message: string }

export type SetTagModelStartPricesResult =
  | { ok: true; prices: TagModelStartPrices }
  | { ok: false; message: string }

export async function getTagModelStartPrices(): Promise<GetTagModelStartPricesResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_tag_model_start_prices")

    if (error) {
      console.error("get_tag_model_start_prices failed", error)
      return {
        ok: false,
        message: error.message.includes("get_tag_model_start_prices")
          ? "Brak cennika w Supabase. Uruchom migrację tag_model_start_prices."
          : "Nie udało się pobrać cennika modeli.",
      }
    }

    return { ok: true, prices: parseTagModelStartPrices(data) }
  } catch (error) {
    console.error("get_tag_model_start_prices failed", error)
    return { ok: false, message: "Nie udało się pobrać cennika modeli." }
  }
}

export async function setTagModelStartPrices(
  prices: TagModelStartPrices,
): Promise<SetTagModelStartPricesResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const payload = tagModelStartPricesToJson(parseTagModelStartPrices(prices))

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("admin_set_tag_model_start_prices", {
      p_prices: payload,
    })
    if (error) {
      console.error("admin_set_tag_model_start_prices failed", error)
      return { ok: false, message: "Nie udało się zapisać cennika modeli." }
    }
    return { ok: true, prices: parseTagModelStartPrices(data) }
  } catch (error) {
    console.error("admin_set_tag_model_start_prices failed", error)
    return { ok: false, message: "Nie udało się zapisać cennika modeli." }
  }
}

export type GetTagModelBasePricesResult =
  | { ok: true; prices: TagModelBasePrices }
  | { ok: false; message: string }

export type SetTagModelBasePricesResult =
  | { ok: true; prices: TagModelBasePrices }
  | { ok: false; message: string }

export async function getTagModelBasePrices(): Promise<GetTagModelBasePricesResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_tag_model_base_prices")

    if (error) {
      console.error("get_tag_model_base_prices failed", error)
      return {
        ok: false,
        message: error.message.includes("get_tag_model_base_prices")
          ? "Brak cennika bazowego w Supabase. Uruchom migrację tag_model_base_prices."
          : "Nie udało się pobrać cennika bazowego modeli.",
      }
    }

    return { ok: true, prices: parseTagModelBasePrices(data) }
  } catch (error) {
    console.error("get_tag_model_base_prices failed", error)
    return { ok: false, message: "Nie udało się pobrać cennika bazowego modeli." }
  }
}

export async function setTagModelBasePrices(
  prices: TagModelBasePrices,
): Promise<SetTagModelBasePricesResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const payload = tagModelBasePricesToJson(parseTagModelBasePrices(prices))

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("admin_set_tag_model_base_prices", {
      p_prices: payload,
    })
    if (error) {
      console.error("admin_set_tag_model_base_prices failed", error)
      const hint = error.message.includes("admin_set_tag_model_base_prices")
        ? "Brak cennika bazowego w Supabase. Uruchom migrację tag_model_base_prices."
        : error.message.includes("tag_model_base_prices")
          ? "Brak kolumny tag_model_base_prices. Uruchom migrację tag_model_base_prices."
          : null
      return {
        ok: false,
        message: hint ?? "Nie udało się zapisać cennika bazowego modeli.",
      }
    }
    return { ok: true, prices: parseTagModelBasePrices(data) }
  } catch (error) {
    console.error("admin_set_tag_model_base_prices failed", error)
    return { ok: false, message: "Nie udało się zapisać cennika bazowego modeli." }
  }
}

export type GetCharmUnitPricesResult =
  | { ok: true; prices: CharmUnitPrices }
  | { ok: false; message: string }

export type SetCharmUnitPricesResult =
  | { ok: true; prices: CharmUnitPrices }
  | { ok: false; message: string }

export async function getCharmUnitPrices(): Promise<GetCharmUnitPricesResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_charm_unit_prices")

    if (error) {
      console.error("get_charm_unit_prices failed", error)
      return {
        ok: false,
        message: error.message.includes("get_charm_unit_prices")
          ? "Brak cennika charmsów w Supabase. Uruchom migrację charm_unit_prices."
          : "Nie udało się pobrać cennika charmsów.",
      }
    }

    return { ok: true, prices: mergeCharmUnitPrices(data) }
  } catch (error) {
    console.error("get_charm_unit_prices failed", error)
    return { ok: false, message: "Nie udało się pobrać cennika charmsów." }
  }
}

export async function setCharmUnitPrices(
  prices: CharmUnitPrices,
): Promise<SetCharmUnitPricesResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, message: auth.message }

  const payload = charmUnitPricesToJson(prices)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("admin_set_charm_unit_prices", {
      p_prices: payload,
    })
    if (error) {
      console.error("admin_set_charm_unit_prices failed", error)
      const hint = error.message.includes("admin_set_charm_unit_prices")
        ? "Brak funkcji cennika charmsów w Supabase. Uruchom migrację charm_unit_prices."
        : error.message.includes("assert_admin") || error.message.includes("not authorized")
          ? "Brak uprawnień administratora."
          : error.message
      return { ok: false, message: `Nie udało się zapisać cennika charmsów. ${hint}` }
    }
    return { ok: true, prices: mergeCharmUnitPrices(data) }
  } catch (error) {
    console.error("admin_set_charm_unit_prices failed", error)
    return { ok: false, message: "Nie udało się zapisać cennika charmsów." }
  }
}
