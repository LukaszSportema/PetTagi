"use client"

import { useState, type FormEvent } from "react"
import { lookupPublicOrderStatus } from "./actions/order-status"

type Props = {
  open: boolean
  onClose: () => void
}

export default function OrderStatusLookupModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("")
  const [orderId, setOrderId] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const resetAndClose = () => {
    setEmail("")
    setOrderId("")
    setMessage(null)
    setSubmitting(false)
    onClose()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setSubmitting(true)
    const result = await lookupPublicOrderStatus(email, orderId)
    setSubmitting(false)
    setMessage(result.message)
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-[#161616]/40 flex items-center justify-center p-4"
      onClick={resetAndClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-status-lookup-title"
        className="w-full max-w-md bg-[#F9F5ED] border border-[#D6C7AE] p-5 md:p-8 space-y-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="order-status-lookup-title"
          className="font-serif font-light text-xl md:text-2xl text-[#161616] text-center"
        >
          Sprawdź zamówienie
        </h3>
        <p className="text-sm text-[#7A736C] text-center leading-relaxed">
          Wpisz adres e-mail użyty przy zamówieniu oraz numer zamówienia (np. PT-20261008-0086).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#7A736C]">
              Adres e-mail
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-[#D6C7AE] bg-white px-3 py-2.5 text-[#161616] text-sm rounded-none focus:outline-none focus:border-[#3A5A40]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#7A736C]">
              Numer zamówienia
            </span>
            <input
              type="text"
              autoComplete="off"
              required
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="PT-YYYYMMDD-XXXX"
              className="w-full border border-[#D6C7AE] bg-white px-3 py-2.5 text-[#161616] text-sm rounded-none focus:outline-none focus:border-[#3A5A40] uppercase"
            />
          </label>
          {message && (
            <p
              className="text-sm text-[#161616] leading-relaxed border border-[#D6C7AE] bg-[#F4EFE6] px-3 py-3"
              role="status"
            >
              {message}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-5 py-2.5 rounded-none bg-[#3A5A40] text-[#F4EFE6] text-sm hover:bg-[#2E4833] transition-colors disabled:opacity-60"
            >
              {submitting ? "Sprawdzam…" : "Sprawdź status"}
            </button>
            <button
              type="button"
              onClick={resetAndClose}
              className="flex-1 px-5 py-2.5 rounded-none border border-[#D6C7AE] text-[#161616] text-sm hover:border-[#3A5A40] transition-colors"
            >
              Zamknij
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
