import ServicesPage from '@/components/modules/services-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTServicesPage() {
  const user = await requireCTPagePermission('SERVICES_VIEW');
  return <ServicesPage ctRole={user.role} />;
}
