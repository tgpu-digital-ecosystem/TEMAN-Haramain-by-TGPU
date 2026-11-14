import { describe, expect, it } from 'vitest';
import { isValidSarAmount, remainingSar, totalSar } from './travel-money';
describe('TEMAN Travel Money (no funds held)', () => {
  it('adds expenses in integer halalas', () => {
    expect(totalSar([{id:'1',label:'Meal',amountSar:10.10,timestamp:''},
      {id:'2',label:'Water',amountSar:2.20,timestamp:''}])).toBe(12.3);
    expect(remainingSar(100,[{id:'1',label:'Meal',amountSar:10.10,timestamp:''}])).toBe(89.9);
  });
  it('rejects invalid expenses and budgets', () => {
    expect(isValidSarAmount(-1)).toBe(false);
    expect(isValidSarAmount(Number.NaN)).toBe(false);
    expect(() => totalSar([{id:'1',label:'x',amountSar:Infinity,timestamp:''}])).toThrow();
    expect(() => remainingSar(-1,[])).toThrow();
  });
  it('allows overspending to be visible instead of hiding it', () => {
    expect(remainingSar(10,[{id:'1',label:'x',amountSar:15,timestamp:''}])).toBe(-5);
  });
});
