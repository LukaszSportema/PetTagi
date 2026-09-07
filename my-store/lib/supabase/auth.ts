import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/supabase/admin"
import type { User } from "@supabase/supabase-js"

export { isAdminUser }

export async function getAuthUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

export type AdminAuthResult =
  | { ok: true; user: User }
  | { ok: false; message: string }

export async function requireAdmin(): Promise<AdminAuthResult> {
  const user = await getAuthUser()
  if (!user) {
    return { ok: false, message: "Wymagane logowanie." }
  }
  if (!isAdminUser(user)) {
    return { ok: false, message: "Brak uprawnień administratora." }
  }
  return { ok: true, user }
}
