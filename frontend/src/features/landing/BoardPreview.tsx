import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Column = 'todo' | 'doing' | 'done';
const COLUMNS: Column[] = ['todo', 'doing', 'done'];

const INITIAL: Array<{ key: string; column: Column }> = [
  { key: 'a', column: 'doing' },
  { key: 'b', column: 'todo' },
  { key: 'c', column: 'todo' },
  { key: 'd', column: 'done' },
];

export function BoardPreview() {
  const { t } = useTranslation();
  const [cards, setCards] = useState(INITIAL);

  const advance = (key: string) =>
    setCards((list) =>
      list.map((card) =>
        card.key === key ? { ...card, column: COLUMNS[(COLUMNS.indexOf(card.column) + 1) % COLUMNS.length] } : card,
      ),
    );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((column) => {
        const items = cards.filter((card) => card.column === column);
        return (
          <section key={column} aria-label={t(`landing.preview.board.columns.${column}`)} className="rounded-xl bg-surface-2/40 p-3">
            <h3 className="mb-3 flex items-center justify-between px-1 text-sm font-medium">
              {t(`landing.preview.board.columns.${column}`)}
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{items.length}</span>
            </h3>
            <ul className="min-h-24 space-y-2">
              {items.map((card) => {
                const title = t(`landing.preview.board.cards.${card.key}`);
                return (
                  <li key={card.key} className="flex items-center justify-between gap-2 rounded-lg border bg-surface px-3 py-2.5 text-sm">
                    <span>{title}</span>
                    <button
                      type="button"
                      onClick={() => advance(card.key)}
                      aria-label={t('landing.preview.board.move', { title })}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-accent"
                    >
                      <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
