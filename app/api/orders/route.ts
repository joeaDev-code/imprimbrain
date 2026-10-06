import { NextResponse } from 'next/server';

import { db } from '@/lib/prisma';

import { requireOrgUser, can } from '@/lib/security';

import { writeAudit } from '@/lib/domain';

import { apiError } from '@/lib/api-error';

import { readJsonBody } from '@/lib/request-json';

import {

  canTransitionOrder,

  stockDecrementWhere,

} from '@/lib/order-invariants';

import { lockTenantOrder } from '@/lib/order-lock';

import {
  syncOrderReceivable,
  syncOrderChangePayable,
  debtStatus,
} from '@/lib/accounts';

import {

  clientEncrypted,

  organizationKey,

} from '@/lib/domain';

import type { PaymentMethod } from '@/generated/prisma/client';



const paymentMethods: PaymentMethod[] = [

  'CASH',

  'ORANGE_MONEY',

  'MTN_MONEY',

  'MOOV_MONEY',

  'WAVE',

  'CARD',

  'OTHER',

];



function isPaymentMethod(

  value: unknown,

): value is PaymentMethod {

  return (

    typeof value === 'string' &&

    paymentMethods.includes(

      value as PaymentMethod,

    )

  );

}



function ref() {

  return `CMD-${new Date()

    .toISOString()

    .slice(2, 10)

    .replaceAll('-', '')}-${crypto

    .randomUUID()

    .slice(0, 6)

    .toUpperCase()}`;

}



export async function GET() {

  try {

    const user =

      await requireOrgUser('ORDERS_VIEW');



    const rows =

      await db.order.findMany({

        where: {

          organizationId:

            user.organizationId!,

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

          payments: {

            select: {

              amount: true,

            },

          },

        },

        orderBy: {

          createdAt: 'desc',

        },

        take: 500,

      });



    return NextResponse.json(

      rows.map((order) => {

        const paid =

          order.payments.reduce(

            (sum, payment) =>

              sum + Number(payment.amount),

            0,

          );



        return {

          id: order.id,

          ref: order.ref,

          status: order.status,

          total: Number(order.total),

          clientId: order.clientId,

          clientName:

            order.client?.name ??

            'Client comptoir',

          paid,

          remaining: Math.max(

            0,

            Number(order.total) - paid,

          ),

          createdAt: order.createdAt,

          lines: order.lines.map(

            (line) => ({

              id: line.id,

              serviceId:

                line.serviceId,

              label: line.label,

              quantity:

                Number(line.quantity),

              unitPrice:

                Number(line.unitPrice),

              total:

                Number(line.total),

            }),

          ),

        };

      }),

    );

  } catch (error) {

    return apiError(error);

  }

}



