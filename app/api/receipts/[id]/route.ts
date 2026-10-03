import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { organizationKey } from '@/lib/domain';
import { decrypt, requireOrgUser } from '@/lib/security';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireOrgUser('ORDERS_VIEW');
    const { id } = await params;
    const order = await db.order.findFirst({
      where: { id, organizationId: user.organizationId! },
      select: {
        id: true,
        ref: true,
        createdAt: true,
        total: true,
        organization: {
          select: {
            id: true,
            name: true,
            phoneEncrypted: true,
            emailEncrypted: true,
            addressEncrypted: true,
          },
        },
        client: {
          select: {
            name: true,
            phoneEncrypted: true,
            whatsappEncrypted: true,
            emailEncrypted: true,
          },
        },
        lines: {
          select: { label: true, quantity: true, unitPrice: true, total: true },
        },
        payments: {
          select: { amount: true, method: true, paidAt: true },
          orderBy: { paidAt: 'asc' },
        },
      },
    });
    if (!order) return NextResponse.json({ error: 'Prestation introuvable' }, { status: 404 });

    const key = await organizationKey(order.organization.id);
    const paid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const lastPayment = order.payments.at(-1);

    return NextResponse.json({
      reference: order.ref,
      createdAt: order.createdAt.toISOString(),
      company: {
        name: order.organization.name,
        phone: decrypt(order.organization.phoneEncrypted, key),
        email: decrypt(order.organization.emailEncrypted, key),
        address: decrypt(order.organization.addressEncrypted, key),
      },
      client: {
        name: order.client?.name ?? 'Client comptoir',
        phone: decrypt(order.client?.phoneEncrypted, key),
        whatsapp: decrypt(order.client?.whatsappEncrypted, key),
        email: decrypt(order.client?.emailEncrypted, key),
      },
      lines: order.lines.map((line) => ({
        service: line.label,
        quantity: Number(line.quantity),
        unit: 'unité',
        price: Number(line.unitPrice),
        total: Number(line.total),
      })),
      payment: { amount: paid, method: lastPayment?.method ?? 'Non renseigné' },
      total: Number(order.total),
      paid,
      remaining: Number(order.total) - paid,
    });
  } catch (error) {
    return apiError(error);
  }
}
