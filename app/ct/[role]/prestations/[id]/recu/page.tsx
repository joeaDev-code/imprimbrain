import LegacyReceipt from '@/components/modules/order-receipt-page';
import { requireCTPagePermission } from '@/lib/ct-page';
import { ctPrestationsBase } from '@/lib/ct-links';

export default async function CTReceiptPage({ params }: { params: Promise<{ role: string; id: string }> }) {
  const user = await requireCTPagePermission('ORDERS_VIEW');
  const { id } = await params;
  return <LegacyReceipt params={Promise.resolve({ id })} backHref={ctPrestationsBase(user.role)} />;
}
