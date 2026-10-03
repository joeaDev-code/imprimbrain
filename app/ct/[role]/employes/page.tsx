import LegacyEmployees from '@/components/modules/employees-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTEmployeesPage() {
  await requireCTPagePermission('EMPLOYEES_VIEW');
  return <LegacyEmployees />;
}