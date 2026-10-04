import Image from "next/image";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
        <a href="/landing" className="flex items-center">
          <Image src="/logo/logo-imprim-brain.png" alt="Imprim’Brain" width={170} height={50} className="h-10 w-auto object-contain" priority />
        </a>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          <a href="#fonctionnalites" className="transition hover:text-cyan-600">Fonctionnalités</a>
          <a href="#fonctionnement" className="transition hover:text-cyan-600">Comment ça marche</a>
          <a href="#tarifs" className="transition hover:text-cyan-600">Tarifs</a>
          <a href="#faq" className="transition hover:text-cyan-600">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/connexion" className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:inline-flex">Connexion</a>
          <a href="/inscription" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">Créer mon espace</a>
        </div>
      </div>
    </header>
  );
}
