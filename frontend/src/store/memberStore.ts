import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStateStorage } from '@/services/storage/persistStorage';
import { userService } from '@/services/userService';
import { workspaceService } from '@/services/workspaceService';
import { useMocks } from '@/services/serviceMode';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { MembersService } from '@/api/contracts/members';
import type { WorkspaceMemberItem, WorkspaceRole } from '@/types';

interface MemberState extends MembersService {
  members: WorkspaceMemberItem[];
  isAddMemberModalOpen: boolean;
  loading: boolean;

  setAddMemberModalOpen: (open: boolean) => void;
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

/** Prevents a slower response for a previous workspace from overwriting the current one. */
let loadSequence = 0;

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: [],
      isAddMemberModalOpen: false,
      loading: false,

      load: async (workspaceId: string) => {
        const sequence = ++loadSequence;
        set({ loading: true });
        try {
          if (useMocks()) {
            const workspace = useWorkspaceStore.getState().workspaces.find((w) => w.id === workspaceId);
            const { items } = await userService.list({ pageSize: 100 });
            const scoped = workspace?.memberIds.length
              ? items.filter((u) => workspace.memberIds.includes(u.id))
              : items;
            const mapped: WorkspaceMemberItem[] = scoped.map((u, index) => {
              const role: WorkspaceRole =
                u.id === workspace?.ownerId
                  ? 'owner'
                  : index === 1 || index === 2
                    ? 'admin'
                    : index > 11
                      ? 'guest'
                      : 'member';
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
            if (sequence !== loadSequence) return;
            set({ members: mapped, loading: false });
          } else {
            const members = await workspaceService.listMembers(workspaceId);
            if (sequence !== loadSequence) return;
            set({ members, loading: false });
          }
        } catch {
          if (sequence === loadSequence) set({ loading: false });
        }
      },

      addMember: async (username, role, department) => {
        const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
        if (!workspaceId) throw new Error('No active workspace');

        const member = await workspaceService.addMember(workspaceId, {
          username,
          role: role as 'admin' | 'member' | 'guest',
          department,
        });

        if (useMocks()) {
          set({ members: [...get().members.filter((m) => m.id !== member.id), member] });
          // Keep the mock workspace in sync so a later load() still includes the member.
          useWorkspaceStore.setState((state) => ({
            workspaces: state.workspaces.map((w) =>
              w.id === workspaceId && !w.memberIds.includes(member.id)
                ? { ...w, memberIds: [...w.memberIds, member.id] }
                : w,
            ),
          }));
        } else {
          // Re-read from the server so the list reflects what was actually stored.
          await get().load(workspaceId);
        }
      },

      updateRole: async (userId, newRole) => {
        if (useMocks()) {
          set({
            members: get().members.map((m) => (m.id === userId ? { ...m, role: newRole } : m)),
          });
          return;
        }
        const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
        if (!workspaceId) throw new Error('No active workspace');
        const updated = await workspaceService.updateMember(workspaceId, userId, { role: newRole as 'admin' | 'member' | 'guest' });
        set({
          members: get().members.map((m) => (m.id === userId ? updated : m)),
        });
      },

      removeMember: async (userId) => {
        if (useMocks()) {
          set({
            members: get().members.filter((m) => m.id !== userId),
          });
          return;
        }
        const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
        if (!workspaceId) throw new Error('No active workspace');
        await workspaceService.removeMember(workspaceId, userId);
        set({
          members: get().members.filter((m) => m.id !== userId),
        });
      },

      setAddMemberModalOpen: (isAddMemberModalOpen) => set({ isAddMemberModalOpen }),
    }),
    {
      name: 'tf3d.members',
      version: 1,
      storage: createJSONStorage(() => safeStateStorage),
      partialize: (state) => ({ members: state.members }),
    },
  ),
);
