import NewOrderPage from '@/components/modules/new-order-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTNewOrderPage() {
  const user = await requireCTPagePermission('ORDERS_CREATE');
  return <NewOrderPage ctRole={user.role} />;
}
