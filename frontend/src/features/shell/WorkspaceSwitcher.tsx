import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';
import { toast } from '@/store/toastStore';
import { cn } from '@/utils/cn';

/** Accessible listbox-style menu for switching between the user's workspaces. */
export function WorkspaceSwitcher() {
  const { t } = useTranslation();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = useWorkspaceStore(selectActiveWorkspace);
  const setActive = useWorkspaceStore((s) => s.setActive);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!active) return null;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('shell.switchWorkspace')}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl border bg-surface-2/50 p-2.5 text-start transition hover:border-border/30"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold text-black/80" style={{ background: active.color }}>
          {active.name[0]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium" title={active.name}>{active.name}</span>
          <span className="block text-xs text-muted">{t(`shell.${active.type}`)}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden />
      </button>

      {open && (
        <ul role="listbox" aria-label={t('shell.switchWorkspace')} className="glass absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-xl p-1.5 shadow-depth">
          {workspaces.map((ws) => {
            const selected = ws.id === active.id;
            return (
              <li key={ws.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(ws.id);
                    setOpen(false);
                    if (!selected) toast.info(ws.name);
                  }}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start text-sm hover:bg-surface-2', selected && 'bg-surface-2')}
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: ws.color }} />
                  <span className="min-w-0 flex-1 truncate" title={ws.name}>{ws.name}</span>
                  {selected && <Check className="size-4 text-accent" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
