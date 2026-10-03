import { requireSuperAdmin } from '@/lib/security';

export default async function SuperAdminHomePage() {
  const user = await requireSuperAdmin();
  return (
    <section className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Espace plateforme</p>
      <h1 className="text-2xl font-black">Super Admin</h1>
      <p className="text-sm text-white/60">Session plateforme : {user.name}</p>
    </section>
  );
}
