export const DISCOUNT_LABEL_MAX = 20
export const DISCOUNT_COMMENT_MAX = 20
export const DISCOUNT_CODE_LENGTH = 6

export const DISCOUNT_VALIDITY_MONTHS = [1, 2, 3, 4, 5, 6] as const
export const DISCOUNT_PERCENTS = [5, 10, 15, 20] as const

export type DiscountValidityMonths = (typeof DISCOUNT_VALIDITY_MONTHS)[number]
export type DiscountPercent = (typeof DISCOUNT_PERCENTS)[number]

export type DiscountCodeStatus = "active" | "used" | "expired"

export type DiscountCodeRecord = {
  id: string
  code: string
  label: string
  adminComment: string | null
  percent: DiscountPercent
  validMonths: DiscountValidityMonths
  createdAt: string
  expiresAt: string
  usedAt: string | null
}

export const discountCodeStatus = (
  row: Pick<DiscountCodeRecord, "usedAt" | "expiresAt">,
  now = Date.now(),
): DiscountCodeStatus => {
  if (row.usedAt) return "used"
  const expires = new Date(row.expiresAt).getTime()
  if (Number.isFinite(expires) && now > expires) return "expired"
  return "active"
}

export const discountCodeStatusLabel = (status: DiscountCodeStatus) => {
  switch (status) {
    case "active":
      return "Aktywny"
    case "used":
      return "Wykorzystany"
    case "expired":
      return "Wygasły"
  }
}

export const addMonthsToDate = (from: Date, months: number) => {
  const d = new Date(from)
  d.setMonth(d.getMonth() + months)
  return d
}
