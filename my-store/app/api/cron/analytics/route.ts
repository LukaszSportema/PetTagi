import { NextRequest, NextResponse } from "next/server"
import { syncVercelAnalyticsWithServiceRole } from "@/lib/analytics-sync"

export const dynamic = "force-dynamic"

const isAuthorized = (request: NextRequest) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  }

  const result = await syncVercelAnalyticsWithServiceRole()
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
