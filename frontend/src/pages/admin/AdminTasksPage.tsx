import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Trash2, Search } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { auditService } from '@/services/auditService';
import type { Task } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { formatAdminShortDate, LtrBdi } from './adminFormat';

export default function AdminTasksPage() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (taskId: string, title: string) => {
    try {
      await adminService.deleteTask(taskId);
      await auditService.logEvent({
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'Admin',
        actionKey: 'admin.audit.actions.taskDeleted',
        targetKey: 'admin.audit.targets.taskId',
        targetParams: { id: taskId },
        ipAddress: '127.0.0.1',
        device: 'Admin Console',
        status: 'warning',
      });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success(t('admin.tasks.deleted', { title }));
    } catch {
      toast.error(t('admin.tasks.deleteError', 'Failed to delete task.'));
    }
  };

  const filtered = tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.tasks.title', 'Task Governance')}</h1>
        <p className="text-sm text-text-muted">{t('admin.tasks.subtitle', 'Global oversight and moderation of workspace tasks.')}</p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder={t('admin.search.tasks', 'Search tasks...')}
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
                <th className="p-4 text-start font-medium">{t('admin.tasks.table.title', 'Title')}</th>
                <th className="p-4 text-start font-medium">{t('admin.tasks.table.status', 'Status')}</th>
                <th className="p-4 text-start font-medium">{t('admin.tasks.table.priority', 'Priority')}</th>
                <th className="p-4 text-start font-medium">{t('admin.tasks.table.dueDate', 'Due Date')}</th>
                <th className="p-4 text-end font-medium">{t('admin.tasks.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((task) => (
                <tr key={task.id} className="hover:bg-surface-2/40 transition">
                  <td className="p-4 font-medium text-fg">{task.title}</td>
                  <td className="p-4">
                    <Badge tone={task.status === 'completed' ? 'accent' : 'neutral'}>
                      {t(`admin.tasks.status.${task.status}`, task.status)}
                    </Badge>
                  </td>
                  <td className="p-4 capitalize">{t(`admin.tasks.priority.${task.priority}`, task.priority)}</td>
                  <td className="p-4 font-mono text-muted">
                    <LtrBdi>
                      {task.dueDate ? formatAdminShortDate(task.dueDate, i18n.language) : t('admin.tasks.noDueDate', 'No due date')}
                    </LtrBdi>
                  </td>
                  <td className="p-4 text-end">
                    <Button variant="secondary" size="sm" onClick={() => handleDelete(task.id, task.title)} className="h-7 text-xs text-red-500 hover:bg-red-500/10">
                      {t('admin.tasks.delete', 'Delete')}
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
