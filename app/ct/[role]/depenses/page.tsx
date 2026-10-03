import LegacyExpenses from '@/app/(admin)/admin/depenses/page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTExpensesPage() {
  await requireCTPagePermission('EXPENSES_VIEW');
  return <LegacyExpenses />;
}