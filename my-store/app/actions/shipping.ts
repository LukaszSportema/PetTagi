"use server"

import { getOrder, saveInpostCode } from "@/app/actions/orders"
import { FurgonetkaError } from "@/lib/furgonetka/client"
import { createInpostDropoffCode } from "@/lib/furgonetka/labels"

export type GenerateLabelResult =
  | { ok: true; code: string }
  | { ok: false; message: string }

export async function generateShippingLabel(orderUuid: string): Promise<GenerateLabelResult> {
  const loaded = await getOrder(orderUuid)
  if (!loaded.ok) return loaded

  const { order } = loaded
  if (order.deliveryType !== "paczkomat" && order.deliveryType !== "kurier") {
    return { ok: false, message: "Kody InPost są dostępne tylko dla paczkomatu i kuriera." }
  }

  if (order.inpostCode) {
    return { ok: true, code: order.inpostCode }
  }

  try {
    const { code } = await createInpostDropoffCode(order)
    await saveInpostCode(order.id, code)
    return { ok: true, code }
  } catch (error) {
    console.error("generateShippingLabel failed", error)
    if (error instanceof FurgonetkaError) {
      return { ok: false, message: error.message }
    }
    return { ok: false, message: "Nie udało się wygenerować kodu InPost. Spróbuj ponownie." }
  }
}
