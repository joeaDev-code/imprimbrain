import LegacyNewOrder from '@/app/(admin)/admin/prestations/nouveau/page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTNewOrderPage() {
  await requireCTPagePermission('ORDERS_CREATE');
  return <LegacyNewOrder />;
}
