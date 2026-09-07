"use client"

const STORAGE_KEY = "pettagi_configurator_session_id"

export const getConfiguratorClientSessionId = () => {
  if (typeof window === "undefined") return ""
  let id = window.sessionStorage.getItem(STORAGE_KEY)
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    window.sessionStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export const resetConfiguratorClientSessionId = () => {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(STORAGE_KEY)
}

export type ConfiguratorTrackPayload =
  | { eventType: "session_start"; clientSessionId: string; productSlug: string }
  | {
      eventType: "step_enter"
      clientSessionId: string
      stepKey: string
      stepLabel: string
      stepIndex: number
    }
  | {
      eventType: "step_leave"
      clientSessionId: string
      stepKey: string
      stepLabel: string
      stepIndex: number
      durationMs: number
      choices: { choiceKey: string; choiceValue: string }[]
    }
  | { eventType: "cart_add"; clientSessionId: string }
  | { eventType: "order_placed"; clientSessionId: string }

export const trackConfiguratorEvent = (payload: ConfiguratorTrackPayload) => {
  const body = JSON.stringify(payload)
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" })
    navigator.sendBeacon("/api/configurator-analytics", blob)
    return
  }
  void fetch("/api/configurator-analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  })
}
