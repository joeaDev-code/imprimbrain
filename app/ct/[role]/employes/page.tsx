import LegacyEmployees from '@/app/(admin)/admin/employes/page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTEmployeesPage() {
  await requireCTPagePermission('EMPLOYEES_VIEW');
  return <LegacyEmployees />;
}