const ORDER_STATUSES = ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

export function canAcceptPayment(amount: number, total: number, paid: number) {
  return Number.isFinite(amount) && amount > 0 && Number.isFinite(total) && total > 0 && Number.isFinite(paid) && paid >= 0 && amount <= total - paid;
}

export function stockDecrementWhere(organizationId: string, stockItemId: string, required: number) {
  return { id: stockItemId, organizationId, active: true, quantity: { gte: required } };
}

export function canTransitionOrder(currentStatus: string, nextStatus: string) {
  if (!ORDER_STATUSES.includes(currentStatus as OrderStatus) || !ORDER_STATUSES.includes(nextStatus as OrderStatus)) return false;
  if (currentStatus === 'CANCELLED') return nextStatus === 'CANCELLED';
  if (currentStatus === 'DELIVERED') return nextStatus === 'DELIVERED';
  if (currentStatus === 'IN_PROGRESS') return nextStatus === 'IN_PROGRESS' || nextStatus === 'DELIVERED' || nextStatus === 'CANCELLED';
  return nextStatus === 'PENDING' || nextStatus === 'IN_PROGRESS' || nextStatus === 'DELIVERED' || nextStatus === 'CANCELLED';
}
