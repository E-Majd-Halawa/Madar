import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStateStorage } from '@/services/storage/persistStorage';
import { userService } from '@/services/userService';
import type { MembersService } from '@/api/contracts/members';
import type { PendingInvite, WorkspaceMemberItem, WorkspaceRole } from '@/types';

interface MemberState extends MembersService {
  members: WorkspaceMemberItem[];
  pendingInvites: PendingInvite[];
  isInviteModalOpen: boolean;
  loading: boolean;

  setIsInviteModalOpen: (open: boolean) => void;
}

const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Operations',
  'Engineering',
  'Design',
  'Operations',
  'Design',
  'Product',
  'Engineering',
  'Marketing',
  'Engineering',
  'Product',
];

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: [],
      pendingInvites: [
        {
          id: 'inv-001',
          email: 'sarah.connor@example.com',
          role: 'member',
          department: 'Engineering',
          invitedBy: 'u-002',
          invitedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        },
        {
          id: 'inv-002',
          email: 'alex.rivera@designstudio.io',
          role: 'guest',
          department: 'Design',
          invitedBy: 'u-001',
          invitedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        },
      ],
      isInviteModalOpen: false,
      loading: false,

      load: async (_workspaceId: string) => {
        if (get().members.length > 0) return;
        set({ loading: true });
        try {
          const { items } = await userService.list({ pageSize: 30 });
          // Map users to workspace members
          const mapped: WorkspaceMemberItem[] = items.slice(0, 14).map((u, index) => {
            const role: WorkspaceRole =
              index === 0 ? 'owner' : index === 1 || index === 2 ? 'admin' : index > 11 ? 'guest' : 'member';
            const department = DEPARTMENTS[index % DEPARTMENTS.length];

            return {
              id: u.id,
              fullName: u.fullName,
              username: u.username,
              email: u.email,
              role,
              department,
              avatarUrl: u.avatarUrl,
              joinedAt: u.createdAt,
              lastActiveAt: u.lastActiveAt,
              status: u.status,
            };
          });

          set({ members: mapped, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      inviteMember: async (email, role, department) => {
        const newInvite: PendingInvite = {
          id: `inv-${Date.now()}`,
          email,
          role,
          department,
          invitedBy: 'u-001',
          invitedAt: new Date().toISOString(),
        };
        set({ pendingInvites: [newInvite, ...get().pendingInvites] });
      },

      updateRole: async (userId, newRole) => {
        set({
          members: get().members.map((m) => (m.id === userId ? { ...m, role: newRole } : m)),
        });
      },

      removeMember: async (userId) => {
        set({
          members: get().members.filter((m) => m.id !== userId),
        });
      },

      cancelInvite: (inviteId) => {
        set({
          pendingInvites: get().pendingInvites.filter((inv) => inv.id !== inviteId),
        });
      },

      resendInvite: (_inviteId) => {
        // Updated timestamp
        set({
          pendingInvites: get().pendingInvites.map((inv) =>
            inv.id === _inviteId ? { ...inv, invitedAt: new Date().toISOString() } : inv,
          ),
        });
      },

      setIsInviteModalOpen: (isInviteModalOpen) => set({ isInviteModalOpen }),
    }),
    {
      name: 'tf3d.members',
      version: 1,
      storage: createJSONStorage(() => safeStateStorage),
      partialize: (state) => ({ members: state.members, pendingInvites: state.pendingInvites }),
    },
  ),
);
