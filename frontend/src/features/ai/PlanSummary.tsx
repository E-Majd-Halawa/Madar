import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { formatDuration } from './formatDuration';

interface PlanSummaryProps {
  totalMinutes: number;
  availableMinutes?: number;
  onRegenerate: () => void;
  onAddTasks: () => void;
  added: boolean;
  disabled?: boolean;
}

export function PlanSummary({
  totalMinutes,
  availableMinutes = 180,
  onRegenerate,
  onAddTasks,
  added,
  disabled,
}: PlanSummaryProps) {
  const { t, i18n } = useTranslation();
  const left = availableMinutes - totalMinutes;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap p-3.5 border border-border/30 rounded-2xl bg-surface/80 backdrop-blur-md shadow-sm">
      <div>
        <div className="text-[15px] font-semibold text-text">
          <span className="font-medium text-text-muted me-1.5">{t('ai.totalLabel', 'Total:')}</span>
          {formatDuration(totalMinutes, i18n.language)}
        </div>
        <div className="text-xs text-text-muted mt-0.5">
          {left >= 0
            ? t('ai.buffer', { time: formatDuration(left, i18n.language), window: formatDuration(availableMinutes, i18n.language) })
            : t('ai.overWindow', { time: formatDuration(-left, i18n.language), window: formatDuration(availableMinutes, i18n.language) })}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRegenerate}
          disabled={disabled || added}
          className="rounded-xl text-[13px] py-1.5 px-3 h-auto"
        >
          {t('ai.regenerate', 'Regenerate')}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onAddTasks}
          disabled={disabled || added}
          className="rounded-xl text-[13px] py-1.5 px-3 h-auto font-semibold shadow-md hover:shadow-accent/25"
        >
          {added ? t('ai.added', 'Added ✓') : t('ai.addPlanToTasks', 'Add Plan to My Tasks')}
        </Button>
      </div>
    </div>
  );
}
