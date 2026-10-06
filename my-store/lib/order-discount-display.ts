import type { OrderDiscountDetails } from "@/lib/types/order"

export const orderDiscountCodeSummary = (details: OrderDiscountDetails) => {
  const labelPart = details.label ? ` · ${details.label}` : ""
  return `Kod ${details.code}${labelPart} (−${details.percent}% od ceny bazowej adresówki)`
}
