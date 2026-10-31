import type {
  UserStatus,
  WorkspaceMemberItem,
  WorkspaceRole,
} from '../contracts/api.contracts.js';

export interface MemberRecord {
  userId: string;
  role: string;
  department: string | null;
  status: string;
  joinedAt: Date;
  lastActiveAt: Date | null;
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    status: string;
    lastActiveAt: Date;
  };
}

/** Explicit mapper to frontend/src/types/members.ts:3-14. */
export function toWorkspaceMemberDto(
  member: MemberRecord,
): WorkspaceMemberItem {
  // The frontend mock lists users and uses the user status (suspended users
  // still appear). A non-active membership status wins when present.
  const status =
    member.status === 'active' ? member.user.status : member.status;

  return {
    id: member.userId,
    fullName: member.user.fullName,
    username: member.user.username,
    email: member.user.email,
    role: member.role as WorkspaceRole,
    department: member.department ?? '',
    ...(member.user.avatarUrl ? { avatarUrl: member.user.avatarUrl } : {}),
    joinedAt: member.joinedAt.toISOString(),
    lastActiveAt: (
      member.lastActiveAt ?? member.user.lastActiveAt
    ).toISOString(),
    status: status as UserStatus,
  };
}
