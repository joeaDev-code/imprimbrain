import LegacyServices from '@/components/modules/services-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTServicesPage() {
  await requireCTPagePermission('SERVICES_VIEW');
  return <LegacyServices />;
}