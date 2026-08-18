type FurgonetkaJson = Record<string, unknown> | unknown[] | null

export class FurgonetkaError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly body?: FurgonetkaJson,
  ) {
    super(message)
    this.name = "FurgonetkaError"
  }
}

type TokenCache = {
  accessToken: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

const apiBase = () =>
  (process.env.FURGONETKA_API_URL ?? "https://api.sandbox.furgonetka.pl").replace(/\/$/, "")

const basicAuth = () => {
  const clientId = process.env.FURGONETKA_CLIENT_ID
  const clientSecret = process.env.FURGONETKA_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new FurgonetkaError(
      "Brak FURGONETKA_CLIENT_ID lub FURGONETKA_CLIENT_SECRET w .env.local.",
    )
  }
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
}

const explainApiError = (path?: string, message?: string, details?: string) => {
  const text = [message, details].filter(Boolean).join(" ").toLowerCase()
  const isPhonePath = path === "/phone" || path === "phone" || path?.endsWith("/phone")
  if (isPhonePath && text.includes("zweryfikuj")) {
    return [
      "Konto Furgonetki wymaga weryfikacji numeru telefonu, zanim da się zamówić przesyłkę.",
      "Zaloguj się na https://sandbox.furgonetka.pl → Dane konta → Zweryfikuj swój numer telefonu (SMS), potem spróbuj ponownie wygenerować kod.",
      "Na koncie prywatnym weryfikacja jest obowiązkowa; na firmowym jest opcjonalna.",
    ].join(" ")
  }
  if (text.includes("nadanie bez etykiety") && text.includes("punkcie")) {
    return [
      "Nadanie bez etykiety wymaga paczkomatu lub punktu nadania, nie podjazdu kuriera.",
      "Ustaw FURGONETKA_DROPOFF_POINT w .env.local (punkt nadania, np. POP-WAW500 na sandboxie).",
    ].join(" ")
  }
  if ((path === "/pickup/point" || path === "pickup/point" || path?.endsWith("/pickup/point")) && text.includes("poprawny")) {
    return [
      "Furgonetka nie zna punktu nadania z FURGONETKA_DROPOFF_POINT.",
      "Na sandboxie użyj kodu z mapy sandboxa (np. POP-WAW500), na produkcji WAW97H.",
    ].join(" ")
  }
  return [path, message, details].filter(Boolean).join(": ")
}

const formatApiErrors = (body: FurgonetkaJson): string => {
  if (body && typeof body === "object" && "errors" in body) {
    const errors = (body as { errors?: unknown }).errors
    if (Array.isArray(errors) && errors.length > 0) {
      return errors
        .map((item) => {
          if (!item || typeof item !== "object") return String(item)
          const error = item as { path?: string; message?: string; details?: string; code?: string }
          return explainApiError(error.path, error.message, error.details)
        })
        .join("; ")
    }
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>
    const message =
      (typeof record.error_description === "string" && record.error_description) ||
      (typeof record.message === "string" && record.message) ||
      (typeof record.error === "string" && record.error)
    if (message) return message
  }

  return "Nieznany błąd API Furgonetki."
}

const parseJson = (text: string): FurgonetkaJson => {
  if (!text) return null
  try {
    return JSON.parse(text) as FurgonetkaJson
  } catch {
    return null
  }
}

async function fetchAccessToken(): Promise<string> {
  const username = process.env.FURGONETKA_USERNAME
  const password = process.env.FURGONETKA_PASSWORD
  if (!username || !password) {
    throw new FurgonetkaError("Brak FURGONETKA_USERNAME lub FURGONETKA_PASSWORD w .env.local.")
  }

  const response = await fetch(`${apiBase()}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "password",
      scope: "api",
      username,
      password,
    }),
    cache: "no-store",
  })

  const body = parseJson(await response.text()) as Record<string, unknown> | null
  if (!response.ok || !body || typeof body.access_token !== "string") {
    throw new FurgonetkaError(
      `Nie udało się zalogować do Furgonetki (HTTP ${response.status}): ${formatApiErrors(body)}`,
      response.status,
      body,
    )
  }

  const expiresIn = typeof body.expires_in === "number" ? body.expires_in : 3600
  tokenCache = {
    accessToken: body.access_token,
    expiresAt: Date.now() + Math.max(expiresIn - 60, 30) * 1000,
  }
  return tokenCache.accessToken
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken
  }
  return fetchAccessToken()
}

type RequestOptions = {
  method: string
  path: string
  body?: unknown
  version?: "v1" | "v2"
  accept?: string
}

export async function furgonetkaRequest(options: RequestOptions): Promise<{
  status: number
  json: FurgonetkaJson
  buffer: ArrayBuffer
  contentType: string
}> {
  const token = await getAccessToken()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: options.accept ?? "application/vnd.furgonetka.v1+json",
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = `application/vnd.furgonetka.${options.version ?? "v1"}+json`
  }

  const response = await fetch(`${apiBase()}${options.path}`, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  })

  const contentType = response.headers.get("content-type") ?? ""
  const buffer = await response.arrayBuffer()
  const text = new TextDecoder().decode(buffer)
  const json = contentType.includes("json") || text.startsWith("{") || text.startsWith("[")
    ? parseJson(text)
    : null

  if (response.status >= 400) {
    throw new FurgonetkaError(
      `${options.method} ${options.path} (HTTP ${response.status}): ${formatApiErrors(json)}`,
      response.status,
      json,
    )
  }

  return { status: response.status, json, buffer, contentType }
}
