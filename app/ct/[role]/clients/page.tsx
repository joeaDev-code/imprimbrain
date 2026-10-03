import LegacyClients from '@/app/(admin)/admin/clients/page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTClientsPage() {
  await requireCTPagePermission('CLIENTS_VIEW');
  return <LegacyClients />;
}