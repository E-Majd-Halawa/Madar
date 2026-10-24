import { useTranslation } from 'react-i18next';
import { SHORTCUT_GROUPS, SHORTCUT_REGISTRY, modKey } from '@/constants/shortcuts';
import { cn } from '@/utils/cn';

interface ShortcutsHelpProps {
  className?: string;
}

function Kbd({ keys }: { keys: string[] }) {
  const mod = modKey();
  const display = keys.map((k) => (k === 'Ctrl' ? mod : k));
  return (
    <span className="flex items-center gap-1" dir="ltr">
      {display.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-2 px-1.5 font-mono text-[11px] text-muted shadow-sm"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

/**
 * Reusable shortcuts reference panel.
 * Consumed by the ? dialog (inside the command palette) and the Settings > Shortcuts section.
 */
export function ShortcutsHelp({ className }: ShortcutsHelpProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-6', className)}>
      {SHORTCUT_GROUPS.map((group) => {
        const items = SHORTCUT_REGISTRY.filter(
          (s) => s.groupId === group.id && s.keys.length > 0,
        );
        if (!items.length) return null;
        return (
          <section key={group.id} aria-labelledby={`shortcut-group-${group.id}`}>
            <h3
              id={`shortcut-group-${group.id}`}
              className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted"
            >
              {t(group.labelKey)}
            </h3>
            <ul className="space-y-1.5" role="list">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 hover:bg-surface-2"
                >
                  <span className="text-sm text-fg">{t(item.labelKey)}</span>
                  <Kbd keys={item.keys} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="text-xs text-muted">
        {t('shortcuts.singleKeyNote')}
      </p>
    </div>
  );
}
