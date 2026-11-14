import { describe, expect, it } from 'vitest';
import { canTransitionOrder, formatSar, orderTotalHalalas, type OrderRequest } from './order-request';
const order: OrderRequest = { id:'1',buyerId:'b',merchantId:'m',itemId:'dates',quantity:3,
  unitPriceHalalas:1599,deliveryFeeHalalas:500,status:'requested' };
describe('TEMAN merchant order requests', () => {
  it('calculates totals in halalas, without payment processing', () => {
    expect(orderTotalHalalas(order)).toBe(5297);
    expect(formatSar(5297)).toBe('52.97');
  });
  it('rejects invalid quantities and amounts', () => {
    expect(() => orderTotalHalalas({...order,quantity:0})).toThrow();
    expect(() => orderTotalHalalas({...order,unitPriceHalalas:-1})).toThrow();
    expect(() => orderTotalHalalas({...order,quantity:1.5})).toThrow();
  });
  it('prevents merchants marking unaccepted orders delivered', () => {
    expect(canTransitionOrder('requested','delivered','merchant')).toBe(false);
    expect(canTransitionOrder('requested','accepted','merchant')).toBe(true);
    expect(canTransitionOrder('accepted','preparing','merchant')).toBe(true);
    expect(canTransitionOrder('preparing','out_for_delivery','merchant')).toBe(true);
    expect(canTransitionOrder('out_for_delivery','delivered','merchant')).toBe(true);
  });
  it('lets buyers cancel pending requests but not impersonate merchants', () => {
    expect(canTransitionOrder('requested','cancelled','buyer')).toBe(true);
    expect(canTransitionOrder('requested','accepted','buyer')).toBe(false);
    expect(canTransitionOrder('delivered','requested','merchant')).toBe(false);
  });
});
