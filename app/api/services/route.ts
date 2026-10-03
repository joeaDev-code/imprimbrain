import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireOrgUser } from '@/lib/security';
import { writeAudit } from '@/lib/domain';

export async function GET() { const u = await requireOrgUser('SERVICES_VIEW'); return NextResponse.json(await db.service.findMany({ where: { organizationId: u.organizationId! }, orderBy: { name: 'asc' } })); }
export async function POST(req: Request) {
  try { const u = await requireOrgUser('SERVICES_CREATE'); const d = await req.json(); const price = Number(d.price); if (!d.name?.trim() || !Number.isFinite(price) || price < 0) return NextResponse.json({error:'Nom et prix valides requis'},{status:400}); const s=await db.service.create({data:{organizationId:u.organizationId!,name:d.name.trim(),category:d.category?.trim()||null,unit:d.unit?.trim()||'unité',price}}); await writeAudit(u.id,u.organizationId,'SERVICE_CREATED','Service',s.id); return NextResponse.json(s); } catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erreur serveur'},{status:e instanceof Error&&e.message==='FORBIDDEN'?403:400});}
}
export async function PATCH(req: Request) {
  try { const u=await requireOrgUser('SERVICES_UPDATE'); const d=await req.json(); const target=await db.service.findFirst({where:{id:d.id,organizationId:u.organizationId!}}); if(!target)return NextResponse.json({error:'Service introuvable'},{status:404}); const data:any={}; if(d.name!==undefined){if(!String(d.name).trim())return NextResponse.json({error:'Nom requis'},{status:400});data.name=String(d.name).trim();} if(d.category!==undefined)data.category=d.category||null;if(d.unit!==undefined)data.unit=String(d.unit).trim()||'unité';if(d.price!==undefined){const p=Number(d.price);if(!Number.isFinite(p)||p<0)return NextResponse.json({error:'Prix invalide'},{status:400});data.price=p;}if(typeof d.active==='boolean')data.active=d.active;const s=await db.service.update({where:{id:target.id},data});await writeAudit(u.id,u.organizationId,'SERVICE_UPDATED','Service',s.id,data);return NextResponse.json({ok:true}); } catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erreur serveur'},{status:e instanceof Error&&e.message==='FORBIDDEN'?403:400});}
}
export async function DELETE(req: Request) {
  try { const u=await requireOrgUser('SERVICES_DELETE'); const id=new URL(req.url).searchParams.get('id'); if(!id)return NextResponse.json({error:'ID requis'},{status:400});const target=await db.service.findFirst({where:{id,organizationId:u.organizationId!}});if(!target)return NextResponse.json({error:'Service introuvable'},{status:404});await db.service.update({where:{id},data:{active:false}});await writeAudit(u.id,u.organizationId,'SERVICE_ARCHIVED','Service',id);return NextResponse.json({ok:true}); } catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erreur serveur'},{status:e instanceof Error&&e.message==='FORBIDDEN'?403:400});}
}
