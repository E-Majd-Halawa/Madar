import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Command, ArrowRight, Clock, Keyboard, X,
  CheckSquare, FolderKanban, Users, MessageSquare, File, Calendar,
  Zap,
} from 'lucide-react';
import type { SearchResultBase, SearchCategory } from '@/api/contracts/search';
import { ROUTES } from '@/constants/routes';
import { SHORTCUT_REGISTRY, modKey } from '@/constants/shortcuts';
import { searchService } from '@/services/searchService';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useThemeStore } from '@/store/themeStore';
import { useUiStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useMotion } from '@/hooks/useMotion';
import { toast } from '@/store/toastStore';
import { cn } from '@/utils/cn';
import { Highlight } from './Highlight';
import { ShortcutsHelp } from './ShortcutsHelp';

// ─── Natural language command parser ─────────────────────────────────────────
interface ParsedCommand {
  type: 'create-task' | 'create-project' | 'navigate' | 'theme' | 'toggle-3d' | 'language' | 'logout' | 'mark-read' | 'focus' | 'open-settings' | 'shortcut-help' | null;
  payload?: string;
}

function parseNaturalLanguage(q: string): ParsedCommand {
  const s = q.trim().toLowerCase();

  // Create task: "create task X" / "new task X" / "add task X"
  const taskMatch = /^(?:create|new|add)\s+task\s+(.+)$/i.exec(q.trim());
  if (taskMatch) return { type: 'create-task', payload: taskMatch[1] };
  // AR: إنشاء مهمة / مهمة جديدة
  const taskArMatch = /^(?:إنشاء|أضف|إضافة)\s+مهمة\s+(.+)$/i.exec(q.trim());
  if (taskArMatch) return { type: 'create-task', payload: taskArMatch[1] };

  // Create project
  const projMatch = /^(?:create|new|add)\s+project\s+(.+)$/i.exec(q.trim());
  if (projMatch) return { type: 'create-project', payload: projMatch[1] };

  // Theme changes
  const themeMatch = /^(?:change|switch|set)\s+theme\s+(\w+)$/i.exec(s);
  if (themeMatch) return { type: 'theme', payload: themeMatch[1] };
  if (/^(?:theme\s+)?(?:midnight|obsidian|emerald|ocean|aurora|light)$/.test(s)) {
    return { type: 'theme', payload: s.replace(/^theme\s+/, '') };
  }
  // AR: تغيير السمة
  const themeArMatch = /^(?:تغيير|تبديل)\s+(?:السمة|المظهر)\s+(\w+)$/.exec(q.trim());
  if (themeArMatch) return { type: 'theme', payload: themeArMatch[1] };

  // Toggle 3D
  if (/\b(toggle|enable|disable)\s+3d\b/i.test(s) || /ثلاثي الأبعاد|تأثيرات/.test(q)) {
    return { type: 'toggle-3d' };
  }

  // Language
  if (/^(?:switch\s+(?:language\s+)?arabic|language\s+arabic|ar$)/.test(s) || /^(?:اللغة العربية|عربي)$/.test(q.trim())) {
    return { type: 'language', payload: 'ar' };
  }
  if (/^(?:switch\s+(?:language\s+)?english|language\s+english|en$)/.test(s) || /^(?:اللغة الإنجليزية|إنجليزي)$/.test(q.trim())) {
    return { type: 'language', payload: 'en' };
  }

  // Logout
  if (/^(?:logout|log out|sign out|signout)$/.test(s) || /^(?:خروج|تسجيل الخروج)$/.test(q.trim())) {
    return { type: 'logout' };
  }

  // Mark all read
  if (/^mark\s+all\s+(?:notifications\s+)?read$/.test(s) || /تحديد.*كمقروء|قراءة الكل/.test(q)) {
    return { type: 'mark-read' };
  }

  // Start focus
  if (/^(?:start\s+)?focus(?:\s+\d+)?$/.test(s) || /تركيز|ابدأ التركيز/.test(q)) {
    return { type: 'navigate', payload: ROUTES.app.focus };
  }

  // Open pages
  const pageMap: [RegExp, string][] = [
    [/^(?:go to |open |view )?(?:calendar|schedule)/, ROUTES.app.calendar],
    [/^(?:go to |open |view )?(?:chat|channel|channels)/, ROUTES.app.chat],
    [/^(?:go to |open |view )?(?:messages|dms|direct)/, ROUTES.app.messages],
    [/^(?:go to |open |view )?(?:projects)/, ROUTES.app.projects],
    [/^(?:go to |open |view )?(?:dashboard|home)/, ROUTES.app.dashboard],
    [/^(?:go to |open |view )?(?:analytics|stats|reports)/, ROUTES.app.analytics],
    [/^(?:go to |open |view )?(?:ai|assistant)/, ROUTES.app.ai],
    [/^(?:open |go to )?(?:settings|preferences)/, ROUTES.app.settings],
    [/^(?:open |go to )?(?:profile)/, ROUTES.app.profile],
    [/^(?:open |go to )?(?:files)/, ROUTES.app.files],
    [/^(?:open |go to )?(?:members|team)/, ROUTES.app.members],
    [/^(?:open |go to )?(?:activity)/, ROUTES.app.activity],
    // Arabic
    [/^(?:افتح\s+)?(?:التقويم|جدول)/, ROUTES.app.calendar],
    [/^(?:افتح\s+)?(?:الدردشة|قناة)/, ROUTES.app.chat],
    [/^(?:افتح\s+)?(?:الرسائل|المحادثات)/, ROUTES.app.messages],
    [/^(?:افتح\s+)?(?:المشاريع)/, ROUTES.app.projects],
    [/^(?:افتح\s+)?(?:التحليلات|الإحصاء)/, ROUTES.app.analytics],
    [/^(?:افتح\s+)?(?:المساعد|الذكاء)/, ROUTES.app.ai],
    [/^(?:افتح\s+)?(?:الإعدادات)/, ROUTES.app.settings],
  ];
  for (const [re, route] of pageMap) {
    if (re.test(s) || re.test(q.trim())) return { type: 'navigate', payload: route };
  }

  // Shortcuts help
  if (/^(?:keyboard\s+)?shortcuts?|help$/i.test(s) || /اختصارات|مساعدة/.test(q)) {
    return { type: 'shortcut-help' };
  }

  return { type: null };
}

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<Exclude<SearchCategory, 'all'>, typeof Search> = {
  tasks: CheckSquare,
  projects: FolderKanban,
  people: Users,
  messages: MessageSquare,
  files: File,
  events: Calendar,
};

