import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import type { OverdueItem } from '@/api/contracts/ai';

interface OverdueListProps {
  items: OverdueItem[];
  onApplyAll: () => void;
  onMoveOne: (title: string) => void;
}

export function OverdueList({ items, onApplyAll, onMoveOne }: OverdueListProps) {
  const { t } = useTranslation();
  const [movedMap, setMovedMap] = useState<Record<string, boolean>>({});

  const handleMove = (title: string) => {
    setMovedMap((prev) => ({ ...prev, [title]: true }));
    onMoveOne(title);
  };

  const allMoved = items.every((i) => movedMap[i.title]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5">
        {items.map((item, index) => {
          const moved = movedMap[item.title];
          const resolvedTitle = item.title.startsWith('ai.') ? t(item.title) : item.title;
          const resolvedWhy = item.why.startsWith('ai.') ? t(item.why) : item.why;

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-3 p-3.5 border border-border/30 rounded-2xl bg-surface/80 backdrop-blur-md shadow-sm transition-all"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="min-w-0">
                <b className="font-semibold text-text text-sm block truncate">{resolvedTitle}</b>
                <small className="text-xs text-text-muted">{resolvedWhy}</small>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs text-danger bg-danger/10 border border-danger/30 px-2.5 py-0.5 rounded-full">
                  {item.daysLate}d late
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={moved}
                  onClick={() => handleMove(item.title)}
                  className="rounded-xl text-xs"
                >
                  {moved ? t('ai.added', 'Moved ✓') : t('ai.moveToTomorrow', 'Move to tomorrow')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={allMoved}
          onClick={() => {
            items.forEach((i) => {
              if (!movedMap[i.title]) handleMove(i.title);
            });
            onApplyAll();
          }}
          className="rounded-xl text-xs"
        >
          {t('ai.applyAll', 'Apply all')}
        </Button>
      </div>
    </div>
  );
}
