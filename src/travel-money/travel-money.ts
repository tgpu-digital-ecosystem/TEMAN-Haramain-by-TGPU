/** Travel Money is a local budgeting tool, NOT a wallet or payment service. */
export type TravelExpense = { id: string; label: string; amountSar: number; timestamp: string };
const MAX_SAR = 1000000;
function isWholeHalalas(value: number): boolean {
  if (!Number.isFinite(value) || value < 0 || value > MAX_SAR) return false;
  const halalas = value * 100;
  // Floating point representation of values like 10.10 is not exact.
  return Math.abs(halalas - Math.round(halalas)) < 1e-7;
}
export function isValidSarAmount(value: number): boolean {
  return value > 0 && isWholeHalalas(value);
}
export function totalSar(expenses: readonly TravelExpense[]): number {
  if (expenses.some(item => !isValidSarAmount(item.amountSar))) {
    throw new Error('Invalid SAR expense amount');
  }
  return expenses.reduce((cents, item) => cents + Math.round(item.amountSar * 100), 0) / 100;
}
export function remainingSar(budgetSar: number, expenses: readonly TravelExpense[]): number {
  if (!isWholeHalalas(budgetSar)) throw new Error('Invalid SAR budget');
  return Math.round(budgetSar * 100 - totalSar(expenses) * 100) / 100;
}
