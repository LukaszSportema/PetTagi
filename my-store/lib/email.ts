import { Resend } from "resend"
import {
  deliveryLabel,
  formatAddress,
  formatPrice,
  orderItemOptions,
  orderItemTitle,
} from "@/lib/order-display"
import { PAYMENT_RECIPIENTS, type PaymentRecipientId } from "@/lib/payment"
import type { CreateOrderInput } from "@/lib/types/order"

const FROM = "Pettagi <zamowienia@pettagi.com>"

type OrderPlacedEmailInput = {
  orderId: string
  paymentRecipient: PaymentRecipientId
  order: CreateOrderInput
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const fulfillmentCopy = (fastDelivery: boolean) =>
  fastDelivery
    ? "Twoje zamówienie zostanie zrealizowane w czasie 3-5 roboczych po dokonaniu płatności."
    : "Twoje zamówienie zostanie zrealizowane w czasie 7-10 roboczych po dokonaniu płatności."

const shippingCopy = (order: CreateOrderInput) => {
  const name = order.deliveryType === "paczkomat" ? "Paczkomat InPost" : deliveryLabel(order.deliveryType)
  if (order.deliveryType === "paczkomat" && order.inpostId) {
    return `${name} (${order.inpostId})`
  }
  return name
}

export async function sendOrderPlacedEmail(input: OrderPlacedEmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("Missing RESEND_API_KEY — order email was not sent")
    return
  }

  const { html, text } = renderOrderPlacedEmail(input)
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: FROM,
    to: input.order.clientEmail,
    subject: `Pettagi - zamówienie nr ${input.orderId}`,
    html,
    text,
  })

  if (error) {
    console.error("Resend send failed", error)
  }
}

function renderOrderPlacedEmail(input: OrderPlacedEmailInput) {
  const recipient = PAYMENT_RECIPIENTS[input.paymentRecipient]
  const order = input.order
  const total = formatPrice(order.total)
  const shipping = shippingCopy(order)
  const fulfillment = fulfillmentCopy(order.fastDelivery)
  const clientName = `${order.clientName} ${order.clientSurname}`.trim()
  const address = formatAddress(order.clientAddress, order.clientPostcode, order.clientCity)

  const itemBlocks = order.items.map((item) => {
    const title = orderItemTitle(item)
    const qty = item.quantity > 1 ? ` × ${item.quantity}` : ""
    const options = orderItemOptions(item)
    const optionLines = options
      .map((option) => `${option.label}: ${option.values.join(", ")}`)
      .join("\n")
    const optionHtml = options
      .map(
        (option) => `
          <tr>
            <td style="padding:2px 0;color:#9A9288;font-size:13px;vertical-align:top;width:46%">${escapeHtml(option.label)}</td>
            <td style="padding:2px 0;color:#161616;font-size:13px">${escapeHtml(option.values.join(", "))}</td>
          </tr>`,
      )
      .join("")

    return {
      title: `${title}${qty}`,
      price: formatPrice(item.unitPrice * item.quantity),
      optionLines,
      optionHtml,
    }
  })

  const text = [
    "Dziękujemy za zamówienie naszej adresówki!",
    "",
    `Dokonaj płatności kwoty ${total}:`,
    `BLIK na numer: ${recipient.blikPhone}`,
    "Przelew na rachunek bankowy:",
    recipient.accountName,
    recipient.accountNumber,
    "",
    "Szczegóły zamówienia",
    `Numer zamówienia: ${input.orderId}`,
    "",
    ...itemBlocks.flatMap((item) => [item.title, item.optionLines, item.price, ""]),
    "Dane do wysyłki",
    clientName,
    address,
    order.clientPhone,
    order.clientEmail,
    "",
    "Metoda wysyłki i koszty",
    `Wartość produktów: ${formatPrice(order.productsValue)}`,
    `Dostawa (${shipping}): ${formatPrice(order.shippingCost)}`,
    ...(order.fastDelivery
      ? [`Skrócenie czasu realizacji - ${formatPrice(order.fastDeliveryCost)}`]
      : []),
    `Razem: ${total}`,
    "",
    fulfillment,
  ].join("\n")

  const itemsHtml = itemBlocks
    .map(
      (item) => `
        <tr>
          <td style="padding:0 0 16px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5ED;border:1px solid #D6C7AE">
              <tr>
                <td style="padding:16px 18px">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:16px;font-weight:500;color:#161616">${escapeHtml(item.title)}</td>
                      <td align="right" style="font-size:16px;font-weight:500;color:#161616;white-space:nowrap">${item.price}</td>
                    </tr>
                  </table>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px">
                    ${item.optionHtml}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`,
    )
    .join("")

  const costRow = (label: string, value: string) => `
    <tr>
      <td style="padding:4px 0;color:#7A736C;font-size:14px">${label}</td>
      <td align="right" style="padding:4px 0;color:#161616;font-size:14px;white-space:nowrap">${value}</td>
    </tr>`

  const html = `
<!DOCTYPE html>
<html lang="pl">
  <body style="margin:0;padding:0;background:#F4EFE6">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;padding:32px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;overflow:hidden;font-family:Georgia,'Times New Roman',serif;color:#161616">
            <tr>
              <td style="padding:36px 32px 24px;background:#F9F5ED;border-bottom:1px solid #D6C7AE">
                <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C4A574;font-family:Arial,Helvetica,sans-serif">PetTagi</p>
                <h1 style="margin:0;font-size:28px;line-height:1.3;font-weight:400;color:#161616">Dziękujemy za zamówienie naszej adresówki!</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px">
                <p style="margin:0 0 12px;font-size:16px;font-weight:700">Dokonaj płatności kwoty ${total}:</p>
                <p style="margin:0 0 8px;font-size:15px;line-height:1.6">BLIK na numer: <strong>${recipient.blikPhone}</strong></p>
                <p style="margin:0;font-size:15px;line-height:1.6">
                  Przelew na rachunek bankowy:<br />
                  <strong>${escapeHtml(recipient.accountName)}</strong><br />
                  <strong>${recipient.accountNumber}</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 8px">
                <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9A9288;font-family:Arial,Helvetica,sans-serif">Szczegóły zamówienia</p>
                <p style="margin:0 0 16px;font-size:15px">Numer zamówienia: <strong>${escapeHtml(input.orderId)}</strong></p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${itemsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 8px">
                <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9A9288;font-family:Arial,Helvetica,sans-serif">Dane do wysyłki</p>
                <p style="margin:0;font-size:15px;line-height:1.6">
                  ${escapeHtml(clientName)}<br />
                  ${escapeHtml(address)}<br />
                  ${escapeHtml(order.clientPhone)}<br />
                  ${escapeHtml(order.clientEmail)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 8px">
                <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9A9288;font-family:Arial,Helvetica,sans-serif">Metoda wysyłki i koszty</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${costRow("Wartość produktów", formatPrice(order.productsValue))}
                  ${costRow(`Dostawa — ${escapeHtml(shipping)}`, formatPrice(order.shippingCost))}
                  ${
                    order.fastDelivery
                      ? costRow("Skrócenie czasu realizacji", formatPrice(order.fastDeliveryCost))
                      : ""
                  }
                  <tr>
                    <td style="padding:12px 0 0;font-size:16px;font-weight:500;color:#161616;border-top:1px solid #D6C7AE">Razem</td>
                    <td align="right" style="padding:12px 0 0;font-size:16px;font-weight:500;color:#161616;border-top:1px solid #D6C7AE">${total}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 32px">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#161616">${fulfillment}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim()

  return { html, text }
}
