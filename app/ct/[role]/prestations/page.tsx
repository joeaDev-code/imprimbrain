import OrdersPage from '@/components/modules/orders-page';
import { requireCTPagePermission } from '@/lib/ct-page';
import { ctPath } from '@/lib/ct-paths';

export default async function CTPrestationsPage() {
  const user = await requireCTPagePermission('ORDERS_VIEW');
  return <OrdersPage baseHref={ctPath(user.role)} ctRole={user.role} />;
}
