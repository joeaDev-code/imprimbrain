export const INITIAL_SUBSCRIPTION_AMOUNT = 10_000;

/** Adds whole calendar months without overflowing into a second month. */
export function addCalendarMonths(date: Date, months: number): Date {
  if (!Number.isInteger(months) || months < 0) throw new Error('INVALID_MONTH_COUNT');
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(originalDay, lastDay));
  return result;
}
