import LegacyAudit from '@/components/modules/audit-page';
import { requireCTPagePermission } from '@/lib/ct-page';

export default async function CTAuditPage() {
  await requireCTPagePermission('AUDIT_VIEW');
  return <LegacyAudit />;
}