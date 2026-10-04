import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Image src="/logo/logo-imprim-brain.png" alt="Imprim’Brain" width={170} height={50} className="h-10 w-auto object-contain" />
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">Gestion intelligente pour imprimeries : clients, prestations, commandes, paiements, stocks et reçus.</p>
        </div>
        <div><h3 className="text-sm font-bold text-slate-900">Produit</h3><div className="mt-4 space-y-3 text-sm text-slate-500"><a href="#fonctionnalites" className="block transition hover:text-blue-600">Fonctionnalités</a><a href="#fonctionnement" className="block transition hover:text-blue-600">Comment ça marche</a><a href="#tarifs" className="block transition hover:text-blue-600">Tarifs</a><a href="#faq" className="block transition hover:text-blue-600">FAQ</a></div></div>
        <div><h3 className="text-sm font-bold text-slate-900">Compte</h3><div className="mt-4 space-y-3 text-sm text-slate-500"><a href="/connexion" className="block transition hover:text-blue-600">Connexion</a><a href="/inscription" className="block transition hover:text-blue-600">Créer un espace</a></div></div>
      </div>
      <div className="border-t border-slate-100"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>© {new Date().getFullYear()} Imprim’Brain. Tous droits réservés.</span><span>Gestion intelligente pour imprimeries</span></div></div>
    </footer>
  );
}
