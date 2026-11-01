/**
 * Zamówienia od tego ID (włącznie): okres przychodu = paid_at (Data płatności w adminie).
 * Starsze: created_at (Warszawa) przed REVENUE_PAID_AT_CUTOFF_YMD, inaczej paid_at.
 */
export const REVENUE_PAYMENT_DATE_ORDER_ID_FROM = "PT-20261031-0146"

/** Data złożenia (Warszawa) — granica starej reguły hybrid dla order_id poniżej progu. */
export const REVENUE_PAID_AT_CUTOFF_YMD = "2026-10-13"
