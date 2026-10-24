import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Search } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { auditService } from '@/services/auditService';
import type { AdminReport } from '@/api/contracts/admin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { formatAdminDate, LtrBdi } from './adminFormat';

export default function AdminReportsPage() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getReports();
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusUpdate = async (reportId: string, status: AdminReport['status']) => {
    try {
      await adminService.updateReport(reportId, status);
      await auditService.logEvent({
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'Admin',
        actionKey: status === 'Resolved' ? 'admin.audit.actions.reportResolved' : 'admin.audit.actions.reportRejected',
        targetKey: 'admin.audit.targets.reportId',
        targetParams: { id: reportId },
        ipAddress: '127.0.0.1',
        device: 'Admin Console',
        status: status === 'Resolved' ? 'success' : 'warning',
      });
      toast.success(t('admin.reports.statusUpdated', { status: t(`admin.reports.reportStatus.${status}`, status) }));
      load();
    } catch {
      toast.error(t('admin.reports.statusError', 'Failed to update report status.'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.reports.title', 'User Reports & Moderation')}</h1>
        <p className="text-sm text-text-muted">{t('admin.reports.subtitle', 'Investigate flagged content, user tickets, and resolve disputes.')}</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-muted">
                <th className="p-4 text-start font-medium">{t('admin.reports.table.typeReason', 'Type / Reason')}</th>
                <th className="p-4 text-start font-medium">{t('admin.reports.table.reporter', 'Reporter')}</th>
                <th className="p-4 text-start font-medium">{t('admin.reports.table.description', 'Description')}</th>
                <th className="p-4 text-start font-medium">{t('admin.reports.table.status', 'Status')}</th>
                <th className="p-4 text-end font-medium">{t('admin.reports.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-surface-2/40 transition">
                  <td className="p-4">
                    <p className="font-medium text-fg uppercase tracking-wider text-[10px]">{t(`admin.reports.types.${rep.type}`, rep.type)}</p>
                    <p className="font-semibold text-text capitalize">{t(`admin.reports.reasons.${rep.reason}`, rep.reason)}</p>
                    <p className="text-[10px] text-muted font-mono"><LtrBdi>{formatAdminDate(rep.createdAt, i18n.language)}</LtrBdi></p>
                  </td>
                  <td className="p-4 text-fg">{rep.reporterName}</td>
                  <td className="p-4 text-muted max-w-xs truncate">{rep.targetDescription}</td>
                  <td className="p-4">
                    <Badge tone={rep.status === 'Resolved' ? 'accent' : rep.status === 'Reviewing' ? 'warning' : rep.status === 'Rejected' ? 'danger' : 'accent'}>
                      {t(`admin.reports.reportStatus.${rep.status}`, rep.status)}
                    </Badge>
                  </td>
                  <td className="p-4 text-end space-x-2 rtl:space-x-reverse">
                    <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(rep.id, 'Reviewing')} className="h-7 text-xs">
                      {t('admin.reports.review', 'Review')}
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleStatusUpdate(rep.id, 'Resolved')} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                      {t('admin.reports.resolve', 'Resolve')}
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