export async function POST(

  req: Request,

) {

  try {

    const u =

      await requireOrgUser(

        'ORDERS_CREATE',

      );



    const input =

      await readJsonBody(

        req,

        64 * 1024,

      );



    if (

      !Array.isArray(input.lines) ||

      input.lines.length < 1 ||

      input.lines.length > 50 ||

      input.lines.some(

        (line: any) =>

          !line ||

          typeof line !== 'object' ||

          Array.isArray(line) ||

          typeof line.serviceId !==

            'string' ||

          ![

            'number',

            'string',

          ].includes(

            typeof line.quantity,

          ),

      )

    ) {

      return NextResponse.json(

        {

          error:

            'Ajoutez entre 1 et 50 lignes valides',

        },

        { status: 400 },

      );

    }



    if (

      input.clientId !==

        undefined &&

      input.clientId !== null &&

      typeof input.clientId !==

        'string'

    ) {

      return NextResponse.json(

        {

          error: 'Client invalide',

        },

        { status: 400 },

      );

    }



    if (

      input.newClient !==

        undefined &&

      input.newClient !== null

    ) {

      const c =

        input.newClient;



      if (

        typeof c !== 'object' ||

        Array.isArray(c) ||

        typeof c.name !==

          'string' ||

        !c.name.trim() ||

        c.name.length > 160

      ) {

        return NextResponse.json(

          {

            error:

              'Nom du nouveau client invalide',

          },

          { status: 400 },

        );

      }



      for (

        const [

          field,

          maximum,

        ] of [

          ['phone', 50],

          ['whatsapp', 50],

          ['email', 254],

        ] as const

      ) {

        if (

          c[field] !==

            undefined &&

          c[field] !== null &&

          (

            typeof c[field] !==

              'string' ||

            c[field].length >

              maximum

          )

        ) {

          return NextResponse.json(

            {

              error:

                'Coordonnées du nouveau client invalides',

            },

            { status: 400 },

          );

        }

      }



      if (input.clientId) {

        return NextResponse.json(

          {

            error:

              'Choisissez un client existant ou un nouveau client, pas les deux',

          },

          { status: 400 },

        );

      }

    }



    const methodCandidate: unknown =

      input.method ?? 'CASH';



    if (

      !isPaymentMethod(

        methodCandidate,

      )

    ) {

      return NextResponse.json(

        {

          error:

            'Mode de paiement invalide',

        },

        { status: 400 },

      );

    }



    const method =

      methodCandidate;



    /*
     * `payment` reste la valeur de référence pour les paiements
     * non espèces.
     *
     * Pour un paiement CASH, `cashGiven` représente le montant
     * réellement remis par le client. `payment` peut rester
     * présent pour compatibilité avec les appels existants.
     */
    if (
      input.payment !== undefined &&
      input.payment !== null &&
      input.payment !== '' &&
      typeof input.payment !== 'number' &&
      typeof input.payment !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Montant remis invalide' },
        { status: 400 },
      );
    }

    if (
      input.cashGiven !== undefined &&
      input.cashGiven !== null &&
      input.cashGiven !== '' &&
      typeof input.cashGiven !== 'number' &&
      typeof input.cashGiven !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Montant remis invalide' },
        { status: 400 },
      );
    }

    if (
      input.changeReturned !== undefined &&
      input.changeReturned !== null &&
      input.changeReturned !== '' &&
      typeof input.changeReturned !== 'number' &&
      typeof input.changeReturned !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Montant de monnaie rendu invalide' },
        { status: 400 },
      );
    }




    if (input.clientId) {

      const client =

        await db.client.findFirst({

          where: {

            id: input.clientId,

            organizationId:

              u.organizationId!,

          },

          select: {

            id: true,

          },

        });



      if (!client) {

        return NextResponse.json(

          {

            error:

              'Client invalide',

          },

          { status: 400 },

        );

      }

    }



    const organizationDataKey =

      input.newClient

        ? await organizationKey(

            u.organizationId!,

          )

        : null;



    const result =

      await db.$transaction(

        async (tx) => {

          /*

           * ========================================================

           * CALCUL DU TOTAL

           * ========================================================

           */

          let total = 0;



          const prepared: {

            serviceId: string;

            label: string;

            quantity: number;

            unitPrice: any;

            total: number;

          }[] = [];



          for (

            const l of input.lines

          ) {

            const s =

              await tx.service.findFirst(

                {

                  where: {

                    id: l.serviceId,

                    organizationId:

                      u.organizationId!,

                    active: true,

                  },

                },

              );



            const q =

              Number(

                l.quantity,

              );



            if (

              !s ||

              !Number.isFinite(q) ||

              q <= 0 ||

              q > 10000

            ) {

              throw new Error(

                'ORDER_INVALID_LINE',

              );

            }



            const lineTotal =

              q * Number(s.price);



            if (

              !Number.isFinite(

                lineTotal,

              ) ||

              lineTotal < 0 ||

              lineTotal > 1e12

            ) {

              throw new Error(

                'ORDER_INVALID_AMOUNT',

              );

            }



            total += lineTotal;



            prepared.push({

              serviceId: s.id,

              label: s.name,

              quantity: q,

              unitPrice: s.price,

              total: lineTotal,

            });

          }



          if (

            !Number.isFinite(total) ||

            total <= 0 ||

            total > 1e12

          ) {

            throw new Error(

              'ORDER_INVALID_AMOUNT',

            );

          }



          /*

           * ========================================================

           * MONTANT REMIS / PAIEMENT / MONNAIE

           * ========================================================

           */

          const tenderedInput =
            method === 'CASH'
              ? input.cashGiven !== undefined &&
                input.cashGiven !== null &&
                input.cashGiven !== ''
                ? input.cashGiven
                : input.payment
              : input.payment;

          const tendered =
            tenderedInput === undefined ||
            tenderedInput === null ||
            tenderedInput === ''
              ? 0
              : Number(tenderedInput);

          if (
            !Number.isFinite(tendered) ||
            tendered < 0 ||
            tendered > 1e12
          ) {
            throw new Error('ORDER_INVALID_AMOUNT');
          }

          const changeReturnedInput =
            method === 'CASH'
              ? input.changeReturned
              : 0;

          const changeReturned =
            changeReturnedInput === undefined ||
            changeReturnedInput === null ||
            changeReturnedInput === ''
              ? 0
              : Number(changeReturnedInput);

          if (
            !Number.isFinite(changeReturned) ||
            changeReturned < 0 ||
            changeReturned > 1e12
          ) {
            throw new Error('ORDER_INVALID_AMOUNT');
          }

          /*
           * Une monnaie ne peut être générée que pour
           * un paiement en espèces.
           *
           * `changeReturned` représente uniquement la partie
           * de la monnaie déjà rendue au client.
           */

          if (
            tendered >
              total + 0.009 &&
            method !== 'CASH'
          ) {
            throw new Error(
              'CHANGE_REQUIRES_CASH',
            );
          }

          const amountPaid =
            Math.min(
              tendered,
              total,
            );

          const changeAmount =
            Math.max(
              0,
              tendered - total,
            );

          if (
            changeReturned >
              changeAmount + 0.009
          ) {
            throw new Error(
              'CHANGE_RETURNED_EXCEEDS_DUE',
            );
          }

          const changeRemaining =
            Math.max(
              0,
              changeAmount - changeReturned,
            );




          /*

           * ========================================================

           * CLIENT

           * ========================================================

           */

          let resolvedClientId:

            | string

            | null =

            input.clientId ||

            null;



          if (input.newClient) {

            if (

              !organizationDataKey

            ) {

              throw new Error(

                'ORGANIZATION_NOT_FOUND',

              );

            }



            const createdClient =

              await tx.client.create(

                {

                  data: {

                    organizationId:

                      u.organizationId!,

                    ...clientEncrypted(

                      u.organizationId!,

                      organizationDataKey,

                      input.newClient,

                    ),

                  },

                },

              );



            resolvedClientId =

              createdClient.id;



            await tx.auditLog.create(

              {

                data: {

                  userId: u.id,

                  organizationId:

                    u.organizationId!,

                  action:

                    'CLIENT_CREATED',

                  entity:

                    'Client',

                  entityId:

                    createdClient.id,

                  metadata: {

                    source:

                      'ORDER_CREATION',

                  },

                },

              },

            );

          }



          /*

           * ========================================================

           * COMMANDE

           * ========================================================

           */

          const order =

            await tx.order.create({

              data: {

                organizationId:

                  u.organizationId!,

                clientId:

                  resolvedClientId,

                ref: ref(),

                total,

                status:

                  amountPaid >=

                  total

                    ? 'DELIVERED'

                    : 'IN_PROGRESS',

                lines: {

                  create:

                    prepared,

                },

                payments:

                  amountPaid > 0

                    ? {

                        create: {

                          amount:

                            amountPaid,

                          method,

                        },

                      }

                    : undefined,

              },

            });



          /*

           * ========================================================

           * AUDIT DU PAIEMENT

           * ========================================================

           */

          if (

            amountPaid > 0

          ) {

            const initialPayment =

              await tx.payment.findFirst(

                {

                  where: {

                    orderId:

                      order.id,

                  },

                  orderBy: {

                    paidAt:

                      'desc',

                  },

                  select: {

                    id: true,

                  },

                },

              );



            if (

              initialPayment

            ) {

              await tx.auditLog.create(

                {

                  data: {

                    userId: u.id,

                    organizationId:

                      u.organizationId!,

                    action:

                      'PAYMENT_CREATED',

                    entity:

                      'Payment',

                    entityId:

                      initialPayment.id,

                    metadata: {

                      amount:

                        amountPaid,

                      tendered,
                      cashGiven:
                        method === 'CASH'
                          ? tendered
                          : null,

                      changeDue:
                        changeAmount,

                      changeReturned,

                      changeRemaining,

                      change:

                        changeAmount,

                      method,

                      orderId:

                        order.id,

                      initialPayment:

                        true,

                    },

                  },

                },

              );

            }

          }



          /*

           * ========================================================

           * STOCK

           * ========================================================

           */

          for (

            const l of prepared

          ) {

            const rules =

              await tx.consumptionRule.findMany(

                {

                  where: {

                    serviceId:

                      l.serviceId,

                    stockItem: {

                      organizationId:

                        u.organizationId!,

                      active: true,

                    },

                  },

                  include: {

                    stockItem:

                      true,

                  },

                },

              );



            for (

              const rule of rules

            ) {

              const need =

                l.quantity *

                Number(

                  rule.qtyPerUnit,

                );



              const updated =

                await tx.stockItem.updateMany(

                  {

                    where:

                      stockDecrementWhere(

                        u.organizationId!,

                        rule.stockItemId,

                        need,

                      ),

                    data: {

                      quantity: {

                        decrement:

                          need,

                      },

                    },

                  },

                );



              if (

                !updated.count

              ) {

                throw new Error(

                  'STOCK_INSUFFICIENT',

                );

              }



              await tx.stockMovement.create(

                {

                  data: {

                    stockItemId:

                      rule.stockItemId,

                    orderId:

                      order.id,

                    kind: 'OUT',

                    quantity:

                      need,

                    reason:

                      `Prestation : ${l.label}`,

                  },

                },

              );

            }

          }



          /*

           * ========================================================

           * ORO — RECEIVABLE

           * ========================================================

           */

          await syncOrderReceivable(

            tx,

            {

              organizationId:

                u.organizationId!,

              orderId:

                order.id,

              userId: u.id,

            },

          );



          /*
           * ========================================================
           * ORO — PAYABLE / MONNAIE
           * ========================================================
           */
          if (changeAmount > 0.009) {
            const changePayable =
              await syncOrderChangePayable(
                tx,
                {
                  organizationId:
                    u.organizationId!,
                  orderId:
                    order.id,
                  clientId:
                    resolvedClientId,
                  changeAmount,
                  userId: u.id,
                },
              );

            if (
              changePayable &&
              changeReturned > 0.009
            ) {
              await tx.debtAccount.update({
                where: {
                  id: changePayable.id,
                  organizationId:
                    u.organizationId!,
                },
                data: {
                  balance: changeRemaining,
                  status: debtStatus(
                    Number(changePayable.originalAmount),
                    changeRemaining,
                  ),
                },
              });

              await tx.debtEntry.create({
                data: {
                  debtAccountId:
                    changePayable.id,
                  kind: 'PAYMENT',
                  amount: changeReturned,
                  method: 'CASH',
                  createdById: u.id,
                },
              });
            }
          }

          /*

           * ========================================================

           * AUDIT COMMANDE

           * ========================================================

           */

          await tx.auditLog.create(

            {

              data: {

                userId: u.id,

                organizationId:

                  u.organizationId!,

                action:

                  'ORDER_CREATED',

                entity:

                  'Order',

                entityId:

                  order.id,

                metadata: {

                  ref:

                    order.ref,

                  total,

                  tendered,
                  cashGiven:
                    method === 'CASH'
                      ? tendered
                      : null,

                  amountPaid,

                  change:

                    changeAmount,
                  changeDue:
                    changeAmount,

                  changeReturned,

                  changeRemaining,

                },

              },

            },

          );



          return {

            id: order.id,

            ref: order.ref,

            clientId:

              order.clientId,

            total,

            tendered,
            cashGiven:
              method === 'CASH'
                ? tendered
                : null,

            amountPaid,

            change:

              changeAmount,
            changeDue:
              changeAmount,

            changeReturned,

            changeRemaining,

            method,

          };

        },

      );



    return NextResponse.json({

      id: result.id,

      ref: result.ref,

      clientId:

        result.clientId,

      total:

        result.total,

      tendered:

        result.tendered,
      cashGiven:
        result.cashGiven,

      paid:

        result.amountPaid,
      change:

        result.change,
      changeDue:
        result.changeDue,

      changeReturned:
        result.changeReturned,

      changeRemaining:
        result.changeRemaining,

      method:

        result.method,

    });

  } catch (e) {

    return apiError(e, [

      'Service ou quantité invalide',

      'Montant payé invalide',

      'Montant remis invalide',

      'Montant de monnaie rendu invalide',

      'La monnaie rendue ne peut pas dépasser la monnaie due',

      'Stock insuffisant : ',

      'Le paiement supérieur au total doit être effectué en espèces',

    ]);

  }

}



