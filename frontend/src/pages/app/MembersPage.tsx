import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  FolderKanban,
  LayoutGrid,
  List as ListIcon,
  Mail,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { inputClass } from '@/components/ui/Field';
import { InviteMemberModal } from '@/features/members/InviteMemberModal';
import { useAuthStore, selectUser } from '@/store/authStore';
import { useMemberStore } from '@/store/memberStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';
import type { WorkspaceMemberItem, WorkspaceRole } from '@/types';
import { cn } from '@/utils/cn';

type ViewMode = 'grid' | 'table';

export default function MembersPage() {
  const { t } = useTranslation();
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const currentUser = useAuthStore(selectUser);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);

  const {
    members,
    pendingInvites,
    isInviteModalOpen,
    load,
    updateRole,
    removeMember,
    cancelInvite,
    resendInvite,
    setIsInviteModalOpen,
  } = useMemberStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<WorkspaceRole | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    if (activeWorkspace) {
      void load(activeWorkspace.id);
    }
  }, [activeWorkspace, load]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = members.length;
    const admins = members.filter((m) => m.role === 'admin' || m.role === 'owner').length;
    const active = members.filter((m) => m.status === 'active').length;
    const pending = pendingInvites.length;
    return { total, admins, active, pending };
  }, [members, pendingInvites]);

  // Department list
  const departments = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.department && set.add(m.department));
    return Array.from(set);
  }, [members]);

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (deptFilter !== 'all' && m.department !== deptFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = m.fullName.toLowerCase().includes(q);
        const matchesEmail = m.email.toLowerCase().includes(q);
        const matchesUsername = m.username.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesUsername) return false;
      }
      return true;
    });
  }, [members, roleFilter, deptFilter, search]);

  const handleRoleChange = async (member: WorkspaceMemberItem, newRole: WorkspaceRole) => {
    if (member.role === 'owner') {
      toast.error(t('members.cannotChangeOwner', 'The workspace owner role cannot be transferred here.'));
      return;
    }
    await updateRole(member.id, newRole);
    toast.success(t('members.roleUpdated', 'Role for {{name}} changed to {{role}}', { name: member.fullName, role: newRole }));
  };

  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberItem | null>(null);

  const handleRemove = (member: WorkspaceMemberItem) => {
    if (member.role === 'owner') {
      toast.error(t('members.cannotRemoveOwner', 'Cannot remove the workspace owner.'));
      return;
    }
    if (member.id === currentUser?.id) {
      toast.error(t('members.cannotRemoveSelf', 'You cannot remove yourself from the workspace.'));
      return;
    }
    setMemberToRemove(member);
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;
    await removeMember(memberToRemove.id);
    toast.success(t('members.memberRemoved', 'Member removed from workspace'));
    setMemberToRemove(null);
  };

  const getRoleBadgeTone = (role: WorkspaceRole): 'accent' | 'neutral' | 'warning' => {
    switch (role) {
      case 'owner':
        return 'accent';
      case 'admin':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('nav.members', 'Workspace Members')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t('members.subtitle', 'Manage your team members, permissions, departments, and active invitations.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsInviteModalOpen(true)}
            className="gap-2"
          >
            <UserPlus className="size-4" />
            {t('members.invite', 'Invite Member')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="glass rounded-2xl p-4 border shadow-sm">
          <span className="block text-xs font-medium text-muted">{t('members.totalMembers', 'Total Members')}</span>
          <span className="mt-1 block text-2xl font-bold text-fg">{stats.total}</span>
        </div>
        <div className="glass rounded-2xl p-4 border shadow-sm">
          <span className="block text-xs font-medium text-muted">{t('members.activeNow', 'Active Members')}</span>
          <span className="mt-1 block text-2xl font-bold text-emerald-400">{stats.active}</span>
        </div>
        <div className="glass rounded-2xl p-4 border shadow-sm">
          <span className="block text-xs font-medium text-muted">{t('members.adminCount', 'Admins & Leads')}</span>
          <span className="mt-1 block text-2xl font-bold text-accent">{stats.admins}</span>
        </div>
        <div className="glass rounded-2xl p-4 border shadow-sm">
          <span className="block text-xs font-medium text-muted">{t('members.pendingInvites', 'Pending Invites')}</span>
          <span className="mt-1 block text-2xl font-bold text-purple-400">{stats.pending}</span>
        </div>
      </div>

      {/* Filter and View Bar */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 border shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('members.searchPlaceholder', 'Search members by name, email, or username…')}
            className={cn(inputClass, 'ps-9 py-1.5 text-sm')}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role selector */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as WorkspaceRole | 'all')}
            className={cn(inputClass, 'py-1.5 text-xs w-32')}
          >
            <option value="all">{t('members.allRoles', 'All Roles')}</option>
            <option value="owner">{t('members.roleOwner', 'Owner')}</option>
            <option value="admin">{t('members.roleAdmin', 'Admin')}</option>
            <option value="member">{t('members.roleMember', 'Member')}</option>
            <option value="guest">{t('members.roleGuest', 'Guest')}</option>
          </select>

          {/* Department selector */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className={cn(inputClass, 'py-1.5 text-xs w-36')}
          >
            <option value="all">{t('members.allDepartments', 'All Departments')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* View switcher */}
          <div className="flex items-center rounded-xl border bg-surface-2/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'grid size-8 place-items-center rounded-lg text-muted transition',
                viewMode === 'grid' && 'bg-surface text-accent shadow-sm',
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'grid size-8 place-items-center rounded-lg text-muted transition',
                viewMode === 'table' && 'bg-surface text-accent shadow-sm',
              )}
              aria-label="Table view"
            >
              <ListIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Members Grid / Table Container */}
      {filteredMembers.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border">
          <EmptyState
            icon={Users}
            title={t('members.noMembersFound', 'No team members match')}
            description={t('members.noMembersDesc', 'Try broadening your search or department filter.')}
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => {
            const memberTasks = tasks.filter((t) => t.assigneeId === member.id && t.status !== 'archived');
            const memberProjects = projects.filter((p) => p.memberIds.includes(member.id));

            return (
              <motion.div
                key={member.id}
                layout
                className="glass group relative flex flex-col justify-between rounded-2xl border p-5 transition hover:border-accent/40 hover:shadow-depth"
              >
                <div>
                  {/* Top: Avatar & Role */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                      <Avatar name={member.fullName} src={member.avatarUrl} size="lg" />
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-surface',
                          member.status === 'active' ? 'bg-emerald-400' : 'bg-muted',
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge tone={getRoleBadgeTone(member.role)} className="capitalize text-[10px]">
                        {member.role}
                      </Badge>
                    </div>
                  </div>

                  {/* Name, Username & Email */}
                  <div className="mt-3.5">
                    <p className="font-semibold text-fg text-base line-clamp-1">{member.fullName}</p>
                    <p className="text-xs text-muted font-mono">@{member.username}</p>
                    <p className="mt-1 text-xs text-muted/80 truncate">{member.email}</p>
                  </div>

                  {/* Department pill */}
                  <div className="mt-3">
                    <span className="inline-block rounded-md border border-border/10 bg-surface-2/60 px-2 py-0.5 text-[11px] font-medium text-muted">
                      {member.department}
                    </span>
                  </div>

                  {/* Workload badges */}
                  <div className="mt-4 flex items-center gap-3 border-t border-border/10 pt-3 text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-accent" />
                      <span>{memberTasks.length} {t('nav.tasks', 'tasks')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FolderKanban className="size-3.5 text-accent-2" />
                      <span>{memberProjects.length} {t('nav.projects', 'projects')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-border/10 pt-3 text-xs">
                  {/* Role Selector dropdown */}
                  {member.role !== 'owner' ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value as WorkspaceRole)}
                      className="rounded-lg border bg-surface-2/60 px-2 py-1 text-xs font-medium text-fg focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="admin">{t('members.roleAdmin', 'Admin')}</option>
                      <option value="member">{t('members.roleMember', 'Member')}</option>
                      <option value="guest">{t('members.roleGuest', 'Guest')}</option>
                    </select>
                  ) : (
                    <span className="text-xs text-muted italic">{t('members.workspaceOwner', 'Owner')}</span>
                  )}

                  {member.role !== 'owner' && member.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member)}
                      title={t('common.delete', 'Remove member')}
                      className="grid size-7 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-400 transition"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="border-b bg-surface-2/40 text-xs text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('members.member', 'Member')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('members.role', 'Role')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('members.department', 'Department')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('members.assignedTasks', 'Tasks & Projects')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('members.joined', 'Joined')}</th>
                  <th className="px-4 py-3 text-end font-medium">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredMembers.map((member) => {
                  const memberTasks = tasks.filter((t) => t.assigneeId === member.id && t.status !== 'archived');
                  const memberProjects = projects.filter((p) => p.memberIds.includes(member.id));

                  return (
                    <tr key={member.id} className="hover:bg-surface-2/40 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.fullName} src={member.avatarUrl} size="md" />
                          <div>
                            <p className="font-semibold text-fg">{member.fullName}</p>
                            <p className="text-xs text-muted">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge tone={getRoleBadgeTone(member.role)} className="capitalize text-[11px]">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                        {member.department}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                        {memberTasks.length} tasks · {memberProjects.length} projects
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                        {format(parseISO(member.joinedAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {member.role !== 'owner' ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member, e.target.value as WorkspaceRole)}
                              className="rounded-lg border bg-surface-2/60 px-2 py-1 text-xs text-fg"
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="guest">Guest</option>
                            </select>
                          ) : (
                            <span className="text-xs text-muted italic">Owner</span>
                          )}

                          {member.role !== 'owner' && member.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => handleRemove(member)}
                              className="grid size-7 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-400"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Invitations Section */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              {t('members.pendingInvitesHeading', 'Pending Invitations')} ({pendingInvites.length})
            </span>
          </div>

          <div className="glass overflow-hidden rounded-2xl border divide-y divide-border/10">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between text-sm hover:bg-surface-2/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl border bg-surface-2/60 text-muted">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-fg">{invite.email}</p>
                    <p className="text-xs text-muted">
                      {invite.department} · {t('members.invited', 'Invited')} {format(parseISO(invite.invitedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Badge tone="neutral" className="capitalize text-[11px]">
                    {invite.role}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      resendInvite(invite.id);
                      toast.success(t('members.inviteResent', 'Invitation resent to {{email}}', { email: invite.email }));
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <RefreshCw className="size-3" />
                    {t('members.resend', 'Resend')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      cancelInvite(invite.id);
                      toast.info(t('members.inviteCancelled', 'Invitation cancelled'));
                    }}
                    className="gap-1.5 text-xs text-rose-400 hover:text-rose-300"
                  >
                    <X className="size-3" />
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <ConfirmDialog
        open={!!memberToRemove}
        title={t('members.removeConfirmTitle', 'Remove Member')}
        message={t('members.removeConfirm', 'Remove {{name}} from this workspace?', { name: memberToRemove?.fullName })}
        onConfirm={confirmRemove}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
}
