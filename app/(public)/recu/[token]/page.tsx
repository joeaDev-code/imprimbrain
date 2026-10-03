import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { decrypt } from "@/lib/security";
import { organizationKey } from "@/lib/domain";
import { Receipt } from "@/components/receipt/receipt";
import { verifyPublicReceiptToken } from "@/lib/public-receipt";

type PublicReceiptPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PublicReceiptPage({
  params,
}: PublicReceiptPageProps) {
  const { token } = await params;

  const orderId = verifyPublicReceiptToken(token);

  if (!orderId) {
    notFound();
  }

  const order = await db.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      organization: true,
      client: true,
      lines: true,
      payments: {
        orderBy: {
          paidAt: "asc",
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const organization = order.organization;

  const key = await organizationKey(
    organization.id,
  );

  const [
    phone,
    email,
    address,
    clientPhone,
    clientWhatsapp,
    clientEmail,
  ] = await Promise.all([
    decrypt(
      organization.phoneEncrypted,
      key,
    ),
    decrypt(
      organization.emailEncrypted,
      key,
    ),
    decrypt(
      organization.addressEncrypted,
      key,
    ),
    order.client
      ? decrypt(
          order.client.phoneEncrypted,
          key,
        )
      : null,
    order.client
      ? decrypt(
          order.client.whatsappEncrypted,
          key,
        )
      : null,
    order.client
      ? decrypt(
          order.client.emailEncrypted,
          key,
        )
      : null,
  ]);

  const paid = order.payments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount),
    0,
  );

  const total = Number(order.total);

  const remaining = total - paid;

  const payment =
    order.payments.length > 0
      ? {
          amount: paid,
          method:
            order.payments[
              order.payments.length - 1
            ].method,
        }
      : null;

  const receiptData = {
    reference: order.ref,

    createdAt: order.createdAt.toISOString(),

    company: {
      name: organization.name,
      tagline: "Gestion intelligente pour imprimeries",
      phone,
      email,
      address,
    },

    client: {
      name:
        order.client?.name ||
        "Client",
      phone: clientPhone,
      whatsapp: clientWhatsapp,
      email: clientEmail,
    },

    lines: order.lines.map((line) => ({
      service: line.label,
      quantity: Number(line.quantity),
      unit: "unité",
      price: Number(line.unitPrice),
      total: Number(line.total),
    })),

    payment: {
      amount: paid,
      method: payment?.method || "Non renseigné",
    },

    total,

    paid,

    remaining,
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Receipt data={receiptData} />
      </div>
    </main>
  );
}