import AuditPage from '@/components/modules/audit-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTAuditPage() {
  const user = await requireCTPagePermission('AUDIT_VIEW');
  return <AuditPage ctRole={user.role} />;
}
