import type { LucideIcon } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import type { Permission } from '@/constants/permissions';

/** OS-aware modifier label (returned at runtime). */
export function modKey(): string {
  return typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? '⌘' : 'Ctrl';
}

export interface ShortcutGroup {
  id: string;
  labelKey: string;
}

export interface ShortcutDef {
  /** Unique identifier */
  id: string;
  /** i18n key for label */
  labelKey: string;
  /** i18n key for group */
  groupId: string;
  /** Display key sequence e.g. ["N"] or ["Ctrl", "K"] */
  keys: string[];
  /** For single-key shortcuts, disabled when singleKeyShortcutsEnabled = false */
  isSingleKey: boolean;
  /** Optional permission gate (hides in palette + disabled) */
  permission?: Permission;
  /** Optional icon */
  icon?: LucideIcon;
  /** Arabic keyword aliases */
  keywordsAr?: string[];
  /** English keyword aliases */
  keywordsEn?: string[];
}

/** Run context passed to command actions. */
export interface CommandContext {
  navigate: NavigateFunction;
  setTaskModal: (open: boolean) => void;
  setProjectModal: (open: boolean) => void;
  setCommandPalette: (open: boolean) => void;
  logout: () => Promise<void>;
  setTheme: (theme: string) => void;
  setEffects3d: (enabled: boolean) => void;
  markAllRead: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;
}

export type CommandAction = (ctx: CommandContext) => void;

export interface CommandDef extends ShortcutDef {
  action: CommandAction;
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  { id: 'navigation', labelKey: 'shortcuts.groups.navigation' },
  { id: 'tasks', labelKey: 'shortcuts.groups.tasks' },
  { id: 'interface', labelKey: 'shortcuts.groups.interface' },
  { id: 'palette', labelKey: 'shortcuts.groups.palette' },
];

/** Centralized registry of all keyboard shortcuts.
 * The `action` field is resolved at runtime in useKeyboardShortcuts. */
export const SHORTCUT_REGISTRY: Omit<CommandDef, 'action'>[] = [
  // Navigation
  { id: 'nav-dashboard',  labelKey: 'shortcuts.navDashboard',  groupId: 'navigation', keys: ['G', 'D'], isSingleKey: false, keywordsEn: ['dashboard', 'home'], keywordsAr: ['لوحة', 'الرئيسية'] },
  { id: 'nav-tasks',      labelKey: 'shortcuts.navTasks',      groupId: 'navigation', keys: ['G', 'T'], isSingleKey: false, keywordsEn: ['tasks', 'my tasks'], keywordsAr: ['مهام'] },
  { id: 'nav-calendar',   labelKey: 'shortcuts.navCalendar',   groupId: 'navigation', keys: ['C'],      isSingleKey: true,  keywordsEn: ['calendar', 'schedule'], keywordsAr: ['تقويم', 'جدول'] },
  { id: 'nav-chat',       labelKey: 'shortcuts.navChat',       groupId: 'navigation', keys: ['G'],      isSingleKey: true,  keywordsEn: ['chat', 'channel'], keywordsAr: ['دردشة', 'قناة'] },
  { id: 'nav-focus',      labelKey: 'shortcuts.navFocus',      groupId: 'navigation', keys: ['F'],      isSingleKey: true,  keywordsEn: ['focus', 'pomodoro', 'timer'], keywordsAr: ['تركيز', 'مؤقت'] },
  { id: 'nav-projects',   labelKey: 'shortcuts.navProjects',   groupId: 'navigation', keys: ['G', 'P'], isSingleKey: false, keywordsEn: ['projects', 'project list'], keywordsAr: ['مشاريع'] },
  { id: 'nav-settings',   labelKey: 'shortcuts.navSettings',   groupId: 'navigation', keys: ['G', 'S'], isSingleKey: false, keywordsEn: ['settings', 'preferences'], keywordsAr: ['إعدادات'] },
  { id: 'nav-analytics',  labelKey: 'shortcuts.navAnalytics',  groupId: 'navigation', keys: ['G', 'A'], isSingleKey: false, keywordsEn: ['analytics', 'stats', 'reports'], keywordsAr: ['تحليلات', 'إحصاء'] },
  { id: 'nav-ai',         labelKey: 'shortcuts.navAi',         groupId: 'navigation', keys: ['G', 'I'], isSingleKey: false, keywordsEn: ['ai', 'assistant', 'chat gpt'], keywordsAr: ['ذكاء', 'مساعد'] },
  // Tasks
  { id: 'task-new',      labelKey: 'shortcuts.newTask',        groupId: 'tasks',      keys: ['N'],      isSingleKey: true,  keywordsEn: ['new task', 'create task', 'add task'], keywordsAr: ['مهمة جديدة', 'إنشاء مهمة'] },
  { id: 'project-new',   labelKey: 'shortcuts.newProject',     groupId: 'tasks',      keys: ['P'],      isSingleKey: true,  keywordsEn: ['new project', 'create project'], keywordsAr: ['مشروع جديد', 'إنشاء مشروع'] },
  // Interface
  { id: 'search-focus',  labelKey: 'shortcuts.focusSearch',    groupId: 'interface',  keys: ['/'],      isSingleKey: true,  keywordsEn: ['search', 'find'], keywordsAr: ['بحث'] },
  { id: 'palette-open',  labelKey: 'shortcuts.openPalette',    groupId: 'palette',    keys: ['Ctrl', 'K'], isSingleKey: false, keywordsEn: ['command palette', 'commands'], keywordsAr: ['لوحة الأوامر', 'أوامر'] },
  { id: 'shortcuts-help',labelKey: 'shortcuts.showHelp',       groupId: 'interface',  keys: ['?'],      isSingleKey: true,  keywordsEn: ['help', 'shortcuts', 'keyboard'], keywordsAr: ['مساعدة', 'اختصارات'] },
  { id: 'logout',        labelKey: 'shortcuts.logout',         groupId: 'interface',  keys: [],         isSingleKey: false, keywordsEn: ['logout', 'sign out'], keywordsAr: ['خروج', 'تسجيل الخروج'] },
  { id: 'theme-toggle',  labelKey: 'shortcuts.toggleTheme',    groupId: 'interface',  keys: [],         isSingleKey: false, keywordsEn: ['theme', 'dark', 'light', 'midnight'], keywordsAr: ['سمة', 'مظهر', 'وضع'] },
  { id: 'toggle-3d',     labelKey: 'shortcuts.toggle3d',       groupId: 'interface',  keys: [],         isSingleKey: false, keywordsEn: ['3d', 'effects', 'toggle 3d'], keywordsAr: ['ثلاثي الأبعاد', 'تأثيرات'] },
  { id: 'lang-ar',       labelKey: 'shortcuts.switchArabic',   groupId: 'interface',  keys: [],         isSingleKey: false, keywordsEn: ['arabic', 'switch language ar'], keywordsAr: ['عربي', 'تغيير اللغة'] },
  { id: 'lang-en',       labelKey: 'shortcuts.switchEnglish',  groupId: 'interface',  keys: [],         isSingleKey: false, keywordsEn: ['english', 'switch language en'], keywordsAr: ['إنجليزي', 'اللغة الإنجليزية'] },
  { id: 'mark-read',     labelKey: 'shortcuts.markAllRead',    groupId: 'interface',  keys: [],         isSingleKey: false, keywordsEn: ['mark all read', 'notifications'], keywordsAr: ['تحديد كمقروء', 'إشعارات'] },
];
