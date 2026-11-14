/** Travel Money is a local budgeting tool, NOT a wallet or payment service. */
export type TravelExpense = { id: string; label: string; amountSar: number; timestamp: string };
export function isValidSarAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 1000000 &&
    Math.round(value * 100) === value * 100;
}
export function totalSar(expenses: readonly TravelExpense[]): number {
  if (expenses.some(item => !isValidSarAmount(item.amountSar))) {
    throw new Error('Invalid SAR expense amount');
  }
  return expenses.reduce((cents, item) => cents + Math.round(item.amountSar * 100), 0) / 100;
}
export function remainingSar(budgetSar: number, expenses: readonly TravelExpense[]): number {
  if (!Number.isFinite(budgetSar) || budgetSar < 0 ||
      Math.round(budgetSar * 100) !== budgetSar * 100) {
    throw new Error('Invalid SAR budget');
  }
  return Math.round((budgetSar - totalSar(expenses)) * 100) / 100;
}
