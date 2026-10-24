import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useSettingsStore } from '@/store/settingsStore';
import type { DirectionChoice, Language } from '@/types';

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

export function LanguageCard() {
  const { t } = useTranslation();
  const { language, direction, setLanguage, setDirection } = useSettingsStore();

  const directionOptions: Array<{ value: DirectionChoice; label: string }> = [
    { value: 'auto', label: t('foundation.dirAuto') },
    { value: 'ltr', label: t('foundation.dirLtr') },
    { value: 'rtl', label: t('foundation.dirRtl') },
  ];

  return (
    <Card
      title={t('foundation.language')}
      description={t('foundation.languageHint')}
      icon={<Languages className="size-5" aria-hidden />}
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">{t('foundation.languageLabel')}</p>
          <SegmentedControl
            name="language"
            legend={t('foundation.languageLabel')}
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_OPTIONS}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">{t('foundation.directionLabel')}</p>
          <SegmentedControl
            name="direction"
            legend={t('foundation.directionLabel')}
            value={direction}
            onChange={setDirection}
            options={directionOptions}
          />
        </div>
      </div>
    </Card>
  );
}
