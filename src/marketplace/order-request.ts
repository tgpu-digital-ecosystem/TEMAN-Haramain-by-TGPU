/** Marketplace order requests: no checkout, payment collection or delivery guarantee. */
export type OrderStatus = 'requested' | 'accepted' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'declined';
export type OrderRequest = {
  id: string;
  buyerId: string;
  merchantId: string;
  itemId: string;
  quantity: number;
  unitPriceHalalas: number;
  deliveryFeeHalalas: number;
  status: OrderStatus;
};
export type OrderActor = 'buyer' | 'merchant';
const transitions: Record<OrderStatus, Partial<Record<OrderActor, readonly OrderStatus[]>>> = {
  requested: { buyer: ['cancelled'], merchant: ['accepted', 'declined'] },
  accepted: { merchant: ['preparing', 'cancelled'] },
  preparing: { merchant: ['out_for_delivery', 'cancelled'] },
  out_for_delivery: { merchant: ['delivered'] },
  delivered: {},
  cancelled: {},
  declined: {},
};
export function canTransitionOrder(current: OrderStatus, next: OrderStatus, actor: OrderActor): boolean {
  return Boolean(transitions[current]?.[actor]?.includes(next));
}
export function orderTotalHalalas(order: OrderRequest): number {
  const { quantity, unitPriceHalalas, deliveryFeeHalalas } = order;
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100 ||
      !Number.isSafeInteger(unitPriceHalalas) || unitPriceHalalas < 0 ||
      !Number.isSafeInteger(deliveryFeeHalalas) || deliveryFeeHalalas < 0) {
    throw new Error('Invalid order quantity or price');
  }
  const total = quantity * unitPriceHalalas + deliveryFeeHalalas;
  if (!Number.isSafeInteger(total)) throw new Error('Order total overflow');
  return total;
}
export function formatSar(halalas: number): string {
  if (!Number.isSafeInteger(halalas) || halalas < 0) throw new Error('Invalid halalas');
  return (halalas / 100).toFixed(2);
}
