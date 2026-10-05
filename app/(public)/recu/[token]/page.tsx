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

export const metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export const dynamic = "force-dynamic";

export default async function PublicReceiptPage({
  params,
}: PublicReceiptPageProps) {
  const { token } = await params;

  if (!token || token.length < 20) {
    notFound();
  }

  const orderId = verifyPublicReceiptToken(token);

  if (!orderId) {
    notFound();
  }

  const order = await db.order.findFirst({
    where: {
      id: orderId,
    },
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
        },
      },

      lines: {
        select: {
          label: true,
          quantity: true,
          unitPrice: true,
          total: true,
        },
      },

      payments: {
        select: {
          amount: true,
          method: true,
          paidAt: true,
        },
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

  const key = await organizationKey(organization.id);

  const [phone, email, address] = await Promise.all([
    decrypt(organization.phoneEncrypted, key),
    decrypt(organization.emailEncrypted, key),
    decrypt(organization.addressEncrypted, key),
  ]);

  const total = Number(order.total);

  const paid = order.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const safePaid = Math.min(Math.max(paid, 0), total);

  const remaining = Math.max(total - safePaid, 0);

  const lastPayment =
    order.payments.length > 0
      ? order.payments[order.payments.length - 1]
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
      name: order.client?.name || "Client",
    },

    lines: order.lines.map((line) => ({
      service: line.label,
      quantity: Number(line.quantity),
      unit: "unité",
      price: Number(line.unitPrice),
      total: Number(line.total),
    })),

    payment: {
      amount: safePaid,
      method: lastPayment?.method || "Non renseigné",
    },

    total,

    paid: safePaid,

    remaining,
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Receipt data={receiptData} />
      </div>
    </main>
  );
}