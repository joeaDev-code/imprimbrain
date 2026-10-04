import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/shell";
import { decideSuperAdminRoute } from "@/lib/ct-access";
import { currentUser } from "@/lib/security";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const decision = decideSuperAdminRoute(user?.role ?? null);
  if (decision.kind === "deny") redirect(decision.href);

  return (
    <SuperAdminShell user={{ name: user!.name, email: user!.email, role: user!.role }}>
      {children}
    </SuperAdminShell>
  );
}
