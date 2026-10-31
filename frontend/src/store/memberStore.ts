import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { httpMemberService } from '@/api/adapters/http/httpMemberService';
import { HttpError } from '@/api/adapters/http/httpClient';
import { safeStateStorage } from '@/services/storage/persistStorage';
import { toast } from '@/store/toastStore';
import i18n from '@/i18n';
import { userService } from '@/services/userService';
import type { MembersService } from '@/api/contracts/members';
import type { PendingInvite, WorkspaceMemberItem, WorkspaceRole } from '@/types';

interface MemberState extends MembersService {
  members: WorkspaceMemberItem[];
  pendingInvites: PendingInvite[];
  currentWorkspaceId: string | null;
  isInviteModalOpen: boolean;
  loading: boolean;

  setIsInviteModalOpen: (open: boolean) => void;
}

const useHttpMembers = Boolean(import.meta.env.VITE_API_URL);

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
      currentWorkspaceId: null,
      isInviteModalOpen: false,
      loading: false,

      load: async (workspaceId: string) => {
        if (get().currentWorkspaceId === workspaceId && get().members.length > 0) {
          return;
        }

        set({
          loading: true,
          currentWorkspaceId: workspaceId,
          members: [],
          ...(useHttpMembers ? { pendingInvites: [] } : {}),
        });

        try {
          if (useHttpMembers) {
            const remote = await httpMemberService.load(workspaceId);
            set({
              members: remote.members,
              pendingInvites: remote.pendingInvites,
              loading: false,
            });
            return;
          }

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
        if (useHttpMembers) {
          const workspaceId = get().currentWorkspaceId;
          if (!workspaceId) throw new Error('No workspace loaded');
          const newInvite = await httpMemberService.inviteMember(
            workspaceId,
            email,
            role,
            department,
          );
          set({ pendingInvites: [newInvite, ...get().pendingInvites] });
          return;
        }

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
        if (useHttpMembers) {
          const workspaceId = get().currentWorkspaceId;
          if (!workspaceId) throw new Error('No workspace loaded');
          const updated = await httpMemberService.updateRole(
            workspaceId,
            userId,
            newRole,
          );
          set({
            members: get().members.map((m) => (m.id === userId ? updated : m)),
          });
          return;
        }

        set({
          members: get().members.map((m) => (m.id === userId ? { ...m, role: newRole } : m)),
        });
      },

      removeMember: async (userId) => {
        if (useHttpMembers) {
          const workspaceId = get().currentWorkspaceId;
          if (!workspaceId) throw new Error('No workspace loaded');
          await httpMemberService.removeMember(workspaceId, userId);
        }

        set({
          members: get().members.filter((m) => m.id !== userId),
        });
      },

      cancelInvite: (inviteId) => {
        if (!useHttpMembers) {
          set({
            pendingInvites: get().pendingInvites.filter((inv) => inv.id !== inviteId),
          });
          return;
        }

        const workspaceId = get().currentWorkspaceId;
        if (!workspaceId) return;
        void httpMemberService
          .cancelInvite(workspaceId, inviteId)
          .then(() => {
            set({
              pendingInvites: get().pendingInvites.filter((inv) => inv.id !== inviteId),
            });
          })
          .catch((err) => {
            const message =
              err instanceof HttpError && err.message
                ? err.message
                : i18n.t('errors.unknown', { defaultValue: 'Something went wrong' });
            toast.error(message);
          });
      },

      resendInvite: (inviteId) => {
        if (!useHttpMembers) {
          // Updated timestamp
          set({
            pendingInvites: get().pendingInvites.map((inv) =>
              inv.id === inviteId ? { ...inv, invitedAt: new Date().toISOString() } : inv,
            ),
          });
          return;
        }

        const workspaceId = get().currentWorkspaceId;
        if (!workspaceId) return;
        void httpMemberService
          .resendInvite(workspaceId, inviteId)
          .then(() => {
            set({
              pendingInvites: get().pendingInvites.map((inv) =>
                inv.id === inviteId ? { ...inv, invitedAt: new Date().toISOString() } : inv,
              ),
            });
          })
          .catch((err) => {
            const message =
              err instanceof HttpError && err.message
                ? err.message
                : i18n.t('errors.unknown', { defaultValue: 'Something went wrong' });
            toast.error(message);
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