// ─── Command palette item types ───────────────────────────────────────────────
type PaletteItem =
  | { kind: 'command'; id: string; label: string; sublabel?: string; icon?: typeof Search; action: () => void }
  | { kind: 'search-result'; result: SearchResultBase; action: () => void }
  | { kind: 'recent'; query: string; action: () => void }
  | { kind: 'parsed-command'; label: string; icon?: typeof Search; action: () => void };

// ─── Main component ───────────────────────────────────────────────────────────
export function CommandPalette() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPalette);
  const setTaskModal = useUiStore((s) => s.setTaskModal);
  const setProjectModal = useUiStore((s) => s.setProjectModal);
  const user = useAuthStore((s) => s.session?.user);
  const logout = useAuthStore((s) => s.logout);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setTheme = useThemeStore((s) => s.setTheme);
  const setEffects3d = useThemeStore((s) => s.setEffects3d);
  const effects3d = useThemeStore((s) => s.effects3d);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const { presets } = useMotion();

  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResultBase[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listboxId = useId();
  const inputId = useId();
  const mod = modKey();

  // Load recent searches when opening
  useEffect(() => {
    if (open && user) {
      searchService.getRecentSearches(user.id).then((recent) => {
        setRecentSearches(recent.map((r) => r.query));
      });
      setQuery('');
      setActiveIdx(0);
      setShowShortcuts(false);
      setSearchResults([]);
    }
  }, [open, user]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !open) {
      setSearchResults([]);
      setLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!workspaceId || !user) return;
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const res = await searchService.search(query, {
          workspaceId,
          userId: user.id,
          limit: 8,
        });
        setSearchResults(res.items.slice(0, 8));
      } catch {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, open, workspaceId, user]);

  // Navigate to the search page result destination
  const openResult = useCallback(
    (result: SearchResultBase) => {
      setOpen(false);
      if (!workspaceId || !user) return;
      void searchService.saveRecentSearch(user.id, query);

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
        case 'events': {
          const taskId = result.meta['taskId'];
          navigate(`${ROUTES.app.calendar}?task=${taskId}`);
          break;
        }
      }
    },
    [navigate, setOpen, query, workspaceId, user],
  );

  // Build the command actions
  const buildItems = useCallback((): PaletteItem[] => {
    const items: PaletteItem[] = [];
    const q = query.trim();

    // ── Parsed natural-language command ──────────────────────────────────────
    if (q) {
      const parsed = parseNaturalLanguage(q);
      if (parsed.type) {
        let label = '';
        let icon: typeof Search | undefined = Zap;
        let action = () => {};

        switch (parsed.type) {
          case 'create-task':
            label = t('cmd.createTask', { title: parsed.payload });
            action = () => {
              setOpen(false);
              setTaskModal(true);
            };
            icon = CheckSquare;
            break;
          case 'create-project':
            label = t('cmd.createProject', { name: parsed.payload });
            action = () => {
              setOpen(false);
              setProjectModal(true);
            };
            icon = FolderKanban;
            break;
          case 'navigate':
            label = t('cmd.navigate', { route: parsed.payload });
            action = () => { setOpen(false); navigate(parsed.payload!); };
            icon = ArrowRight;
            break;
          case 'theme':
            label = t('cmd.applyTheme', { theme: parsed.payload });
            action = () => {
              setOpen(false);
              const validThemes = ['midnight','obsidian','emerald','ocean','aurora','light','system'];
              const th = parsed.payload?.toLowerCase() ?? '';
              if (validThemes.includes(th)) {
                setTheme(th as Parameters<typeof setTheme>[0]);
                toast.success(t('cmd.themeApplied', { theme: th }));
              }
            };
            break;
          case 'toggle-3d':
            label = t('cmd.toggle3d', { state: effects3d ? t('cmd.disable') : t('cmd.enable') });
            action = () => {
              setOpen(false);
              setEffects3d(!effects3d);
              toast.success(t(effects3d ? 'cmd.3dDisabled' : 'cmd.3dEnabled'));
            };
            break;
          case 'language':
            label = t('cmd.switchLanguage', { lang: parsed.payload === 'ar' ? 'Arabic' : 'English' });
            action = () => {
              setOpen(false);
              void i18n.changeLanguage(parsed.payload ?? 'en');
              useSettingsStore.getState().setLanguage((parsed.payload ?? 'en') as 'en' | 'ar');
              toast.success(t('cmd.languageChanged'));
            };
            break;
          case 'logout':
            label = t('cmd.logout');
            action = async () => {
              setOpen(false);
              await logout();
              navigate(ROUTES.home, { replace: true });
            };
            break;
          case 'mark-read':
            label = t('cmd.markAllRead');
            action = () => {
              setOpen(false);
              markAllRead();
              toast.success(t('cmd.allRead'));
            };
            break;
          case 'shortcut-help':
            label = t('cmd.showShortcuts');
            action = () => setShowShortcuts(true);
            icon = Keyboard;
            break;
        }
        if (label) items.push({ kind: 'parsed-command', label, icon, action });
      }

      // ── Live search results ──────────────────────────────────────────────
      for (const result of searchResults) {
        items.push({ kind: 'search-result', result, action: () => openResult(result) });
      }

      // ── Fallback: direct shortcuts from registry matching the query ───────
      if (!items.length) {
        const qn = q.toLowerCase();
        const lang = i18n.language;
        for (const def of SHORTCUT_REGISTRY) {
          const labelText = t(def.labelKey).toLowerCase();
          const keywords = lang === 'ar' ? (def.keywordsAr ?? []) : (def.keywordsEn ?? []);
          const matches = labelText.includes(qn) || keywords.some((k) => k.toLowerCase().includes(qn));
          if (matches) {
            items.push({
              kind: 'command',
              id: def.id,
              label: t(def.labelKey),
              sublabel: def.keys.length ? def.keys.map((k) => k === 'Ctrl' ? mod : k).join(' + ') : undefined,
              icon: def.icon ?? Command,
              action: () => {
                setOpen(false);
                // Best-effort: navigate based on known IDs
                const navMap: Record<string, string> = {
                  'nav-dashboard': ROUTES.app.dashboard, 'nav-tasks': ROUTES.app.tasks,
                  'nav-calendar': ROUTES.app.calendar, 'nav-chat': ROUTES.app.chat,
                  'nav-focus': ROUTES.app.focus, 'nav-projects': ROUTES.app.projects,
                  'nav-settings': ROUTES.app.settings, 'nav-analytics': ROUTES.app.analytics,
                  'nav-ai': ROUTES.app.ai,
                };
                if (navMap[def.id]) navigate(navMap[def.id]);
                else if (def.id === 'task-new') setTaskModal(true);
                else if (def.id === 'project-new') setProjectModal(true);
              },
            });
          }
        }
      }
    }

    // ── Empty query: show recents + top commands ──────────────────────────
    if (!q) {
      for (const rq of recentSearches.slice(0, 5)) {
        items.push({
          kind: 'recent',
          query: rq,
          action: () => {
            setOpen(false);
            navigate(`${ROUTES.app.search}?q=${encodeURIComponent(rq)}`);
          },
        });
      }
      // Always-visible quick commands
      const quickCommands: PaletteItem[] = [
        { kind: 'command', id: 'task-new', label: t('shortcuts.newTask'), icon: CheckSquare, action: () => { setOpen(false); setTaskModal(true); } },
        { kind: 'command', id: 'project-new', label: t('shortcuts.newProject'), icon: FolderKanban, action: () => { setOpen(false); setProjectModal(true); } },
        { kind: 'command', id: 'nav-focus', label: t('nav.focus'), icon: Zap, action: () => { setOpen(false); navigate(ROUTES.app.focus); } },
        { kind: 'command', id: 'nav-calendar', label: t('nav.calendar'), icon: Calendar, action: () => { setOpen(false); navigate(ROUTES.app.calendar); } },
        { kind: 'command', id: 'shortcuts-help', label: t('shortcuts.showHelp'), icon: Keyboard, action: () => setShowShortcuts(true) },
      ];
      items.push(...quickCommands);
    }

    return items;
  }, [query, searchResults, recentSearches, t, navigate, setOpen, setTaskModal, setProjectModal, openResult, logout, setTheme, setEffects3d, effects3d, markAllRead, i18n, mod]);

  const items = useMemo(() => buildItems(), [buildItems]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault(); setActiveIdx(0);
      } else if (e.key === 'End') {
        e.preventDefault(); setActiveIdx(items.length - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[activeIdx];
        if (item) item.action();
      }
    },
    [items, activeIdx, setOpen],
  );

  // Reset active idx when items change
  useEffect(() => { setActiveIdx(0); }, [items.length]);

  // Scroll active item into view
  useEffect(() => {
    const li = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    li?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const getItemId = (idx: number) => `${listboxId}-item-${idx}`;

  const renderItem = (item: PaletteItem, idx: number) => {
    const isActive = idx === activeIdx;
    const base = cn(
      'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-start transition',
      isActive ? 'bg-accent/15 text-fg' : 'text-fg hover:bg-surface-2',
    );

    if (item.kind === 'search-result') {
      const Icon = CATEGORY_ICONS[item.result.category];
      return (
        <li
          key={item.result.id}
          id={getItemId(idx)}
          role="option"
          aria-selected={isActive}
          className={base}
          onMouseEnter={() => setActiveIdx(idx)}
          onMouseDown={(e) => { e.preventDefault(); item.action(); }}
        >
          <Icon className="size-4 shrink-0 text-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <Highlight text={item.result.title} ranges={item.result.titleRanges} className="block truncate text-sm" />
            {item.result.subtitle && (
              <Highlight text={item.result.subtitle} ranges={item.result.subtitleRanges} className="block truncate text-xs text-muted" />
            )}
          </div>
          <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted capitalize">
            {t(`search.categories.${item.result.category}`)}
          </span>
        </li>
      );
    }

    if (item.kind === 'recent') {
      return (
        <li
          key={`recent-${item.query}`}
          id={getItemId(idx)}
          role="option"
          aria-selected={isActive}
          className={base}
          onMouseEnter={() => setActiveIdx(idx)}
          onMouseDown={(e) => { e.preventDefault(); item.action(); }}
        >
          <Clock className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="flex-1 truncate text-sm">{item.query}</span>
        </li>
      );
    }

    // command or parsed-command
    const Icon = item.kind === 'command' || item.kind === 'parsed-command' ? (item.icon ?? Command) : Command;
    const sublabel = item.kind === 'command' ? item.sublabel : undefined;
    return (
      <li
        key={item.kind === 'command' ? item.id : item.label}
        id={getItemId(idx)}
        role="option"
        aria-selected={isActive}
        className={base}
        onMouseEnter={() => setActiveIdx(idx)}
        onMouseDown={(e) => { e.preventDefault(); item.action(); }}
      >
        <Icon className="size-4 shrink-0 text-muted" aria-hidden />
        <span className="flex-1 truncate text-sm">{item.label}</span>
        {sublabel && (
          <kbd className="hidden shrink-0 rounded border px-1 font-mono text-[11px] text-muted sm:inline" dir="ltr">
            {sublabel}
          </kbd>
        )}
        {item.kind === 'parsed-command' && (
          <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
            {t('cmd.run')}
          </span>
        )}
      </li>
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

      <AnimatePresence>
        <motion.div
          key="palette"
          variants={presets.modal}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="glass relative z-10 w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label={t('cmd.paletteLabel')}
        >
          {showShortcuts ? (
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">{t('shortcuts.title')}</h2>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(false)}
                  className="grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                  aria-label={t('common.close')}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <ShortcutsHelp />
            </div>
          ) : (
            <>
              {/* Search input */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Search className="size-4 shrink-0 text-muted" aria-hidden />
                <input
                  ref={inputRef}
                  id={inputId}
                  type="text"
                  role="combobox"
                  aria-expanded={items.length > 0}
                  aria-controls={listboxId}
                  aria-activedescendant={items.length > 0 ? getItemId(activeIdx) : undefined}
                  aria-autocomplete="list"
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t('cmd.placeholder')}
                  data-search-input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                />
                {loading && (
                  <div className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-label={t('common.loading') ?? 'Loading'} />
                )}
                <kbd className="hidden rounded border px-1.5 font-mono text-[11px] text-muted sm:inline" dir="ltr">
                  Esc
                </kbd>
              </div>

              {/* Results list */}
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-label={t('cmd.resultsLabel')}
                className="max-h-[420px] overflow-y-auto p-2"
                aria-live="polite"
                aria-busy={loading}
              >
                {items.length === 0 && query && !loading && (
                  <li className="px-3 py-8 text-center text-sm text-muted" role="presentation">
                    {t('cmd.noResults')}
                  </li>
                )}
                {items.map((item, idx) => renderItem(item, idx))}
              </ul>

              {/* Footer */}
              <div className="flex items-center justify-between border-t px-4 py-2">
                <span className="text-[11px] text-muted">
                  ↑↓ {t('cmd.navigate')} · Enter {t('cmd.select')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(true)}
                  className="flex items-center gap-1 text-[11px] text-muted hover:text-fg"
                >
                  <Keyboard className="size-3" aria-hidden />
                  {t('shortcuts.showHelp')}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
