import { Briefcase, GraduationCap, Laptop, User, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/Switch';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { inputClass } from '@/components/ui/Field';
import { ThemePicker } from '@/features/settings/ThemePicker';
import { useSettingsStore } from '@/store/settingsStore';
import type { Language, NotificationLevel, UsagePurpose, UserPreferences } from '@/types';
import { cn } from '@/utils/cn';
import { OptionCard } from './OptionCard';

export interface StepProps {
  prefs: UserPreferences;
  patch: (change: Partial<UserPreferences>) => void;
}

const USAGE: Array<{ id: UsagePurpose; icon: typeof User }> = [
  { id: 'personal', icon: User },
  { id: 'study', icon: GraduationCap },
  { id: 'work', icon: Briefcase },
  { id: 'freelance', icon: Laptop },
  { id: 'team', icon: Users },
];

export function UsageStep({ prefs, patch }: StepProps) {
  const { t } = useTranslation();
  const toggle = (id: UsagePurpose) =>
    patch({ usage: prefs.usage.includes(id) ? prefs.usage.filter((u) => u !== id) : [...prefs.usage, id] });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {USAGE.map(({ id, icon: Icon }) => (
        <OptionCard
          key={id}
          type="checkbox"
          name="usage"
          checked={prefs.usage.includes(id)}
          onChange={() => toggle(id)}
          title={t(`onboarding.usage.${id}`)}
          icon={<Icon className="size-5" aria-hidden />}
        />
      ))}
    </div>
  );
}

export function WorkspaceStep({ prefs, patch }: StepProps) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(['personal', 'team'] as const).map((type) => (
        <OptionCard
          key={type}
          type="radio"
          name="workspaceType"
          checked={prefs.workspaceType === type}
          onChange={() => patch({ workspaceType: type })}
          title={t(`onboarding.workspace.${type}`)}
          body={t(`onboarding.workspace.${type}Body`)}
          icon={type === 'personal' ? <User className="size-5" aria-hidden /> : <Users className="size-5" aria-hidden />}
        />
      ))}
    </div>
  );
}

export const ThemeStep = () => <ThemePicker />;

export function LanguageStep() {
  const { language, setLanguage } = useSettingsStore();
  return (
    <SegmentedControl<Language>
      name="onboarding-language"
      legend="Language"
      value={language}
      onChange={setLanguage}
      options={[
        { value: 'en', label: 'English' },
        { value: 'ar', label: 'العربية' },
      ]}
    />
  );
}

const zones = (): string[] => {
  const list = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone');
  return list?.length ? list : ['UTC', 'Europe/London', 'Asia/Riyadh', 'Asia/Dubai', 'America/New_York'];
};

export function TimezoneStep({ prefs, patch }: StepProps) {
  const { t } = useTranslation();
  const options = zones();
  const list = options.includes(prefs.timezone) ? options : [prefs.timezone, ...options];
  return (
    <div>
      <label htmlFor="tz" className="sr-only">
        {t('onboarding.timezone.title')}
      </label>
      <select id="tz" value={prefs.timezone} onChange={(e) => patch({ timezone: e.target.value })} className={inputClass} dir="ltr">
        {list.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
    </div>
  );
}

export function HoursStep({ prefs, patch }: StepProps) {
  const { t } = useTranslation();
  const toggleDay = (day: number) =>
    patch({ workDays: prefs.workDays.includes(day) ? prefs.workDays.filter((d) => d !== day) : [...prefs.workDays, day].sort() });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {(['workStart', 'workEnd'] as const).map((key) => (
          <div key={key}>
            <label htmlFor={key} className="mb-1.5 block text-sm font-medium">
              {t(key === 'workStart' ? 'onboarding.hours.start' : 'onboarding.hours.end')}
            </label>
            <input id={key} type="time" dir="ltr" value={prefs[key]} onChange={(e) => patch({ [key]: e.target.value })} className={inputClass} />
          </div>
        ))}
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t('onboarding.hours.days')}</legend>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const on = prefs.workDays.includes(day);
            return (
              <label
                key={day}
                className={cn(
                  'cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
                  on ? 'border-accent bg-accent/15 text-accent' : 'text-muted hover:text-fg',
                )}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleDay(day)} />
                {t(`weekdays.${day}`)}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

export function NotificationsStep({ prefs, patch }: StepProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">{t('onboarding.notifications.level')}</p>
        <SegmentedControl<NotificationLevel>
          name="notification-level"
          legend={t('onboarding.notifications.level')}
          value={prefs.notificationLevel}
          onChange={(notificationLevel) => patch({ notificationLevel })}
          options={(['all', 'important', 'none'] as const).map((value) => ({ value, label: t(`onboarding.notifications.${value}`) }))}
        />
      </div>
      <Switch label={t('onboarding.notifications.email')} checked={prefs.emailNotifications} onChange={(emailNotifications) => patch({ emailNotifications })} />
      <Switch label={t('onboarding.notifications.push')} checked={prefs.pushNotifications} onChange={(pushNotifications) => patch({ pushNotifications })} />
    </div>
  );
}
