import LegacyNewOrder from '@/components/modules/new-order-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTNewOrderPage() {
  await requireCTPagePermission('ORDERS_CREATE');
  return <LegacyNewOrder />;
}
