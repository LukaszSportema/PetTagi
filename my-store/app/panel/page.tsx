import Link from "next/link"
import { redirect } from "next/navigation"
import AdminPanel from "@/app/AdminPanel"
import { signOut } from "@/app/actions/auth"
import { getAuthUser, isAdminUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

export default async function PanelPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login?redirect=/panel")
  if (!isAdminUser(user)) redirect("/?denied=admin")

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#161616]">
      <header className="border-b border-[#D6C7AE] bg-[#F4EFE6]">
        <div className="max-w-7xl mx-auto px-5 md:px-12 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="text-sm text-[#7A736C] hover:text-[#161616] underline shrink-0">
              Sklep
            </Link>
            <h1 className="text-xl md:text-2xl font-serif font-light truncate">Panel administratora</h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 rounded-none text-[10px] uppercase tracking-[0.18em] font-light border border-[#D6C7AE] hover:border-[#161616] transition-colors"
            >
              Wyloguj
            </button>
          </form>
        </div>
      </header>
      <AdminPanel />
    </div>
  )
}
