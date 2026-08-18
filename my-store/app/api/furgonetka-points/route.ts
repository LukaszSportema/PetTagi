import { NextRequest, NextResponse } from "next/server"

type MapPoint = {
  code?: string
  name?: string
  is_delivery_point?: boolean
  coordinates?: { latitude?: number | string; longitude?: number | string }
  address?: { street?: string; city?: string; postcode?: string }
}

const apiBase = () =>
  (process.env.NEXT_PUBLIC_FURGONETKA_MAP_ENV === "sandbox"
    ? "https://api.sandbox.furgonetka.pl"
    : "https://api.furgonetka.pl"
  ).replace(/\/$/, "")

const toNumber = (value: number | string | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_FURGONETKA_MAP_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ items: [], message: "Brak klucza mapy Furgonetki." }, { status: 500 })
  }

  const { searchParams } = request.nextUrl
  const query = searchParams.get("q")?.trim() ?? ""
  const lat = toNumber(searchParams.get("lat") ?? undefined)
  const lng = toNumber(searchParams.get("lng") ?? undefined)

  const location: Record<string, unknown> = {}
  if (query) location.search_phrase = query
  if (lat != null && lng != null) {
    location.coordinates = { latitude: lat, longitude: lng }
  }
  if (!location.search_phrase && !location.coordinates) {
    location.coordinates = { latitude: 52.2297, longitude: 21.0122 }
  }

  try {
    const response = await fetch(`${apiBase()}/points/map`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.furgonetka.v1+json",
        "Content-Type": "application/vnd.furgonetka.v1+json",
        "Furgonetka-Map-Api-Key": apiKey,
      },
      body: JSON.stringify({
        location,
        filters: {
          services: ["inpost"],
          map_bounds: "pl",
          limit: 50,
        },
      }),
      cache: "no-store",
    })
    const json = (await response.json()) as { points?: MapPoint[] }
    const items = (json.points ?? [])
      .filter((point) => point.is_delivery_point !== false && point.code)
      .map((point) => ({
        code: point.code ?? "",
        name: point.name || point.code || "",
        latitude: toNumber(point.coordinates?.latitude),
        longitude: toNumber(point.coordinates?.longitude),
        street: point.address?.street ?? "",
        city: point.address?.city ?? "",
        postcode: point.address?.postcode ?? "",
      }))
      .filter((point) => point.latitude != null && point.longitude != null)

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 })
  }
}
