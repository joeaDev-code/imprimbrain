import { PageHeader } from '@/components/page-header';
import { requireCTUser } from '@/lib/security';

export default async function CTProfilePage() {
  const user = await requireCTUser();

  return (
    <div className="space-y-5">
      <PageHeader ctRole={user.role} title="Mon profil" subtitle="Consultez les informations de votre compte." />
      <section className="card max-w-2xl p-5">
        <dl className="space-y-4 text-sm">
          <div><dt className="text-xs font-semibold text-slate-500">Nom</dt><dd className="mt-1 font-bold text-slate-900">{user.name}</dd></div>
          <div><dt className="text-xs font-semibold text-slate-500">E-mail</dt><dd className="mt-1 font-bold text-slate-900">{user.email}</dd></div>
          <div><dt className="text-xs font-semibold text-slate-500">Rôle</dt><dd className="mt-1 font-bold text-slate-900">{user.role}</dd></div>
        </dl>
      </section>
    </div>
  );
}
