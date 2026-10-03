import LegacyClients from '@/components/modules/clients-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTClientsPage() {
  await requireCTPagePermission('CLIENTS_VIEW');
  return <LegacyClients />;
}