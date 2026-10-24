import {
  BarChart3, Bot, CalendarDays, CheckSquare, FolderKanban, FolderOpen, Home, KanbanSquare, MessageCircle,
  MessagesSquare, Bell, Sun, CalendarClock, Timer, type LucideIcon,
} from 'lucide-react';
import { ROUTES } from './routes';

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

/** Sidebar order follows the product spec. */
export const PRIMARY_NAV: NavItem[] = [
  { to: ROUTES.app.dashboard, labelKey: 'nav.dashboard', icon: Home },
  { to: ROUTES.app.tasks, labelKey: 'nav.myTasks', icon: CheckSquare },
  { to: ROUTES.app.today, labelKey: 'nav.today', icon: Sun },
  { to: ROUTES.app.upcoming, labelKey: 'nav.upcoming', icon: CalendarClock },
  { to: ROUTES.app.calendar, labelKey: 'nav.calendar', icon: CalendarDays },
  { to: ROUTES.app.kanban, labelKey: 'nav.kanban', icon: KanbanSquare },
  { to: ROUTES.app.projects, labelKey: 'nav.projects', icon: FolderKanban },
  { to: ROUTES.app.focus, labelKey: 'nav.focus', icon: Timer },
  { to: ROUTES.app.chat, labelKey: 'nav.chat', icon: MessageCircle },
  { to: ROUTES.app.messages, labelKey: 'nav.messages', icon: MessagesSquare },
  { to: ROUTES.app.files, labelKey: 'nav.files', icon: FolderOpen },
  { to: ROUTES.app.notifications, labelKey: 'nav.notifications', icon: Bell },
  { to: ROUTES.app.analytics, labelKey: 'nav.analytics', icon: BarChart3 },
  { to: ROUTES.app.ai, labelKey: 'nav.ai', icon: Bot },
];

/** Bottom bar on phones: Home, Tasks, Calendar, Chat, Profile. */
export const MOBILE_NAV: NavItem[] = [
  { to: ROUTES.app.dashboard, labelKey: 'nav.home', icon: Home },
  { to: ROUTES.app.tasks, labelKey: 'nav.tasks', icon: CheckSquare },
  { to: ROUTES.app.calendar, labelKey: 'nav.calendar', icon: CalendarDays },
  { to: ROUTES.app.chat, labelKey: 'nav.chat', icon: MessageCircle },
];
