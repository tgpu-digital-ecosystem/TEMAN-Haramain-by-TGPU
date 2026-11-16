import { describe, expect, it } from 'vitest';
import { canViewPost, type CommunityMember, type CommunityPost } from './privacy';
const member = (id: string, extra: Partial<CommunityMember> = {}): CommunityMember => ({
  id, isActive: true, isMinor: false, approvedConnectionIds: [],
  blockedUserIds: [], approvedJamaahIds: [], ...extra,
});
const post = (extra: Partial<CommunityPost> = {}): CommunityPost => ({
  authorId: 'pilgrim', audience: 'only_me', approved: true,
  containsSensitiveLocation: false, ...extra,
});
describe('TEMAN community privacy policy', () => {
  const author = member('pilgrim', { approvedConnectionIds: ['family'], approvedJamaahIds: ['bus1'] });
  it('keeps private posts private', () => {
    expect(canViewPost(member('stranger'), author, post())).toBe(false);
    expect(canViewPost(author, author, post())).toBe(true);
  });
  it('requires mutual connections for family-circle posts', () => {
    const p = post({ audience: 'connections' });
    expect(canViewPost(member('family'), author, p)).toBe(false);
    expect(canViewPost(member('family', { approvedConnectionIds: ['pilgrim'] }), author, p)).toBe(true);
  });
  it('requires approved group membership on both sides', () => {
    const p = post({ audience: 'jamaah', jamaahId: 'bus1' });
    expect(canViewPost(member('outsider'), author, p)).toBe(false);
    expect(canViewPost(member('fellow', { approvedJamaahIds: ['bus1'] }), author, p)).toBe(true);
  });
  it('never exposes sensitive locations to other accounts', () => {
    expect(canViewPost(member('fellow', { approvedJamaahIds: ['bus1'] }), author,
      post({ audience: 'jamaah', jamaahId: 'bus1', containsSensitiveLocation: true }))).toBe(false);
  });
  it('respects blocks, moderation, inactive users and minor safety', () => {
    expect(canViewPost(member('blocked'), member('pilgrim', { blockedUserIds: ['blocked'] }),
      post({ audience: 'public' }))).toBe(false);
    expect(canViewPost(null, author, post({ audience: 'public', approved: false }))).toBe(false);
    expect(canViewPost(null, member('pilgrim', { isMinor: true }), post({ audience: 'public' }))).toBe(false);
    expect(canViewPost(member('guest', { isActive: false }), author, post({ audience: 'public' }))).toBe(false);
  });
  it('rejects mismatched post ownership', () => {
    expect(canViewPost(author, author, post({ authorId: 'someone-else' }))).toBe(false);
  });
});
