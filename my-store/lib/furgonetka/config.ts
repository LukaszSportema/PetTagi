const normalizedEnv = () => process.env.FURGONETKA_ENV?.trim().toLowerCase()

const normalizeApiBase = (value: string) => {
  const trimmed = value.trim().replace(/\/$/, "")
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export const isFurgonetkaSandbox = () => {
  const env = normalizedEnv()
  if (env === "production" || env === "prod") return false
  if (env === "sandbox") return true

  const apiUrl = process.env.FURGONETKA_API_URL?.trim()
  if (apiUrl) return apiUrl.includes("sandbox")

  return process.env.NEXT_PUBLIC_FURGONETKA_MAP_ENV === "sandbox"
}

export const furgonetkaApiBase = () => {
  const custom = process.env.FURGONETKA_API_URL?.trim()
  if (custom) return normalizeApiBase(custom)

  return isFurgonetkaSandbox()
    ? "https://api.sandbox.furgonetka.pl"
    : "https://api.furgonetka.pl"
}

export const furgonetkaPanelUrl = () =>
  isFurgonetkaSandbox() ? "https://sandbox.furgonetka.pl" : "https://furgonetka.pl"

export const defaultDropoffPoint = () =>
  (isFurgonetkaSandbox() ? "POP-WAW500" : "WAW97H").toUpperCase()
