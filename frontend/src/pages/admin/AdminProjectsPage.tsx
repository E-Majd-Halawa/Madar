import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderKanban, Search } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { auditService } from '@/services/auditService';
import type { Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { formatAdminShortDate, LtrBdi } from './adminFormat';

export default function AdminProjectsPage() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (projectId: string, name: string) => {
    try {
      await adminService.deleteProject(projectId);
      await auditService.logEvent({
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'Admin',
        actionKey: 'admin.audit.actions.projectArchived',
        targetKey: 'admin.audit.targets.projectId',
        targetParams: { id: projectId },
        ipAddress: '127.0.0.1',
        device: 'Admin Console',
        status: 'warning',
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success(t('admin.projects.deleted', { name }));
    } catch {
      toast.error(t('admin.projects.deleteError', 'Failed to delete project.'));
    }
  };

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.projects.title', 'Project Oversight')}</h1>
        <p className="text-sm text-text-muted">{t('admin.projects.subtitle', 'Oversee workspace projects and milestones.')}</p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder={t('admin.search.projects', 'Search projects...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl ps-9 pe-4 py-2 text-xs text-fg focus:outline-none"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-muted">
                <th className="p-4 text-start font-medium">{t('admin.projects.table.projectName', 'Project Name')}</th>
                <th className="p-4 text-start font-medium">{t('admin.projects.table.status', 'Status')}</th>
                <th className="p-4 text-start font-medium">{t('admin.projects.table.startDate', 'Start Date')}</th>
                <th className="p-4 text-end font-medium">{t('admin.projects.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((proj) => (
                <tr key={proj.id} className="hover:bg-surface-2/40 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full" style={{ background: proj.color }} />
                      <span className="font-medium text-fg">{proj.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge tone={proj.status === 'active' ? 'accent' : 'neutral'}>
                      {t(`admin.projects.status.${proj.status}`, proj.status)}
                    </Badge>
                  </td>
                  <td className="p-4 font-mono text-muted">
                    <LtrBdi>{formatAdminShortDate(proj.startDate, i18n.language)}</LtrBdi>
                  </td>
                  <td className="p-4 text-end">
                    <Button variant="secondary" size="sm" onClick={() => handleDelete(proj.id, proj.name)} className="h-7 text-xs text-red-500 hover:bg-red-500/10">
                      {t('admin.projects.delete', 'Delete')}
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
