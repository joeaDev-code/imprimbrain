import { redirect } from "next/navigation";
import { currentUser } from "@/lib/security";
import { AdminNav } from "@/components/admin-nav";
export default async function AdminLayout({children}:{children:React.ReactNode}){const user=await currentUser();if(!user)redirect('/login');const safeUser={id:user.id,name:user.name,role:user.role};return <div className="min-h-screen flex"><AdminNav user={safeUser}/><main className="min-w-0 flex-1 p-4 md:p-8 lg:p-10">{children}</main></div>}
