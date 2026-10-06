import Image from "next/image";
import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="sticky top-3 z-50 px-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-[68px] items-center justify-between rounded-[22px] border border-slate-200/80 bg-white/95 px-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:h-[72px] sm:px-5 lg:px-6">
          {/* Logo */}
          <a
            href="/"
            className="flex shrink-0 items-center"
            aria-label="Imprim’Brain"
          >
            <Image
              src="/logo/logo-imprim-brain.png"
              alt="Imprim’Brain"
              width={170}
              height={50}
              className="h-8 w-auto object-contain sm:h-9"
              priority
            />
          </a>

          {/* Navigation */}
          <nav className="hidden items-center gap-7 text-[13px] font-semibold text-slate-500 lg:flex">
            <a
              href="#fonctionnalites"
              className="rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              Fonctionnalités
            </a>

            <a
              href="#fonctionnement"
              className="rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              Comment ça marche
            </a>

            <a
              href="#tarifs"
              className="rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              Tarifs
            </a>

            <a
              href="#faq"
              className="rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              FAQ
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Connexion */}
            <Link
              href="/login"
              className="hidden rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-950 sm:inline-flex"
            >
              Connexion
            </Link>

            {/* Découvrir */}
            <Link
              href="/discover"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-500 bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-600 hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/25 active:translate-y-0"
            >
              Découvrir
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}