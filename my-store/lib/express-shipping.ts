export const EXPRESS_SHIPPING_STORAGE_KEY = "pettagi.expressShippingEnabled"

export const parseExpressShippingEnabled = (value: unknown): boolean | null => {
  if (value === true || value === "true" || value === "tak") return true
  if (value === false || value === "false" || value === "nie") return false
  return null
}

export const readStoredExpressShippingEnabled = (): boolean | null => {
  if (typeof window === "undefined") return null
  try {
    return parseExpressShippingEnabled(window.localStorage.getItem(EXPRESS_SHIPPING_STORAGE_KEY))
  } catch {
    return null
  }
}

export const persistExpressShippingEnabled = (enabled: boolean) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(EXPRESS_SHIPPING_STORAGE_KEY, enabled ? "tak" : "nie")
  } catch {
    // ignore storage failures
  }
}
