
import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/security";
import { apiError } from "@/lib/api-error";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _req: Request,
  { params }: RouteContext,
) {
  try {
    const user = await requireOrgUser("ORDERS_VIEW");
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          error: "Identifiant de prestation invalide",
        },
        { status: 400 },
      );
    }

    /*
     * ============================================================
     * COMMANDE
     * ============================================================
     *
     * On conserve exactement les champs déjà confirmés par
     * GET /api/orders.
     */
    const order = await db.order.findFirst({
      where: {
        id,
        organizationId: user.organizationId!,
      },
      select: {
        id: true,
        ref: true,
        status: true,
        total: true,
        clientId: true,
        createdAt: true,

        client: {
          select: {
            name: true,
          },
        },

        lines: {
          select: {
            id: true,
            serviceId: true,
            label: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        },

        /*
         * Paiements réels enregistrés sur la commande.
         *
         * amount et method sont confirmés par la création de
         * Payment dans POST /api/orders.
         *
         * paidAt est également utilisé dans la route de référence
         * lors de la recherche du paiement initial.
         */
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            paidAt: true,
          },
          orderBy: {
            paidAt: "asc",
          },
        },

        /*
         * Mouvements de stock directement liés à la commande.
         *
         * Ces champs sont confirmés par la création de
         * StockMovement dans POST /api/orders.
         */
        stockMovements: {
          select: {
            id: true,
            stockItemId: true,
            kind: true,
            quantity: true,
            reason: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: "Prestation introuvable",
        },
        { status: 404 },
      );
    }

    /*
     * ============================================================
     * CALCUL DES PAIEMENTS
     * ============================================================
     */

    const paid = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const total = Number(order.total);

    const remaining = Math.max(
      0,
      total - paid,
    );

    /*
     * ============================================================
     * ORO — RECEIVABLE
     * ============================================================
     *
     * Le RECEIVABLE utilise orderId.
     */
    const receivable = await db.debtAccount.findFirst({
      where: {
        organizationId: user.organizationId!,
        orderId: order.id,
        type: "RECEIVABLE",
      },
      select: {
        id: true,
        type: true,
        status: true,
        originalAmount: true,
        balance: true,
        orderId: true,
        clientId: true,
        counterpartyName: true,
        label: true,

        entries: {
          select: {
            id: true,
            kind: true,
            amount: true,
            method: true,
          },
        },
      },
    });

    /*
     * ============================================================
     * ORO — PAYABLE / MONNAIE
     * ============================================================
     *
     * Le PAYABLE automatique ne possède volontairement pas
     * orderId. Sa référence de commande est conservée dans son
     * label :
     *
     * "Monnaie à remettre - CMD-XXXXXX"
     */
    const changePayable = await db.debtAccount.findFirst({
      where: {
        organizationId: user.organizationId!,
        type: "PAYABLE",
        label: `Monnaie à remettre - ${order.ref}`,
      },
      select: {
        id: true,
        type: true,
        status: true,
        originalAmount: true,
        balance: true,
        orderId: true,
        clientId: true,
        counterpartyName: true,
        label: true,

        entries: {
          select: {
            id: true,
            kind: true,
            amount: true,
            method: true,
          },
        },
      },
    });

    /*
     * ============================================================
     * AUDIT
     * ============================================================
     *
     * Les informations suivantes ne sont pas des colonnes de
     * Order :
     *
     * - tendered
     * - cashGiven
     * - change
     * - changeDue
     * - changeReturned
     * - changeRemaining
     *
     * Elles sont enregistrées dans metadata lors de la création
     * du paiement / de la commande.
     *
     * On récupère donc les audits liés à cette commande.
     */
    const audits = await db.auditLog.findMany({
      where: {
        organizationId: user.organizationId!,
        entity: "Order",
        entityId: order.id,
      },
      select: {
        action: true,
        metadata: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    /*
     * Recherche de l'audit PAYMENT_CREATED associé à la commande.
     *
     * La route de référence place notamment :
     *
     * amount
     * tendered
     * cashGiven
     * changeDue
     * changeReturned
     * changeRemaining
     * change
     * method
     * orderId
     *
     * dans metadata.
     */
    const paymentAudit = audits.find(
      (audit) => audit.action === "PAYMENT_CREATED",
    );

    const paymentMetadata =
      paymentAudit?.metadata &&
      typeof paymentAudit.metadata === "object" &&
      !Array.isArray(paymentAudit.metadata)
        ? (paymentAudit.metadata as Record<string, unknown>)
        : null;

    /*
     * ============================================================
     * RÉPONSE
     * ============================================================
     */

    return NextResponse.json({
      id: order.id,

      ref: order.ref,

      status: order.status,

      createdAt: order.createdAt,

      client: {
        id: order.clientId,
        name:
          order.client?.name ??
          "Client comptoir",
      },

      totals: {
        total,
        paid,
        remaining,
      },

      payment: {
        method:
          paymentMetadata?.method ??
          order.payments[0]?.method ??
          null,

        tendered:
          typeof paymentMetadata?.tendered === "number"
            ? paymentMetadata.tendered
            : null,

        cashGiven:
          typeof paymentMetadata?.cashGiven === "number"
            ? paymentMetadata.cashGiven
            : null,

        change:
          typeof paymentMetadata?.change === "number"
            ? paymentMetadata.change
            : null,

        changeDue:
          typeof paymentMetadata?.changeDue === "number"
            ? paymentMetadata.changeDue
            : null,

        changeReturned:
          typeof paymentMetadata?.changeReturned === "number"
            ? paymentMetadata.changeReturned
            : null,

        changeRemaining:
          typeof paymentMetadata?.changeRemaining === "number"
            ? paymentMetadata.changeRemaining
            : null,

        payments: order.payments.map(
          (payment) => ({
            id: payment.id,
            amount: Number(payment.amount),
            method: payment.method,
            paidAt: payment.paidAt,
          }),
        ),
      },

      lines: order.lines.map(
        (line) => ({
          id: line.id,
          serviceId: line.serviceId,
          label: line.label,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          total: Number(line.total),
        }),
      ),

      stock: {
        movements: order.stockMovements.map(
          (movement) => ({
            id: movement.id,
            stockItemId: movement.stockItemId,
            kind: movement.kind,
            quantity: Number(movement.quantity),
            reason: movement.reason,
          }),
        ),
      },

      accounts: {
        receivable: receivable
          ? {
              id: receivable.id,
              type: receivable.type,
              status: receivable.status,
              originalAmount:
                Number(receivable.originalAmount),
              balance:
                Number(receivable.balance),
              orderId: receivable.orderId,
              clientId: receivable.clientId,
              counterpartyName:
                receivable.counterpartyName,
              label: receivable.label,

              entries:
                receivable.entries.map(
                  (entry) => ({
                    id: entry.id,
                    kind: entry.kind,
                    amount: Number(entry.amount),
                    method: entry.method,
                  }),
                ),
            }
          : null,

        changePayable: changePayable
          ? {
              id: changePayable.id,
              type: changePayable.type,
              status: changePayable.status,
              originalAmount:
                Number(changePayable.originalAmount),
              balance:
                Number(changePayable.balance),
              orderId: changePayable.orderId,
              clientId: changePayable.clientId,
              counterpartyName:
                changePayable.counterpartyName,
              label: changePayable.label,

              entries:
                changePayable.entries.map(
                  (entry) => ({
                    id: entry.id,
                    kind: entry.kind,
                    amount: Number(entry.amount),
                    method: entry.method,
                  }),
                ),
            }
          : null,
      },

      audits: audits.map(
        (audit) => ({
          action: audit.action,
          metadata: audit.metadata,
        }),
      ),
    });
  } catch (error) {
    return apiError(error);
  }
}
