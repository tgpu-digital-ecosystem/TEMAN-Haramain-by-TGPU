import { describe, expect, it } from 'vitest';
import { canEnquire, referralCommissionHalalas, type PartnerService } from './partner-services';
const service: PartnerService = {
  id:'s',providerId:'p',category:'limousine',title:'Private transfer',
  city:'makkah',currency:'SAR',priceFromHalalas:12000,
  verifiedProvider:true,acceptingEnquiries:true,
};
describe('TEMAN partner service enquiry', () => {
  it('requires verified active providers', () => {
    expect(canEnquire(service,2)).toBe(true);
    expect(canEnquire({...service,verifiedProvider:false},2)).toBe(false);
    expect(canEnquire({...service,acceptingEnquiries:false},2)).toBe(false);
    expect(canEnquire(service,0)).toBe(false);
  });
  it('calculates commission only as a proposed contractual amount', () => {
    expect(referralCommissionHalalas(10000,1000)).toBe(1000);
    expect(() => referralCommissionHalalas(10000,-1)).toThrow();
    expect(() => referralCommissionHalalas(-1,1000)).toThrow();
  });
});
