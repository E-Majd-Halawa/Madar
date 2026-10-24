import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MoreVertical, Shield, UserX, UserCheck, Trash2, Edit } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { auditService } from '@/services/auditService';
import type { AdminUser } from '@/api/contracts/admin';
import type { Role } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; desc: string; onConfirm: () => void }>({
    open: false,
    title: '',
    desc: '',
    onConfirm: () => {},
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role, userName: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      await auditService.logEvent({
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'Admin',
        action: 'User Role Updated',
        target: `User: ${userName} (${newRole})`,
        ipAddress: '127.0.0.1',
        device: 'Admin Console',
        status: 'success',
      });
      toast.success(t('admin.users.roleUpdated', { name: userName, role: t(`roles.${newRole}`) }));
      loadUsers();
    } catch {
      toast.error(t('admin.users.roleError', 'Failed to update user role.'));
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string, userName: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminService.updateUserStatus(userId, nextStatus as 'active' | 'suspended' | 'banned');
      await auditService.logEvent({
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'Admin',
        action: nextStatus === 'suspended' ? 'User Suspended' : 'User Activated',
        target: `User: ${userName}`,
        ipAddress: '127.0.0.1',
        device: 'Admin Console',
        status: nextStatus === 'suspended' ? 'warning' : 'success',
      });
      toast.success(t('admin.users.statusUpdated', { name: userName, status: t(`admin.status.${nextStatus}`) }));
      loadUsers();
    } catch {
      toast.error(t('admin.users.statusError', 'Failed to update status.'));
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmModal({
      open: true,
      title: t('admin.users.deleteTitle', { name: userName }),
      desc: t('admin.users.deleteDesc', 'This action is irreversible and will remove all associated telemetry.'),
      onConfirm: async () => {
        try {
          await adminService.deleteUser(userId);
          await auditService.logEvent({
            actorId: currentUser?.id || 'admin',
            actorName: currentUser?.fullName || 'Admin',
            action: 'User Deleted',
            target: `User: ${userName}`,
            ipAddress: '127.0.0.1',
            device: 'Admin Console',
            status: 'error',
          });
          toast.success(t('admin.users.deleted', { name: userName }));
          loadUsers();
        } catch {
          toast.error(t('admin.users.deleteError', 'Failed to delete user.'));
        }
        setConfirmModal((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('admin.users.title', 'User Administration')}</h1>
        <p className="text-sm text-muted">{t('admin.users.subtitle', 'Manage user roles, account statuses, and permissions across the platform.')}</p>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder={t('admin.search.users', 'Search by name or email...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl ps-9 pe-4 py-2 text-xs text-fg focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-fg focus:outline-none"
          >
            <option value="all">{t('admin.users.allRoles', 'All Roles')}</option>
            <option value="user">{t('roles.user', 'User')}</option>
            <option value="moderator">{t('roles.moderator', 'Moderator')}</option>
            <option value="admin">{t('roles.admin', 'Admin')}</option>
            <option value="super_admin">{t('roles.super_admin', 'Super Admin')}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-fg focus:outline-none"
          >
            <option value="all">{t('admin.users.allStatuses', 'All Statuses')}</option>
            <option value="active">{t('admin.status.active', 'Active')}</option>
            <option value="suspended">{t('admin.status.suspended', 'Suspended')}</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow hover:border-accent/40">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-muted">
                <th className="p-4 text-start font-medium">{t('admin.users.table.user', 'User')}</th>
                <th className="p-4 text-start font-medium">{t('admin.users.table.role', 'Role')}</th>
                <th className="p-4 text-start font-medium">{t('admin.users.table.status', 'Status')}</th>
                <th className="p-4 text-start font-medium">{t('admin.users.table.activity', 'Tasks / Workspaces')}</th>
                <th className="p-4 text-start font-medium">{t('admin.users.table.lastActive', 'Last Active')}</th>
                <th className="p-4 text-end font-medium">{t('admin.users.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const isSuperAdmin = user.role === 'super_admin';
                return (
                  <tr key={user.id} className="hover:bg-surface-2/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.fullName} />
                        <div>
                          <p className="font-medium text-fg">{user.fullName}</p>
                          <p className="text-[11px] text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        disabled={isSelf || (currentUser?.role === 'admin' && isSuperAdmin)}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role, user.fullName)}
                        className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-fg disabled:opacity-50"
                      >
                        <option value="user">{t('roles.user', 'User')}</option>
                        <option value="moderator">{t('roles.moderator', 'Moderator')}</option>
                        <option value="admin">{t('roles.admin', 'Admin')}</option>
                        <option value="super_admin">{t('roles.super_admin', 'Super Admin')}</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <Badge tone={user.status === 'active' ? 'accent' : 'danger'}>
                        {t(`admin.status.${user.status}`, user.status)}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono text-muted">
                      {user.taskCount} {t('admin.users.tasksCount', 'tasks')} / {user.workspaceCount} {t('admin.users.wsCount', 'ws')}
                    </td>
                    <td className="p-4 text-muted">
                      {new Date(user.lastActive).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="p-4 text-end space-x-2 rtl:space-x-reverse">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isSelf || isSuperAdmin}
                        onClick={() => handleStatusToggle(user.id, user.status, user.fullName)}
                        className="h-7 text-xs"
                      >
                        {user.status === 'active' ? t('admin.users.suspend', 'Suspend') : t('admin.users.activate', 'Activate')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isSelf || isSuperAdmin}
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        className="h-7 text-xs text-red-500 hover:bg-red-500/10"
                      >
                        {t('admin.users.delete', 'Delete')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        title={confirmModal.title}
        description={confirmModal.desc}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="primary" onClick={confirmModal.onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            {t('admin.users.confirmDelete', 'Confirm Delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
