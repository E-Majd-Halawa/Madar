import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface SubtaskListProps {
  subtasks: string[];
  onAddSubtasks: (selected: string[]) => void;
}

export function SubtaskList({ subtasks, onAddSubtasks }: SubtaskListProps) {
  const { t } = useTranslation();
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    subtasks.forEach((s) => {
      map[s] = true;
    });
    return map;
  });
  const [added, setAdded] = useState(false);

  const toggle = (s: string) => {
    if (added) return;
    setSelectedMap((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  const handleAdd = () => {
    if (added) return;
    setAdded(true);
    const chosen = subtasks.filter((s) => selectedMap[s]).map((s) => (s.startsWith('ai.') ? t(s) : s));
    onAddSubtasks(chosen);
  };

  const count = subtasks.filter((s) => selectedMap[s]).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        {subtasks.map((sub, index) => {
          const checked = !!selectedMap[sub];
          const id = `sub-${index}-${sub.slice(0, 5)}`;
          const resolvedSub = sub.startsWith('ai.') ? t(sub) : sub;

          return (
            <label
              key={index}
              htmlFor={id}
              className={`flex items-center justify-between gap-3 p-3.5 border border-border/30 rounded-2xl bg-surface/80 backdrop-blur-md shadow-sm cursor-pointer transition-all ${
                added ? 'opacity-60 pointer-events-none' : 'hover:border-accent/40'
              }`}
            >
              <div className="min-w-0 flex items-center gap-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  disabled={added}
                  onChange={() => toggle(sub)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span className="font-medium text-text text-sm">{resolvedSub}</span>
              </div>
            </label>
          );
        })}
      </div>
      <div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={added || count === 0}
          onClick={handleAdd}
          className="rounded-xl text-xs"
        >
          {added ? t('ai.subtasksAdded', { count }) + ' ✓' : t('ai.addSubtasks', 'Add subtasks')}
        </Button>
      </div>
    </div>
  );
}
