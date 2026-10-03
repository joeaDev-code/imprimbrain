import OrderReceiptPage from '@/components/modules/order-receipt-page';
import { requireCTPagePermission } from '@/lib/ct-page';
import { ctPath } from '@/lib/ct-paths';

export default async function CTReceiptPage({ params }: { params: Promise<{ role: string; id: string }> }) {
  const user = await requireCTPagePermission('ORDERS_VIEW');
  const { id } = await params;
  return <OrderReceiptPage params={Promise.resolve({ id })} backHref={ctPath(user.role, '/prestations')} />;
}
