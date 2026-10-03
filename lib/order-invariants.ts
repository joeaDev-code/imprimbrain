const ORDER_STATUSES = ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'] as const;

export function canAcceptPayment(amount: number, total: number, paid: number) {
  return Number.isFinite(amount) && amount > 0 && Number.isFinite(total) && Number.isFinite(paid) && amount <= total - paid;
}

export function stockDecrementWhere(organizationId: string, stockItemId: string, required: number) {
  return {
    id: stockItemId,
    organizationId,
    active: true,
    quantity: { gte: required },
  };
}

export function canTransitionOrder(currentStatus: string, nextStatus: string) {
  return ORDER_STATUSES.includes(nextStatus as (typeof ORDER_STATUSES)[number]) &&
    (currentStatus !== 'CANCELLED' || nextStatus === 'CANCELLED');
}
