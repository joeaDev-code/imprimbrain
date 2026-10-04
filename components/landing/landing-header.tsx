import Image from "next/image";

export function LandingHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="/landing"
          className="flex shrink-0 items-center"
          aria-label="Imprim’Brain"
        >
          <Image
            src="/logo/logo-imprim-brain.png"
            alt="Imprim’Brain"
            width={170}
            height={50}
            className="h-9 w-auto object-contain sm:h-10"
            priority
          />
        </a>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 text-[13px] font-semibold text-slate-500 lg:flex">
          <a
            href="#fonctionnalites"
            className="transition-colors hover:text-[var(--primary)]"
          >
            Fonctionnalités
          </a>

          <a
            href="#fonctionnement"
            className="transition-colors hover:text-[var(--primary)]"
          >
            Comment ça marche
          </a>

          <a
            href="#tarifs"
            className="transition-colors hover:text-[var(--primary)]"
          >
            Tarifs
          </a>

          <a
            href="#faq"
            className="transition-colors hover:text-[var(--primary)]"
          >
            FAQ
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/login"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 sm:inline-flex"
          >
            Connexion
          </a>

          <a
            href="/inscription"
            className="inline-flex items-center rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-cyan-500/30"
          >
            Créer mon espace
          </a>
        </div>
      </div>
    </header>
  );
}