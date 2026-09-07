import { fulfillmentOrderMessage } from "@/lib/fulfillment-dates"

export type PaymentRecipientId = "wiktoria" | "lukasz"

export type PaymentRecipient = {
  id: PaymentRecipientId
  label: string
  blikPhone: string
  accountName: string
  accountNumber: string
}

export const PAYMENT_RECIPIENTS: Record<PaymentRecipientId, PaymentRecipient> = {
  wiktoria: {
    id: "wiktoria",
    label: "Wiktoria",
    blikPhone: "515 212 651",
    accountName: "Wiktoria Stelmakh",
    accountNumber: "86 1090 1870 0000 0001 4652 2304",
  },
  lukasz: {
    id: "lukasz",
    label: "Łukasz",
    blikPhone: "888 931 111",
    accountName: "Łukasz Bożek",
    accountNumber: "78 1050 1025 1000 0098 6822 5203",
  },
}

export const DEFAULT_PAYMENT_RECIPIENT: PaymentRecipientId = "wiktoria"

export const PAYMENT_RECIPIENT_COOKIE = "pettagi_payment_recipient"
export const PAYMENT_RECIPIENT_STORAGE_KEY = "pettagi.paymentRecipient"

export const asPaymentRecipientId = (value: unknown): PaymentRecipientId =>
  value === "lukasz" || value === "wiktoria" ? value : DEFAULT_PAYMENT_RECIPIENT

export const parsePaymentRecipientId = (value: unknown): PaymentRecipientId | null =>
  value === "lukasz" || value === "wiktoria" ? value : null

export const paymentRecipientLabel = (value: unknown) => {
  const id = parsePaymentRecipientId(value)
  return id ? PAYMENT_RECIPIENTS[id].label : null
}

export const readStoredPaymentRecipient = (): PaymentRecipientId | null => {
  if (typeof window === "undefined") return null
  try {
    return parsePaymentRecipientId(window.localStorage.getItem(PAYMENT_RECIPIENT_STORAGE_KEY))
  } catch {
    return null
  }
}

export const persistPaymentRecipient = (recipient: PaymentRecipientId) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PAYMENT_RECIPIENT_STORAGE_KEY, recipient)
    document.cookie = `${PAYMENT_RECIPIENT_COOKIE}=${recipient}; Path=/; Max-Age=31536000; SameSite=Lax`
  } catch {
    // ignore storage failures
  }
}

export const fulfillmentMessage = (orderId: string, fastDelivery: boolean) =>
  fulfillmentOrderMessage(orderId, fastDelivery)

export const ORDER_CONFIRMATION_TITLE = "Dziękujemy za zamówienie naszej adresówki!"
export const ORDER_CONFIRMATION_SUBTITLE =
  "Od teraz Twój pupil ma swój własny talizman bezpieczeństwa — a Ty możesz czuć się spokojniej."
export const ORDER_CONFIRMATION_TRANSFER_NOTE =
  "Ważne: W tytule przelewu (lub płatności BLIK) prosimy wpisać imię pupila."
