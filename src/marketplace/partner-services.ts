/** TEMAN partner services: discovery and enquiry only; no payment or guaranteed booking. */
export const SERVICE_CATEGORIES = [
  'hotel', 'airport_transfer', 'limousine', 'accessible_transport',
  'sim_esim', 'food_delivery', 'shopping_delivery', 'laundry', 'group_services',
] as const;
export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
export type PartnerService = {
  id: string;
  providerId: string;
  category: ServiceCategory;
  title: string;
  city: 'makkah' | 'madinah' | 'jeddah' | 'other';
  currency: 'SAR';
  priceFromHalalas: number | null;
  verifiedProvider: boolean;
  acceptingEnquiries: boolean;
};
export type BookingEnquiry = {
  serviceId: string;
  requesterId: string;
  preferredDate: string | null;
  partySize: number;
  status: 'requested' | 'responded' | 'withdrawn' | 'closed';
};
export function canEnquire(service: PartnerService, partySize: number): boolean {
  return service.verifiedProvider && service.acceptingEnquiries &&
    Number.isSafeInteger(partySize) && partySize >= 1 && partySize <= 100;
}
export function referralCommissionHalalas(
  completedBookingValueHalalas: number,
  commissionBasisPoints: number,
): number {
  if (!Number.isSafeInteger(completedBookingValueHalalas) || completedBookingValueHalalas < 0 ||
      !Number.isSafeInteger(commissionBasisPoints) || commissionBasisPoints < 0 ||
      commissionBasisPoints > 10000) throw new Error('Invalid booking value or commission');
  return Math.round(completedBookingValueHalalas * commissionBasisPoints / 10000);
}
