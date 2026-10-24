import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Search, Download } from 'lucide-react';
import { auditService } from '@/services/auditService';
import type { AuditEvent } from '@/api/contracts/admin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import { formatAdminDate, LtrBdi } from './adminFormat';

export default function AdminLogsPage() {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await auditService.getEvents();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleExportCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      ['ID,Actor,Action,Target,Status,Date', ...events.map(e => `${e.id},"${e.actorName}","${e.actionKey || e.action}","${e.targetKey || e.target}",${e.status},${e.createdAt}`)].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(t('admin.logs.exportSuccess', 'Audit logs CSV exported successfully.'));
  };

  const filtered = events.filter((ev) => {
    const actionText = String(ev.actionKey ? t(ev.actionKey, ev.actionParams || {}) : (ev.action || ''));
    const targetText = String(ev.targetKey ? t(ev.targetKey, ev.targetParams || {}) : (ev.target || ''));
    const matchSearch = actionText.toLowerCase().includes(search.toLowerCase()) || ev.actorName.toLowerCase().includes(search.toLowerCase()) || targetText.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || ev.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.logs.title', 'Audit Logs')}</h1>
          <p className="text-sm text-text-muted">{t('admin.logs.subtitle', 'Immutable system audit trail of administrative and security events.')}</p>
        </div>
        <Button variant="secondary" onClick={handleExportCsv} className="flex items-center gap-2">
          <Download className="size-4" /> {t('admin.logs.exportCsv', 'Export CSV')}
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            placeholder={t('admin.search.logs', 'Search audit logs...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl ps-9 pe-4 py-2 text-xs text-fg focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-fg focus:outline-none"
        >
          <option value="all">{t('admin.logs.allStatuses', 'All Statuses')}</option>
          <option value="success">{t('admin.audit.status.success', 'Success')}</option>
          <option value="warning">{t('admin.audit.status.warning', 'Warning')}</option>
          <option value="error">{t('admin.audit.status.error', 'Error')}</option>
        </select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-muted">
                <th className="p-4 text-start font-medium">{t('admin.logs.table.actor', 'Actor')}</th>
                <th className="p-4 text-start font-medium">{t('admin.logs.table.action', 'Action')}</th>
                <th className="p-4 text-start font-medium">{t('admin.logs.table.target', 'Target')}</th>
                <th className="p-4 text-start font-medium">{t('admin.logs.table.ipDevice', 'IP / Device')}</th>
                <th className="p-4 text-start font-medium">{t('admin.logs.table.status', 'Status')}</th>
                <th className="p-4 text-start font-medium">{t('admin.logs.table.timestamp', 'Timestamp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((ev) => (
                <tr key={ev.id} className="hover:bg-surface-2/40 transition">
                  <td className="p-4 font-medium text-fg">{ev.actorName}</td>
                  <td className="p-4 text-text">
                    {String(ev.actionKey ? t(ev.actionKey, ev.actionParams || {}) : ev.action)}
                  </td>
                  <td className="p-4 text-muted max-w-xs truncate">
                    {String(ev.targetKey ? t(ev.targetKey, ev.targetParams || {}) : ev.target)}
                  </td>
                  <td className="p-4 font-mono text-[11px] text-muted">
                    <LtrBdi>{ev.ipAddress} ({ev.device})</LtrBdi>
                  </td>
                  <td className="p-4">
                    <Badge tone={ev.status === 'success' ? 'accent' : ev.status === 'warning' ? 'warning' : 'danger'}>
                      {t(`admin.audit.status.${ev.status}`, ev.status)}
                    </Badge>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-muted">
                    <LtrBdi>{formatAdminDate(ev.createdAt, i18n.language)}</LtrBdi>
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
