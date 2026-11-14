/**
 * TEMAN community visibility policy — pure client-side reference model.
 * Not an authorisation boundary: enforce equivalent rules with database RLS
 * and server-side checks before exposing any real community data.
 */
export type Audience = 'only_me' | 'connections' | 'jamaah' | 'public';
export type CommunityMember = {
  id: string;
  isActive: boolean;
  isMinor: boolean;
  approvedConnectionIds: readonly string[];
  blockedUserIds: readonly string[];
  approvedJamaahIds: readonly string[];
};
export type CommunityPost = {
  authorId: string;
  audience: Audience;
  jamaahId?: string;
  approved: boolean;
  containsSensitiveLocation: boolean;
};
export function canViewPost(
  viewer: CommunityMember | null,
  author: CommunityMember,
  post: CommunityPost,
): boolean {
  if (post.authorId !== author.id || !author.isActive || !post.approved) return false;
  if (viewer && (!viewer.isActive ||
    viewer.blockedUserIds.includes(author.id) ||
    author.blockedUserIds.includes(viewer.id))) return false;
  if (viewer?.id === author.id) return true;
  // Sensitive itinerary/location data must never become discoverable.
  if (post.containsSensitiveLocation) return false;
  if (author.isMinor || viewer?.isMinor) return false;
  if (post.audience === 'public') return true;
  if (!viewer) return false;
  if (post.audience === 'only_me') return false;
  if (post.audience === 'connections') {
    return author.approvedConnectionIds.includes(viewer.id) &&
      viewer.approvedConnectionIds.includes(author.id);
  }
  return post.audience === 'jamaah' &&
    Boolean(post.jamaahId) &&
    author.approvedJamaahIds.includes(post.jamaahId!) &&
    viewer.approvedJamaahIds.includes(post.jamaahId!);
}
