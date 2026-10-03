import ClientsPage from '@/components/modules/clients-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTClientsPage() {
  const user = await requireCTPagePermission('CLIENTS_VIEW');
  return <ClientsPage ctRole={user.role} />;
}
