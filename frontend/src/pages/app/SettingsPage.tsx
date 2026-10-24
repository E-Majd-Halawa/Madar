import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { toast } from '@/store/toastStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Field } from '@/components/ui/Field';
import { AppearanceCard } from '@/features/settings/AppearanceCard';
import { LanguageCard } from '@/features/settings/LanguageCard';
import { ShortcutsHelp } from '@/features/search/ShortcutsHelp';
import { 
  User, Palette, Bell, Shield, Globe, Layers, 
  Clock, Eye, Database, KeyRound, Smartphone, Download, Trash2, CheckCircle2, AlertTriangle
} from 'lucide-react';

type SettingsTab = 
  | 'account' 
  | 'appearance' 
  | 'notifications' 
  | 'privacy' 
  | 'security' 
  | 'language' 
  | 'integrations' 
  | 'productivity' 
  | 'accessibility' 
  | 'data' 
  | 'shortcuts';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { session } = useAuthStore();
  const user = session?.user;
  const { prefs, save } = usePreferencesStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Account state with useEffect sync for async user loading
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user?.fullName) setName(user.fullName);
    if (user?.email) setEmail(user.email);
  }, [user?.fullName, user?.email]);

  // Privacy state
  const [profileVisible, setProfileVisible] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);

  // Security password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Integrations state
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({
    github: true,
    slack: false,
    googleCalendar: true,
    notion: false,
    figma: false,
    jira: false,
  });

  // Data / Account delete state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('settings.account.updated'));
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.id === 'u-001') {
      toast.error(t('settings.security.demoPasswordError'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.security.passwordMismatch'));
      return;
    }
    toast.success(t('settings.security.passwordUpdated'));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const toggleIntegration = (key: string) => {
    setIntegrations((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success(t('settings.integrations.updated', { key }));
      return next;
    });
  };

  const handleExportData = (format: 'json' | 'csv') => {
    const dataStr = `data:text/${format};charset=utf-8,` + encodeURIComponent(JSON.stringify({ user, prefs, exportedAt: new Date().toISOString() }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `taskflow-export-${user?.username || 'user'}.${format}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(t('settings.data.exportComplete', { format: format.toUpperCase() }));
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.id === 'u-001') {
      toast.error(t('settings.data.demoDeleteError'));
      return;
    }
    if (deleteConfirmText !== user?.email) {
      toast.error(t('settings.data.verifyFailed'));
      return;
    }
    toast.success(t('settings.data.deleted'));
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: 'account', label: t('settings.tabs.account'), icon: User },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'privacy', label: t('settings.tabs.privacy'), icon: Eye },
    { id: 'security', label: t('settings.tabs.security'), icon: Shield },
    { id: 'language', label: t('settings.tabs.language'), icon: Globe },
    { id: 'integrations', label: t('settings.tabs.integrations'), icon: Layers },
    { id: 'productivity', label: t('settings.tabs.productivity'), icon: Clock },
    { id: 'accessibility', label: t('settings.tabs.accessibility'), icon: KeyRound },
    { id: 'data', label: t('settings.tabs.data'), icon: Database },
    { id: 'shortcuts', label: t('settings.tabs.shortcuts'), icon: Smartphone },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12" dir="auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">{t('settings.title')}</h1>
        <p className="text-sm text-text-muted">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <Card className="p-2 md:col-span-1 space-y-1 bg-surface-muted/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active 
                    ? 'bg-primary text-primary-fg shadow-sm' 
                    : 'text-text-muted hover:text-text hover:bg-surface'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </Card>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'account' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text">{t('settings.account.title')}</h3>
                <p className="text-xs text-text-muted">{t('settings.account.subtitle')}</p>
              </div>
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <Field label={t('settings.account.fullName')}>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </Field>
                <Field label={t('settings.account.email')}>
                  <input type="email" value={email} readOnly className="w-full px-3 py-2 rounded-lg bg-surface-muted border border-border text-text-muted text-sm cursor-not-allowed focus:outline-none" />
                </Field>
                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary">{t('settings.account.save')}</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'appearance' && <AppearanceCard />}

          {activeTab === 'notifications' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text">{t('settings.notifications.title')}</h3>
                <p className="text-xs text-text-muted">{t('settings.notifications.subtitle')}</p>
              </div>
              <div className="space-y-4">
                <Switch 
                  checked={prefs.emailNotifications} 
                  onChange={(val) => save(user?.id || 'u-001', { emailNotifications: val })} 
                  label={t('settings.notifications.email')} 
                  description={t('settings.notifications.emailDesc')} 
                />
                <Switch 
                  checked={prefs.pushNotifications} 
                  onChange={(val) => save(user?.id || 'u-001', { pushNotifications: val })} 
                  label={t('settings.notifications.push')} 
                  description={t('settings.notifications.pushDesc')} 
                />
              </div>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text">{t('settings.privacy.title')}</h3>
                <p className="text-xs text-text-muted">{t('settings.privacy.subtitle')}</p>
              </div>
              <div className="space-y-4">
                <Switch checked={profileVisible} onChange={setProfileVisible} label={t('settings.privacy.profileVisible')} description={t('settings.privacy.profileVisibleDesc')} />
                <Switch checked={onlineStatus} onChange={setOnlineStatus} label={t('settings.privacy.onlineStatus')} description={t('settings.privacy.onlineStatusDesc')} />
                <Switch checked={readReceipts} onChange={setReadReceipts} label={t('settings.privacy.readReceipts')} description={t('settings.privacy.readReceiptsDesc')} />
                <Switch checked={typingIndicators} onChange={setTypingIndicators} label={t('settings.privacy.typingIndicators')} description={t('settings.privacy.typingIndicatorsDesc')} />
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text">{t('settings.security.title')}</h3>
                  <p className="text-xs text-text-muted">{t('settings.security.subtitle')}</p>
                </div>

                {/* Current session card */}
                <div className="p-4 rounded-xl bg-surface-muted border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{t('settings.security.currentSession')}</p>
                      <p className="text-xs text-text-muted"><bdi dir="ltr">192.168.1.54</bdi> · {t('settings.security.thisDevice')}</p>
                    </div>
                  </div>
                  <Badge tone="accent">{t('settings.security.thisDevice')}</Badge>
                </div>

                {/* Two-Factor Authentication */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">{t('settings.security.twoFactor')}</p>
                    <p className="text-xs text-text-muted">{t('settings.security.twoFactorDesc')}</p>
                  </div>
                  <Switch checked={twoFactorEnabled} onChange={setTwoFactorEnabled} label="" description="" />
                </div>
              </Card>

              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-text">{t('settings.security.changePassword')}</h3>
                {user?.id === 'u-001' && (
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {t('settings.security.demoRestricted')}
                  </div>
                )}
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <Field label={t('settings.security.currentPassword')}>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </Field>
                  <Field label={t('settings.security.newPassword')}>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </Field>
                  <Field label={t('settings.security.confirmPassword')}>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary">{t('settings.security.updatePassword')}</Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {activeTab === 'language' && <LanguageCard />}

          {activeTab === 'integrations' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text">{t('settings.integrations.title')}</h3>
                <p className="text-xs text-text-muted">{t('settings.integrations.subtitle')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'github', name: t('settings.integrations.githubName'), desc: t('settings.integrations.githubDesc') },
                  { key: 'slack', name: t('settings.integrations.slackName'), desc: t('settings.integrations.slackDesc') },
                  { key: 'googleCalendar', name: t('settings.integrations.googleCalendarName'), desc: t('settings.integrations.googleCalendarDesc') },
                  { key: 'notion', name: t('settings.integrations.notionName'), desc: t('settings.integrations.notionDesc') },
                  { key: 'figma', name: t('settings.integrations.figmaName'), desc: t('settings.integrations.figmaDesc') },
                  { key: 'jira', name: t('settings.integrations.jiraName'), desc: t('settings.integrations.jiraDesc') },
                ].map((item) => {
                  const connected = integrations[item.key];
                  return (
                    <div key={item.key} className="p-4 rounded-xl bg-surface-muted border border-border flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-text">{item.name}</p>
                          <Badge tone={connected ? 'accent' : 'neutral'}>{connected ? t('settings.integrations.connected') : t('settings.integrations.disconnected')}</Badge>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{item.desc}</p>
                      </div>
                      <Button variant={connected ? 'ghost' : 'secondary'} size="sm" onClick={() => toggleIntegration(item.key)}>
                        {connected ? t('settings.integrations.disconnect') : t('settings.integrations.connect')}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {activeTab === 'productivity' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text">{t('settings.productivity.title')}</h3>
                <p className="text-xs text-text-muted">{t('settings.productivity.subtitle')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('settings.productivity.workStart')}>
                  <input type="time" value={prefs.workStart} onChange={(e) => save(user?.id || 'u-001', { workStart: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </Field>
                <Field label={t('settings.productivity.workEnd')}>
                  <input type="time" value={prefs.workEnd} onChange={(e) => save(user?.id || 'u-001', { workEnd: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </Field>
              </div>
            </Card>
          )}

          {activeTab === 'accessibility' && (
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text">{t('settings.accessibility.title')}</h3>
                <p className="text-xs text-text-muted">{t('settings.accessibility.subtitle')}</p>
              </div>
              <div className="space-y-4">
                <Switch checked={true} onChange={() => {}} label={t('settings.accessibility.highContrast')} description={t('settings.accessibility.highContrastDesc')} />
                <Switch checked={false} onChange={() => {}} label={t('settings.accessibility.disableSingleKey')} description={t('settings.accessibility.disableSingleKeyDesc')} />
              </div>
            </Card>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text">{t('settings.data.title')}</h3>
                  <p className="text-xs text-text-muted">{t('settings.data.subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => handleExportData('json')} className="flex items-center gap-2">
                    <Download className="w-4 h-4" /> {t('settings.data.exportJson')}
                  </Button>
                  <Button variant="secondary" onClick={() => handleExportData('csv')} className="flex items-center gap-2">
                    <Download className="w-4 h-4" /> {t('settings.data.exportCsv')}
                  </Button>
                </div>
              </Card>

              <Card className="p-6 space-y-6 border-red-500/30">
                <div>
                  <h3 className="text-lg font-semibold text-red-500">{t('settings.data.deleteTitle')}</h3>
                  <p className="text-xs text-text-muted">{t('settings.data.deleteSubtitle')}</p>
                </div>
                {user?.id === 'u-001' && (
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {t('settings.data.demoDeleteError')}
                  </div>
                )}
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <Field label={t('settings.data.deleteConfirmLabel', { email: user?.email || 'user@taskflow3d.dev' })}>
                    <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={user?.email || ''} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit" variant="danger" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> {t('settings.data.deleteButton')}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <Card className="p-6">
              <ShortcutsHelp />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
