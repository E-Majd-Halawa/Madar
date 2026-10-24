import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, ShieldAlert } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { auditService } from '@/services/auditService';
import type { SecurityEvent } from '@/api/contracts/admin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { formatAdminDate, LtrBdi } from './adminFormat';

export default function AdminSecurityPage() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSecurityEvents();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRevoke = async (sessionId: string, desc: string) => {
    try {
      await adminService.revokeSession(sessionId);
      await auditService.logEvent({
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'Admin',
        actionKey: 'admin.audit.actions.sessionRevoked',
        targetKey: 'admin.audit.targets.sessionId',
        targetParams: { id: sessionId },
        ipAddress: '127.0.0.1',
        device: 'Admin Console',
        status: 'warning',
      });
      toast.success(t('admin.security.revokeSuccess', 'Session revoked successfully.'));
      load();
    } catch {
      toast.error(t('admin.security.revokeError', 'Failed to revoke session.'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{t('admin.security.title', 'Security & Compliance')}</h1>
        <p className="text-sm text-text-muted">{t('admin.security.subtitle', 'Monitor authentication anomalies, active sessions, and security alerts.')}</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-muted">
                <th className="p-4 text-start font-medium">{t('admin.security.table.type', 'Type')}</th>
                <th className="p-4 text-start font-medium">{t('admin.security.table.description', 'Description')}</th>
                <th className="p-4 text-start font-medium">{t('admin.security.table.user', 'User')}</th>
                <th className="p-4 text-start font-medium">{t('admin.security.table.ipDevice', 'IP / Device')}</th>
                <th className="p-4 text-start font-medium">{t('admin.security.table.timestamp', 'Timestamp')}</th>
                <th className="p-4 text-end font-medium">{t('admin.security.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-surface-2/40 transition">
                  <td className="p-4 font-semibold uppercase tracking-wider text-[10px] text-fg">
                    {t(`admin.security.types.${ev.type}`, ev.type)}
                  </td>
                  <td className="p-4 text-text">{t(ev.descriptionKey, { defaultValue: ev.description })}</td>
                  <td className="p-4 text-muted">{ev.userName || t('admin.security.system', 'System')}</td>
                  <td className="p-4 font-mono text-[11px] text-muted">
                    <LtrBdi>{ev.ipAddress} ({ev.device})</LtrBdi>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-muted">
                    <LtrBdi>{formatAdminDate(ev.createdAt, i18n.language)}</LtrBdi>
                  </td>
                  <td className="p-4 text-end">
                    {ev.type === 'session' && !ev.revoked ? (
                      <Button variant="secondary" size="sm" onClick={() => handleRevoke(ev.id, ev.descriptionKey)} className="h-7 text-xs text-red-500 hover:bg-red-500/10">
                        {t('admin.security.revoke', 'Revoke')}
                      </Button>
                    ) : ev.revoked ? (
                      <Badge tone="danger">{t('admin.security.revoked', 'Revoked')}</Badge>
                    ) : (
                      <Badge tone="warning">{t('admin.security.flagged', 'Flagged')}</Badge>
                    )}
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