export async function PATCH(

  req: Request,

) {

  try {

    const user =

      await requireOrgUser(

        'ORDERS_UPDATE',

      );



    const data =

      await readJsonBody(

        req,

        16 * 1024,

      );



    const target =

      await db.order.findFirst({

        where: {

          id: data.id,

          organizationId:

            user.organizationId!,

        },

      });



    if (!target) {

      return NextResponse.json(

        {

          error:

            'Prestation introuvable',

        },

        { status: 404 },

      );

    }



    if (

      data.status ===

      'CANCELLED'

    ) {

      if (

        !can(

          user,

          'ORDERS_CANCEL',

        )

      ) {

        return NextResponse.json(

          {

            error:

              'Interdit',

          },

          { status: 403 },

        );

      }



      const result =

        await db.$transaction(

          async (tx) => {

            if (

              !await lockTenantOrder(

                tx,

                target.id,

                user.organizationId!,

              )

            ) {

              throw new Error(

                'ORDER_NOT_FOUND',

              );

            }



            const order =

              await tx.order.findFirst(

                {

                  where: {

                    id: target.id,

                    organizationId:

                      user.organizationId!,

                  },

                  include: {

                    stockMovements:

                      true,

                    payments: true,

                  },

                },

              );



            if (!order) {

              throw new Error(

                'ORDER_NOT_FOUND',

              );

            }



            if (

              order.status ===

              'CANCELLED'

            ) {

              return order;

            }



            if (

              order.payments.length

            ) {

              throw new Error(

                'ORDER_HAS_PAYMENTS',

              );

            }



            for (

              const movement of

                order.stockMovements

            ) {

              if (

                movement.kind !==

                'OUT'

              ) {

                continue;

              }



              await tx.stockItem.update(

                {

                  where: {

                    id:

                      movement.stockItemId,

                    organizationId:

                      user.organizationId!,

                  },

                  data: {

                    quantity: {

                      increment:

                        Number(

                          movement.quantity,

                        ),

                    },

                  },

                },

              );



              await tx.stockMovement.create(

                {

                  data: {

                    stockItemId:

                      movement.stockItemId,

                    kind: 'IN',

                    quantity:

                      Number(

                        movement.quantity,

                      ),

                    reason:

                      `Annulation ${order.ref}`,

                  },

                },

              );

            }



            return tx.order.update({

              where: {

                id: target.id,

                organizationId:

                  user.organizationId!,

              },

              data: {

                status:

                  'CANCELLED',

              },

            });

          },

        );



      await writeAudit(

        user.id,

        user.organizationId,

        'ORDER_CANCELLED',

        'Order',

        result.id,

      );



      return NextResponse.json({

        ok: true,

      });

    }



    if (

      [

        'PENDING',

        'IN_PROGRESS',

        'DELIVERED',

      ].includes(

        data.status,

      )

    ) {

      const order =

        await db.$transaction(

          async (tx) => {

            if (

              !await lockTenantOrder(

                tx,

                target.id,

                user.organizationId!,

              )

            ) {

              throw new Error(

                'ORDER_NOT_FOUND',

              );

            }



            const current =

              await tx.order.findFirst(

                {

                  where: {

                    id: target.id,

                    organizationId:

                      user.organizationId!,

                  },

                },

              );



            if (!current) {

              throw new Error(

                'ORDER_NOT_FOUND',

              );

            }



            if (

              !canTransitionOrder(

                current.status,

                data.status,

              )

            ) {

              throw new Error(

                'ORDER_ALREADY_CANCELLED',

              );

            }



            return tx.order.update({

              where: {

                id: target.id,

                organizationId:

                  user.organizationId!,

              },

              data: {

                status:

                  data.status,

              },

            });

          },

        );



      await writeAudit(

        user.id,

        user.organizationId,

        'ORDER_UPDATED',

        'Order',

        order.id,

        {

          status:

            data.status,

        },

      );



      return NextResponse.json({

        ok: true,

      });

    }



    return NextResponse.json(

      {

        error:

          'Statut invalide',

      },

      { status: 400 },

    );

  } catch (error) {

    const message =

      error instanceof Error

        ? error.message

        : '';



    if (

      message ===

      'UNAUTHORIZED'

    ) {

      return NextResponse.json(

        {

          error:

            'Non autorisé',

        },

        { status: 401 },

      );

    }



    if (

      message ===

      'FORBIDDEN'

    ) {

      return NextResponse.json(

        {

          error:

            'Interdit',

        },

        { status: 403 },

      );

    }



    if (

      message ===

      'ORDER_NOT_FOUND'

    ) {

      return NextResponse.json(

        {

          error:

            'Prestation introuvable',

        },

        { status: 404 },

      );

    }



    if (

      message ===

      'ORDER_ALREADY_CANCELLED'

    ) {

      return NextResponse.json(

        {

          error:

            'Une prestation annulée ne peut pas être réouverte',

        },

        { status: 409 },

      );

    }



    if (

      message ===

      'ORDER_HAS_PAYMENTS'

    ) {

      return NextResponse.json(

        {

          error:

            'Une prestation déjà payée doit être remboursée avant annulation',

        },

        { status: 400 },

      );

    }



    return NextResponse.json(

      {

        error:

          'Erreur serveur',

      },

      { status: 500 },

    );

  }

}