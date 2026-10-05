import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireOrgUser, can } from '@/lib/security';
import { writeAudit } from '@/lib/domain';
import { apiError } from '@/lib/api-error';
import { readJsonBody } from '@/lib/request-json';
import { canTransitionOrder, stockDecrementWhere } from '@/lib/order-invariants';
import { lockTenantOrder } from '@/lib/order-lock';
import { syncOrderReceivable } from '@/lib/accounts';
import type { PaymentMethod } from '@/generated/prisma/client';
const paymentMethods: PaymentMethod[] = ['CASH', 'ORANGE_MONEY', 'MTN_MONEY', 'MOOV_MONEY', 'WAVE', 'CARD', 'OTHER'];
function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && paymentMethods.includes(value as PaymentMethod);
}
function ref(){return `CMD-${new Date().toISOString().slice(2,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,6).toUpperCase()}`}
export async function GET() {
  try {
    const user = await requireOrgUser('ORDERS_VIEW');
    const rows = await db.order.findMany({
      where: { organizationId: user.organizationId! },
      select: {
        id: true,
        ref: true,
        status: true,
        total: true,
        clientId: true,
        createdAt: true,
        client: { select: { name: true } },
        lines: { select: { id: true, serviceId: true, label: true, quantity: true, unitPrice: true, total: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return NextResponse.json(rows.map((order) => {
      const paid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      return {
        id: order.id,
        ref: order.ref,
        status: order.status,
        total: Number(order.total),
        clientId: order.clientId,
        clientName: order.client?.name ?? 'Client comptoir',
        paid,
        remaining: Number(order.total) - paid,
        createdAt: order.createdAt,
        lines: order.lines.map((line) => ({
          id: line.id,
          serviceId: line.serviceId,
          label: line.label,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          total: Number(line.total),
        })),
      };
    }));
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request){try{const u=await requireOrgUser('ORDERS_CREATE');const input=await readJsonBody(req,64*1024);if(!Array.isArray(input.lines)||input.lines.length<1||input.lines.length>50||input.lines.some((line: any) => !line || typeof line !== 'object' || Array.isArray(line) || typeof line.serviceId !== 'string' || !['number', 'string'].includes(typeof line.quantity)))return NextResponse.json({error:'Ajoutez entre 1 et 50 lignes valides'},{status:400});if(input.clientId !== undefined && input.clientId !== null && typeof input.clientId !== 'string')return NextResponse.json({error:'Client invalide'},{status:400});const methodCandidate: unknown = input.method ?? 'CASH'; if (!isPaymentMethod(methodCandidate)) return NextResponse.json({error:'Mode de paiement invalide'},{status:400}); const method = methodCandidate; if(input.payment !== undefined && input.payment !== null && typeof input.payment !== 'number' && typeof input.payment !== 'string')return NextResponse.json({error:'Montant payé invalide'},{status:400}); if(input.clientId){const client=await db.client.findFirst({where:{id:input.clientId,organizationId:u.organizationId!},select:{id:true}});if(!client)return NextResponse.json({error:'Client invalide'},{status:400})} const result=await db.$transaction(async tx=>{let total=0;const prepared:{serviceId:string,label:string,quantity:number,unitPrice:any,total:number}[]=[];for(const l of input.lines){const s=await tx.service.findFirst({where:{id:l.serviceId,organizationId:u.organizationId!,active:true}});const q=Number(l.quantity);if(!s||!Number.isFinite(q)||q<=0||q>10000)throw new Error('ORDER_INVALID_LINE');const lineTotal=q*Number(s.price);if(!Number.isFinite(lineTotal) || lineTotal < 0 || lineTotal > 1e12) throw new Error('ORDER_INVALID_AMOUNT');total+=lineTotal;prepared.push({serviceId:s.id,label:s.name,quantity:q,unitPrice:s.price,total:lineTotal})}if(!Number.isFinite(total) || total <= 0 || total > 1e12) throw new Error('ORDER_INVALID_AMOUNT');const paid=input.payment === undefined || input.payment === null || input.payment === '' ? 0 : Number(input.payment);if(!Number.isFinite(paid) || paid < 0 || paid > total) throw new Error('ORDER_INVALID_AMOUNT');const order=await tx.order.create({data:{organizationId:u.organizationId!,clientId:input.clientId||null,ref:ref(),total,status:paid>=total?'DELIVERED':'IN_PROGRESS',lines:{create:prepared},payments:paid>0?{create:{amount:paid,method}}:undefined}});if(paid>0){const initialPayment=await tx.payment.findFirst({where:{orderId:order.id},orderBy:{paidAt:'desc'},select:{id:true}});if(initialPayment){await tx.auditLog.create({data:{userId:u.id,organizationId:u.organizationId!,action:'PAYMENT_CREATED',entity:'Payment',entityId:initialPayment.id,metadata:{amount:paid,method,orderId:order.id,initialPayment:true}}})}}for(const l of prepared){const rules=await tx.consumptionRule.findMany({where:{serviceId:l.serviceId,stockItem:{organizationId:u.organizationId!,active:true}},include:{stockItem:true}});for(const rule of rules){const need=l.quantity*Number(rule.qtyPerUnit);const updated=await tx.stockItem.updateMany({where:stockDecrementWhere(u.organizationId!,rule.stockItemId,need),data:{quantity:{decrement:need}}});if(!updated.count)throw new Error('STOCK_INSUFFICIENT');await tx.stockMovement.create({data:{stockItemId:rule.stockItemId,orderId:order.id,kind:'OUT',quantity:need,reason:`Prestation : ${l.label}`}})}}await syncOrderReceivable(tx, { organizationId: u.organizationId!, orderId: order.id, userId: u.id });await tx.auditLog.create({data:{userId:u.id,organizationId:u.organizationId!,action:'ORDER_CREATED',entity:'Order',entityId:order.id,metadata:{ref:order.ref,total}}});return order});return NextResponse.json({id:result.id,ref:result.ref})}catch(e){return apiError(e,['Service ou quantité invalide','Montant payé invalide','Stock insuffisant : '])}}
export async function PATCH(req: Request) {
  try {
    const user = await requireOrgUser('ORDERS_UPDATE');
    const data = await readJsonBody(req, 16 * 1024);
    const target = await db.order.findFirst({ where: { id: data.id, organizationId: user.organizationId! } });
    if (!target) return NextResponse.json({ error: 'Prestation introuvable' }, { status: 404 });

    if (data.status === 'CANCELLED') {
      if (!can(user, 'ORDERS_CANCEL')) return NextResponse.json({ error: 'Interdit' }, { status: 403 });
      const result = await db.$transaction(async (tx) => {
        if (!await lockTenantOrder(tx, target.id, user.organizationId!)) throw new Error('ORDER_NOT_FOUND');
        const order = await tx.order.findFirst({ where: { id: target.id, organizationId: user.organizationId! }, include: { stockMovements: true, payments: true } });
        if (!order) throw new Error('ORDER_NOT_FOUND');
        if (order.status === 'CANCELLED') return order;
        if (order.payments.length) throw new Error('ORDER_HAS_PAYMENTS');
        for (const movement of order.stockMovements) {
          if (movement.kind !== 'OUT') continue;
          await tx.stockItem.update({ where: { id: movement.stockItemId, organizationId: user.organizationId! }, data: { quantity: { increment: Number(movement.quantity) } } });
          await tx.stockMovement.create({ data: { stockItemId: movement.stockItemId, kind: 'IN', quantity: Number(movement.quantity), reason: `Annulation ${order.ref}` } });
        }
        return tx.order.update({ where: { id: target.id, organizationId: user.organizationId! }, data: { status: 'CANCELLED' } });
      });
      await writeAudit(user.id, user.organizationId, 'ORDER_CANCELLED', 'Order', result.id);
      return NextResponse.json({ ok: true });
    }

    if (['PENDING', 'IN_PROGRESS', 'DELIVERED'].includes(data.status)) {
      const order = await db.$transaction(async (tx) => {
        if (!await lockTenantOrder(tx, target.id, user.organizationId!)) throw new Error('ORDER_NOT_FOUND');
        const current = await tx.order.findFirst({ where: { id: target.id, organizationId: user.organizationId! } });
        if (!current) throw new Error('ORDER_NOT_FOUND');
        if (!canTransitionOrder(current.status, data.status)) throw new Error('ORDER_ALREADY_CANCELLED');
        return tx.order.update({ where: { id: target.id, organizationId: user.organizationId! }, data: { status: data.status } });
      });
      await writeAudit(user.id, user.organizationId, 'ORDER_UPDATED', 'Order', order.id, { status: data.status });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Interdit' }, { status: 403 });
    if (message === 'ORDER_NOT_FOUND') return NextResponse.json({ error: 'Prestation introuvable' }, { status: 404 });
    if (message === 'ORDER_ALREADY_CANCELLED') return NextResponse.json({ error: 'Une prestation annulée ne peut pas être réouverte' }, { status: 409 });
    if (message === 'ORDER_HAS_PAYMENTS') return NextResponse.json({ error: 'Une prestation déjà payée doit être remboursée avant annulation' }, { status: 400 });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
