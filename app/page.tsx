import { redirect } from "next/navigation";
import { currentUser } from "@/lib/security";
export default async function Home() {
  const u = await currentUser();
  redirect(u ? "/admin" : "/login");
}
