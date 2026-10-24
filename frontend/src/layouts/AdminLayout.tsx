import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Users, Building2, CheckSquare, FolderKanban, 
  MessageSquare, ShieldAlert, BarChart3, FileText, Lock, Settings, 
  ArrowLeft, Menu, X, Shield 
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { HeaderControls } from '@/components/layout/HeaderControls';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore, selectRole } from '@/store/authStore';
import { hasRole } from '@/utils/permissions';
import type { Role } from '@/types';

export function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.session?.user);
  const role = useAuthStore(selectRole);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{
    label: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
    minRole?: Role;
  }> = [
    { label: t('admin.nav.overview', 'Overview'), to: ROUTES.admin.root, icon: LayoutDashboard, exact: true },
    { label: t('admin.nav.users', 'Users'), to: ROUTES.admin.users, icon: Users },
    { label: t('admin.nav.workspaces', 'Workspaces'), to: ROUTES.admin.workspaces, icon: Building2 },
    { label: t('admin.nav.tasks', 'Tasks'), to: ROUTES.admin.tasks, icon: CheckSquare },
    { label: t('admin.nav.projects', 'Projects'), to: ROUTES.admin.projects, icon: FolderKanban },
    { label: t('admin.nav.messages', 'Messages'), to: ROUTES.admin.messages, icon: MessageSquare, minRole: 'moderator' },
    { label: t('admin.nav.reports', 'Reports'), to: ROUTES.admin.reports, icon: ShieldAlert, minRole: 'moderator' },
    { label: t('admin.nav.analytics', 'Analytics'), to: ROUTES.admin.analytics, icon: BarChart3 },
    { label: t('admin.nav.logs', 'Audit Logs'), to: ROUTES.admin.logs, icon: FileText },
    { label: t('admin.nav.security', 'Security'), to: ROUTES.admin.security, icon: Lock },
    { label: t('admin.nav.settings', 'System Settings'), to: ROUTES.admin.settings, icon: Settings, minRole: 'super_admin' },
  ];

  const visibleNav = navItems.filter((item) => !item.minRole || hasRole(role, item.minRole));
  const activeNav = navItems.find((item) => item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to));
  const pageTitle = activeNav ? activeNav.label : t('admin.title', 'Admin Suite');

  return (
    <div className="bg-bg h-dvh overflow-hidden flex flex-col lg:flex-row text-fg">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-surface shrink-0 z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
            aria-label={t('common.menu', 'Menu')}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span className="font-bold text-base flex items-center gap-1.5">
            <Shield className="size-4 text-accent" /> {pageTitle}
          </span>
        </div>
        <HeaderControls />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside className={`
        fixed lg:static inset-y-0 start-0 z-50 w-64 bg-surface border-e border-border flex flex-col shrink-0 h-dvh
        transition-transform duration-200 lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0'}
      `}>
        <Link to={ROUTES.admin.root} aria-label={t('brand.adminHomeLabel', { brand: t('app.name') })} className="h-14 px-5 border-b border-border flex items-center gap-2.5 shrink-0 hover:bg-surface-2/50 transition">
          <div className="size-8 rounded-xl bg-accent/20 text-accent grid place-items-center font-bold">
            <Shield className="size-4" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm leading-tight text-fg">{t('admin.title', 'Admin Suite')}</h1>
            <p className="text-[11px] text-muted capitalize">{t(`roles.${role || 'user'}`, { defaultValue: role?.replace('_', ' ') })}</p>
          </div>
        </Link>

        <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition
                  ${isActive 
                    ? 'bg-accent text-accent-fg shadow-sm font-semibold' 
                    : 'text-muted hover:bg-surface-2 hover:text-fg'
                  }
                `}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border shrink-0 space-y-2">
          <Link
            to={ROUTES.app.dashboard}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg transition"
          >
            <ArrowLeft className="size-4 shrink-0 rtl:rotate-180" />
            <span>{t('admin.nav.backToApp', 'Back to app')}</span>
          </Link>
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 bg-surface-2/50 rounded-xl">
              <Avatar name={user.fullName} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-fg truncate">{user.fullName}</p>
                <p className="text-[11px] text-muted truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-dvh overflow-hidden">
        <header className="hidden lg:flex h-14 items-center justify-between px-6 border-b border-border bg-surface shrink-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-fg uppercase tracking-wider">
              {pageTitle}
            </span>
            {role && <Badge tone="accent" className="capitalize text-[11px] py-0.5 px-2">{t(`roles.${role}`, { defaultValue: role?.replace('_', ' ') })}</Badge>}
          </div>
          <HeaderControls />
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
