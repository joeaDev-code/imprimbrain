import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2">
          <Image src="/logo/logo-imprim-brain.png" alt="Imprim’Brain" width={170} height={50} className="h-10 w-auto object-contain" />
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
            Gestion intelligente pour imprimeries : clients, prestations, commandes, paiements, stocks et reçus.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold">Produit</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-500">
            <a href="#fonctionnalites" className="block hover:text-cyan-600">Fonctionnalités</a>
            <a href="#tarifs" className="block hover:text-cyan-600">Tarifs</a>
            <a href="#faq" className="block hover:text-cyan-600">FAQ</a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold">Compte</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-500">
            <a href="/connexion" className="block hover:text-cyan-600">Connexion</a>
            <a href="/inscription" className="block hover:text-cyan-600">Créer un espace</a>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} Imprim’Brain. Tous droits réservés.</span>
          <span>Gestion intelligente pour imprimeries</span>
        </div>
      </div>
    </footer>
  );
}
