/** Public profile country is user-selected, not verified nationality or live location. */
export type PublicCommunityProfile = {
  displayName: string;
  countryCode: string | null;
  showCountry: boolean;
  languages: readonly string[];
};
export function countryFlag(code: string | null, showCountry = true): string | null {
  if (!showCountry || !code || !/^[A-Za-z]{2}$/.test(code)) return null;
  const upper = code.toUpperCase();
  // ISO 3166-1 alpha-2 region codes; reject special/private-use pseudo regions.
  if (['AA','ZZ','XX','EU','UN'].includes(upper)) return null;
  return [...upper].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
}
export function publicCountry(profile: PublicCommunityProfile): { code: string; flag: string } | null {
  const flag = countryFlag(profile.countryCode, profile.showCountry);
  return flag && profile.countryCode ? { code: profile.countryCode.toUpperCase(), flag } : null;
}
