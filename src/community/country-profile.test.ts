import { describe, expect, it } from 'vitest';
import { countryFlag, publicCountry } from './country-profile';
describe('opt-in country profile flag', () => {
  it('renders a selected country', () => expect(countryFlag('my')).toBe('🇲🇾'));
  it('never exposes a hidden country', () => expect(countryFlag('SA',false)).toBeNull());
  it('rejects malformed country codes', () => {
    expect(countryFlag('Malaysia')).toBeNull();
    expect(countryFlag('ZZ')).toBeNull();
    expect(countryFlag(null)).toBeNull();
  });
  it('omits hidden country from public profile', () => {
    expect(publicCountry({displayName:'Pilgrim',countryCode:'MY',showCountry:false,languages:['ms']})).toBeNull();
  });
});
