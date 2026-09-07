"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useState } from "react"
import { isAdminUser } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/panel"
  const authError = searchParams.get("error") === "auth"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(authError ? "Nie udało się zalogować. Spróbuj ponownie." : "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError || !data.user) {
      setError("Nieprawidłowy e-mail lub hasło.")
      setIsSubmitting(false)
      return
    }

    if (!isAdminUser(data.user)) {
      await supabase.auth.signOut()
      setError("To konto nie ma uprawnień administratora.")
      setIsSubmitting(false)
      return
    }

    router.replace(redirect.startsWith("/") ? redirect : "/panel")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#161616] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md bg-white border border-[#D6C7AE] rounded-3xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-serif font-light">Logowanie</h1>
          <p className="text-sm text-[#7A736C]">Panel administratora PetTagi</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-[#7A736C]">E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-[#D6C7AE] rounded-none px-4 py-3 bg-white focus:outline-none focus:border-[#3A5A40]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-[#7A736C]">Hasło</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-[#D6C7AE] rounded-none px-4 py-3 bg-white focus:outline-none focus:border-[#3A5A40]"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#3A5A40] hover:bg-[#2E4833] disabled:opacity-50 text-[#F4EFE6] py-3 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors"
          >
            {isSubmitting ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>

        <p className="text-center text-sm">
          <Link href="/" className="text-[#7A736C] hover:text-[#161616] underline">
            Wróć do sklepu
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4EFE6]" />}>
      <LoginForm />
    </Suspense>
  )
}
