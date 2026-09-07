"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { isAdminUser } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/client"

export default function AdminNavButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const sync = async () => {
      const { data } = await supabase.auth.getUser()
      setVisible(isAdminUser(data.user))
    }

    sync()
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      sync()
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  if (!visible) return null

  return (
    <Link
      href="/panel"
      className="px-3 md:px-4 py-1.5 md:py-2 rounded-none text-[10px] md:text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light transition-colors duration-300 bg-transparent text-[#161616] border border-[#D6C7AE] hover:border-[#161616]"
    >
      Panel
    </Link>
  )
}
