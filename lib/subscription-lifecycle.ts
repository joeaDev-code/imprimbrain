export const INITIAL_SUBSCRIPTION_AMOUNT = 10_000;

/** Adds whole calendar months to `date` (same semantics as native Date#setMonth). */
export function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
