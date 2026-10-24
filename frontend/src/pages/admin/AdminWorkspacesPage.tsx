import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Shield, Archive } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { auditService } from '@/services/auditService';
import type { AdminWorkspace } from '@/api/contracts/admin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { LtrBdi } from './adminFormat';

export default function AdminWorkspacesPage() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getWorkspaces();
      setWorkspaces(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (wsId: string, currentStatus: string, wsName: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminService.updateWorkspaceStatus(wsId, nextStatus);
      await auditService.logEvent({
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'Admin',
        actionKey: nextStatus === 'suspended' ? 'admin.audit.actions.workspaceSuspended' : 'admin.audit.actions.workspaceCreated',
        targetKey: 'admin.audit.targets.workspaceName',
        targetParams: { name: wsName },
        ipAddress: '127.0.0.1',
        device: 'Admin Console',
        status: nextStatus === 'suspended' ? 'warning' : 'success',
      });
      toast.success(t('admin.workspaces.statusChanged', { name: wsName, status: t(`admin.status.${nextStatus}`) }));
      load();
    } catch {
      toast.error(t('admin.workspaces.statusError', 'Failed to update workspace status.'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.workspaces.title', 'Workspace Management')}</h1>
        <p className="text-sm text-text-muted">{t('admin.workspaces.subtitle', 'Monitor tenant workspaces, status, owners, and activity metrics.')}</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-muted">
                <th className="p-4 text-start font-medium">{t('admin.workspaces.table.workspace', 'Workspace')}</th>
                <th className="p-4 text-start font-medium">{t('admin.workspaces.table.owner', 'Owner')}</th>
                <th className="p-4 text-start font-medium">{t('admin.workspaces.table.status', 'Status')}</th>
                <th className="p-4 text-start font-medium">{t('admin.workspaces.table.membersProjects', 'Members / Projects')}</th>
                <th className="p-4 text-end font-medium">{t('admin.workspaces.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {workspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-surface-2/40 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg grid place-items-center text-black font-bold" style={{ background: ws.color }}>
                        {ws.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-fg">{ws.name}</p>
                        <p className="text-[11px] text-muted capitalize">{t(`admin.workspaces.types.${ws.type}`, ws.type)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-fg">{ws.ownerName}</td>
                  <td className="p-4">
                    <Badge tone={ws.status === 'active' ? 'accent' : ws.status === 'suspended' ? 'danger' : 'neutral'}>
                      {t(`admin.status.${ws.status}`, ws.status)}
                    </Badge>
                  </td>
                  <td className="p-4 font-mono text-muted">
                    <LtrBdi>
                      {t('admin.workspaces.table.membersProjects', {
                        members: ws.memberCount,
                        projects: ws.projectCount
                      })}
                    </LtrBdi>
                  </td>
                  <td className="p-4 text-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange(ws.id, ws.status, ws.name)}
                      className="h-7 text-xs"
                    >
                      {ws.status === 'active' ? t('admin.workspaces.suspend', 'Suspend') : t('admin.workspaces.activate', 'Activate')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
