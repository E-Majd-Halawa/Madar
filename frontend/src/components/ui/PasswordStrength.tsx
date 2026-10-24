import { Check, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { passwordRules, passwordStrength } from '@/schemas/auth';
import { cn } from '@/utils/cn';

const BAR = ['bg-border/10', 'bg-danger', 'bg-warning', 'bg-accent-2', 'bg-success'];

export function PasswordStrength({ value }: { value: string }) {
  const { t } = useTranslation();
  const score = value ? passwordStrength(value) : 0;
  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={cn('h-1 flex-1 rounded-full transition-colors', n <= score ? BAR[score] : 'bg-border/10')} />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {t('auth.strength.label')}: <span className="font-medium text-fg">{t(`auth.strength.level${score}`)}</span>
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {passwordRules.map((rule) => {
          const ok = rule.test(value);
          const Icon = ok ? Check : Circle;
          return (
            <li key={rule.id} className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-success' : 'text-muted')}>
              <Icon className="size-3" aria-hidden />
              {t(`auth.strength.rule_${rule.id}`)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
