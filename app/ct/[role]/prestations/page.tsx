import LegacyPrestations from '@/components/modules/orders-page';
import { requireCTPagePermission } from '@/lib/ct-page';
import { ctPrestationsBase } from '@/lib/ct-links';

export default async function CTPrestationsPage() {
  const user = await requireCTPagePermission('ORDERS_VIEW');
  return <LegacyPrestations baseHref={ctPrestationsBase(user.role)} />;
}
