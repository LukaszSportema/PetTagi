import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const parsePayload = async (request: Request) => {
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    return request.json()
  }
  const text = await request.text()
  if (!text) return null
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  const payload = await parsePayload(request)
  if (!payload || typeof payload.eventType !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = createClient(url, serviceKey)
  const { error } = await supabase.rpc("track_configurator_event", { p_payload: payload })
  if (error) {
    console.error("track_configurator_event failed", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
