import Link from "next/link"

export default function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#3A5A40] text-[#F4EFE6] px-4 md:px-6 py-2 md:py-2.5">
      <div className="flex flex-wrap items-center justify-center gap-x-8 md:gap-x-14 gap-y-1 text-center">
        <Link
          href="/regulamin"
          className="text-[10px] md:text-[11px] uppercase tracking-[0.14em] md:tracking-[0.28em] font-light hover:opacity-80 transition-opacity"
        >
          Regulamin
        </Link>
        <Link
          href="/polityka-prywatnosci"
          className="text-[10px] md:text-[11px] uppercase tracking-[0.14em] md:tracking-[0.28em] font-light hover:opacity-80 transition-opacity"
        >
          Polityka prywatności
        </Link>
      </div>
    </footer>
  )
}
