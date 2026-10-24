import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, X, CheckSquare, FolderKanban, Users,
  MessageSquare, File, Calendar, Clock, SlidersHorizontal,
} from 'lucide-react';
import type { SearchCategory, SearchResultBase } from '@/api/contracts/search';
import { Highlight } from '@/features/search/Highlight';
import { useMotion } from '@/hooks/useMotion';
import { useAuthStore } from '@/store/authStore';
import { useSearchStore } from '@/store/searchStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

const CATEGORIES: { id: SearchCategory; labelKey: string; icon: typeof Search }[] = [
  { id: 'all',      labelKey: 'search.categories.all',      icon: Search },
  { id: 'tasks',    labelKey: 'search.categories.tasks',    icon: CheckSquare },
  { id: 'projects', labelKey: 'search.categories.projects', icon: FolderKanban },
  { id: 'people',   labelKey: 'search.categories.people',   icon: Users },
  { id: 'messages', labelKey: 'search.categories.messages', icon: MessageSquare },
  { id: 'files',    labelKey: 'search.categories.files',    icon: File },
  { id: 'events',   labelKey: 'search.categories.events',   icon: Calendar },
];

function ResultCard({ result, onOpen }: { result: SearchResultBase; onOpen: (r: SearchResultBase) => void }) {
  const { t } = useTranslation();
  const catDef = CATEGORIES.find((c) => c.id === result.category);
  const Icon = catDef?.icon ?? Search;
  return (
    <button
      type="button"
      onClick={() => onOpen(result)}
      className="group flex w-full items-start gap-4 rounded-xl border bg-surface-2/30 p-4 text-start transition hover:border-accent/30 hover:bg-surface-2 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2">
        <Icon className="size-4 text-muted" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Highlight
            text={result.title}
            ranges={result.titleRanges}
            className="truncate text-sm font-medium text-fg"
          />
          <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] capitalize text-muted">
            {t(`search.categories.${result.category}`)}
          </span>
        </div>
        {result.subtitle && (
          <Highlight
            text={result.subtitle}
            ranges={result.subtitleRanges}
            className="mt-0.5 block truncate text-xs text-muted"
          />
        )}
      </div>
      <span className="shrink-0 text-xs text-muted opacity-0 transition group-hover:opacity-100">
        {t('search.open')} →
      </span>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-start gap-4 rounded-xl border p-4 opacity-60 animate-pulse">
      <div className="size-9 shrink-0 rounded-lg bg-surface-2" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 rounded bg-surface-2" />
        <div className="h-3 w-1/2 rounded bg-surface-2" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { presets } = useMotion();

  const user = useAuthStore((s) => s.session?.user);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { results, loading, recentSearches, search, loadRecent, saveRecent, clearRecent, setCategory, category } = useSearchStore();

  const [localQuery, setLocalQuery] = useState(searchParams.get('q') ?? '');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>((searchParams.get('cat') as SearchCategory) ?? 'all');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches
  useEffect(() => {
    if (user) void loadRecent(user.id);
  }, [user, loadRecent]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Sync URL -> state
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    const cat = (searchParams.get('cat') as SearchCategory) ?? 'all';
    setLocalQuery(q);
    setActiveCategory(cat);
    setCategory(cat);
    if (q && user && workspaceId) {
      void search(q, workspaceId, user.id, cat);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQueryChange = (q: string) => {
    setLocalQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (activeCategory !== 'all') params.set('cat', activeCategory);
      setSearchParams(params, { replace: true });
      if (q && user && workspaceId) void search(q, workspaceId, user.id, activeCategory);
    }, 300);
  };

  const handleCategoryChange = (cat: SearchCategory) => {
    setActiveCategory(cat);
    setCategory(cat);
    const params = new URLSearchParams();
    if (localQuery) params.set('q', localQuery);
    if (cat !== 'all') params.set('cat', cat);
    setSearchParams(params, { replace: true });
    if (localQuery && user && workspaceId) void search(localQuery, workspaceId, user.id, cat);
  };

  const handleOpenResult = (result: SearchResultBase) => {
    if (user && localQuery) void saveRecent(user.id, localQuery);
    switch (result.category) {
      case 'tasks':
        navigate(`${ROUTES.app.tasks}?task=${result.id}`);
        break;
      case 'projects':
        navigate(ROUTES.app.project.replace(':id', result.id));
        break;
      case 'people':
        navigate(`${ROUTES.app.members}?user=${result.id}`);
        break;
      case 'messages': {
        const channelId = result.meta['channelId'];
        const convId = result.meta['conversationId'];
        if (channelId) navigate(`${ROUTES.app.chat}?channel=${channelId}&highlight=${result.id}`);
        else if (convId) navigate(`${ROUTES.app.messages}?conv=${convId}&highlight=${result.id}`);
        break;
      }
      case 'files':
        navigate(ROUTES.app.files);
        break;
      case 'events':
        navigate(`${ROUTES.app.calendar}?task=${result.meta['taskId']}`);
        break;
    }
  };

  const handleRecentClick = (q: string) => {
    setLocalQuery(q);
    const params = new URLSearchParams({ q });
    setSearchParams(params);
  };

  const visibleItems = results
    ? (activeCategory === 'all' ? results.items : results.items.filter((r) => r.category === activeCategory))
    : [];

  const countFor = (cat: Exclude<SearchCategory, 'all'>): number => results?.counts[cat] ?? 0;
  const totalCount = results ? Object.values(results.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <motion.div
      variants={presets.pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('search.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('search.subtitle')}</p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          id="search-page-input"
          data-search-input
          value={localQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.title')}
          className="h-12 w-full rounded-xl border bg-surface-2/50 ps-10 pe-10 text-sm outline-none ring-accent/50 transition placeholder:text-muted focus:border-accent/40 focus:ring-2"
        />
        {localQuery && (
          <button
            type="button"
            onClick={() => handleQueryChange('')}
            aria-label={t('common.close')}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Category tabs */}
      {localQuery && results && (
        <div
          className="flex gap-1 overflow-x-auto pb-1"
          role="tablist"
          aria-label={t('search.filterByCategory')}
        >
          {CATEGORIES.map(({ id, labelKey, icon: Icon }) => {
            const count = id === 'all' ? totalCount : countFor(id as Exclude<SearchCategory, 'all'>);
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`search-tab-${id}`}
                aria-selected={isActive}
                onClick={() => handleCategoryChange(id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition',
                  isActive
                    ? 'bg-accent text-accent-fg'
                    : 'text-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {t(labelKey)}
                {count > 0 && (
                  <span className={cn('rounded-full px-1.5 text-[11px] font-medium', isActive ? 'bg-accent-fg/20' : 'bg-surface-2')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      <div aria-live="polite" aria-busy={loading}>
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && localQuery && results && visibleItems.length === 0 && (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-3 size-10 text-muted" aria-hidden />
            <p className="font-medium">{t('search.noResults')}</p>
            <p className="mt-1 text-sm text-muted">{t('search.noResultsBody', { query: localQuery })}</p>
          </div>
        )}

        {!loading && visibleItems.length > 0 && (
          <div className="space-y-2" role="list" aria-label={t('search.results')}>
            {visibleItems.map((result) => (
              <ResultCard key={result.id} result={result} onOpen={handleOpenResult} />
            ))}
          </div>
        )}

        {/* Recent searches (when no query) */}
        {!localQuery && recentSearches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-medium text-muted">
                <Clock className="size-4" aria-hidden />
                {t('search.recent')}
              </h2>
              <button
                type="button"
                onClick={() => user && void clearRecent(user.id)}
                className="text-xs text-muted hover:text-fg"
              >
                {t('search.clearRecent')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((r) => (
                <button
                  key={r.query}
                  type="button"
                  onClick={() => handleRecentClick(r.query)}
                  className="flex items-center gap-1.5 rounded-lg border bg-surface-2/50 px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg"
                >
                  <Clock className="size-3" aria-hidden />
                  {r.query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty — no query, no recents */}
        {!localQuery && recentSearches.length === 0 && (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-3 size-12 text-muted/40" aria-hidden />
            <p className="text-muted">{t('search.emptyHint')}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
