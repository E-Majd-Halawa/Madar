import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Switch } from '@/components/ui/Switch';
import { ACCENTS, ANIMATION_LEVELS } from '@/constants/themes';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/cn';
import { ThemePicker } from './ThemePicker';

export function AppearanceCard() {
  const { t } = useTranslation();
  const { accent, animation, effects3d, setAccent, setAnimation, setEffects3d } = useThemeStore();

  return (
    <Card
      title={t('foundation.appearance')}
      description={t('foundation.appearanceHint')}
      icon={<Palette className="size-5" aria-hidden />}
    >
      <div className="space-y-6">
        <ThemePicker />

        <div>
          <p className="mb-2 text-sm font-medium">{t('foundation.accent')}</p>
          <div role="group" aria-label={t('foundation.accent')} className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={accent === null}
              onClick={() => setAccent(null)}
              className={cn(
                'h-8 rounded-full border px-3 text-xs font-medium transition',
                accent === null ? 'border-accent text-accent' : 'text-muted hover:text-fg',
              )}
            >
              {t('foundation.accentDefault')}
            </button>
            {ACCENTS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={accent === option.hex}
                aria-label={t(`accents.${option.id}`)}
                title={t(`accents.${option.id}`)}
                onClick={() => setAccent(option.hex)}
                style={{ backgroundColor: option.hex }}
                className={cn(
                  'size-8 rounded-full border-2 border-transparent transition',
                  accent === option.hex && 'scale-110 border-fg',
                )}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">{t('foundation.animationLabel')}</p>
          <SegmentedControl
            name="animation"
            legend={t('foundation.animationLabel')}
            value={animation}
            onChange={setAnimation}
            options={ANIMATION_LEVELS.map((level) => ({ value: level, label: t(`animation.${level}`) }))}
          />
        </div>

        <Switch
          checked={effects3d}
          onChange={setEffects3d}
          label={t('foundation.effects3d')}
          description={t('foundation.effects3dHint')}
        />
      </div>
    </Card>
  );
}
