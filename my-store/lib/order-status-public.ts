import { fulfillmentRangeCompact } from "@/lib/fulfillment-dates"
import type { OrderStatus } from "@/lib/types/order"

export type PublicOrderLookupPayload = {
  found: boolean
  status?: OrderStatus
  fastDelivery?: boolean
  createdAt?: string
}

export const publicOrderStatusMessage = (payload: PublicOrderLookupPayload): string => {
  if (!payload.found || !payload.status) {
    return "Nie znaleźliśmy zamówienia dla podanego adresu e-mail i numeru. Sprawdź dane i spróbuj ponownie."
  }

  const { status, fastDelivery = false, createdAt } = payload

  switch (status) {
    case "pending":
      return "Zamówienie oczekuje na opłacenie"
    case "paid":
    case "processing": {
      const range =
        createdAt != null && createdAt !== ""
          ? fulfillmentRangeCompact(fastDelivery, new Date(createdAt))
          : "—"
      return `Zamówienie zostało opłacone i jest w trakcie realizacji. Szacowany termin przekazania do wysyłki: ${range}`
    }
    case "shipped":
      return "Zamówienie zostało przekazane do wysyłania"
    default:
      return "Brak informacji o zamówieniu"
  }
}
