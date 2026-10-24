import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Shield } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { auditService } from '@/services/auditService';
import type { SystemSettings } from '@/api/contracts/admin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await adminService.getSettings();
        setSettings(s);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await adminService.updateSettings(settings);
      await auditService.logEvent({
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'Super Admin',
        action: 'System Settings Updated',
        target: 'Global Config',
        ipAddress: '127.0.0.1',
        device: 'Admin Console',
        status: 'success',
      });
      toast.success(t('admin.settings.saved', 'System settings saved successfully.'));
    } catch {
      toast.error(t('admin.settings.saveError', 'Failed to save settings.'));
    }
  };

  if (loading || !settings) {
    return <div className="space-y-4 animate-pulse"><div className="h-40 bg-surface-muted rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('admin.settings.title', 'System Settings')}</h1>
        <p className="text-sm text-muted">{t('admin.settings.subtitle', 'Global configuration flags (Super Admin restricted).')}</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="pb-4 border-b border-border">
            <Switch
              checked={settings.registrationOpen}
              onChange={(checked) => setSettings({ ...settings, registrationOpen: checked })}
              label={t('admin.settings.registrationOpen', 'Open Registration')}
              description={t('admin.settings.registrationOpenDesc', 'Allow new users to create accounts freely.')}
            />
          </div>

          <div className="pb-4 border-b border-border">
            <Switch
              checked={settings.maintenanceMode}
              onChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              label={t('admin.settings.maintenanceMode', 'Maintenance Mode')}
              description={t('admin.settings.maintenanceModeDesc', 'Restrict platform access to Super Admins only.')}
            />
          </div>

          <div className="space-y-2 pb-4 border-b border-border">
            <label className="block text-sm font-medium text-fg">{t('admin.settings.sessionTimeout', 'Session Timeout (minutes)')}</label>
            <input
              type="number"
              value={settings.sessionTimeoutMinutes}
              onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2 text-xs text-fg focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              {t('admin.settings.save', 'Save Settings')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
