import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isAdminUser } from "@/lib/supabase/admin"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const admin = isAdminUser(user)

  if (pathname.startsWith("/panel")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (!admin) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = "/"
      homeUrl.searchParams.set("denied", "admin")
      return NextResponse.redirect(homeUrl)
    }
  }

  if (pathname === "/login" && admin) {
    const panelUrl = request.nextUrl.clone()
    panelUrl.pathname = "/panel"
    panelUrl.searchParams.delete("redirect")
    return NextResponse.redirect(panelUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/login",
  ],
}
