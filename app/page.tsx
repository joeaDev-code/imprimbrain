import { redirect } from "next/navigation";
import { currentUser } from "@/lib/security";
import { authenticatedHomePath } from "@/lib/ct-access";
export default async function Home() {
  const u = await currentUser();
  redirect(authenticatedHomePath(u?.role ?? null, u?.organizationId ?? null));
}
