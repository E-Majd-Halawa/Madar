import type { ComponentType } from 'react';
import { createBrowserRouter, Outlet, ScrollRestoration } from 'react-router-dom';
import { RequireAuth } from '@/components/guards/RequireAuth';
import { RequireOnboarded } from '@/components/guards/RequireOnboarded';
import { RequireRole } from '@/components/guards/RequireRole';
import { RequireWorkspace } from '@/components/guards/RequireWorkspace';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { ROUTES } from '@/constants/routes';
import { AppLayout } from '@/layouts/AppLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ForbiddenPage } from '@/pages/shared/ForbiddenPage';
import { NotFoundPage } from '@/pages/shared/NotFoundPage';
import type { ComingSoonHandle } from '@/pages/app/ComingSoonPage';
import type { PlaceholderHandle } from '@/pages/shared/PlaceholderPage';
import FilesPage from '@/pages/app/FilesPage';
import ActivityPage from '@/pages/app/ActivityPage';
import MembersPage from '@/pages/app/MembersPage';
import ProfilePage from '@/pages/app/ProfilePage';
import SettingsPage from '@/pages/app/SettingsPage';
import { RouteError } from '@/pages/shared/RouteError';

/** Route-level code splitting: each page is its own chunk. */
const page = (loader: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await loader()).default,
});

const placeholder = page(() => import('@/pages/shared/PlaceholderPage'));

const stub = (path: string, handle: PlaceholderHandle) => ({ path, lazy: placeholder, handle });

const comingSoon = page(() => import('@/pages/app/ComingSoonPage'));
const soon = (path: string, titleKey: string, phase: number) => ({
  path,
  lazy: comingSoon,
  handle: { titleKey, phase } satisfies ComingSoonHandle,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <FullScreenLoader />,
    children: [
      // Public
      { path: ROUTES.home, lazy: page(() => import('@/pages/landing/LandingPage')) },
      { path: ROUTES.pricing, lazy: page(() => import('@/pages/landing/PricingPage')) },
      { path: ROUTES.demo, lazy: page(() => import('@/pages/auth/DemoEntryPage')) },
      ...(import.meta.env.DEV ? [{ path: ROUTES.foundation, lazy: page(() => import('@/pages/landing/FoundationPage')) }] : []),
      { path: ROUTES.login, lazy: page(() => import('@/pages/auth/LoginPage')) },
      { path: ROUTES.register, lazy: page(() => import('@/pages/auth/RegisterPage')) },
      { path: ROUTES.forgotPassword, lazy: page(() => import('@/pages/auth/ForgotPasswordPage')) },
      { path: ROUTES.resetPassword, lazy: page(() => import('@/pages/auth/ResetPasswordPage')) },
      { path: ROUTES.forbidden, element: <ForbiddenPage /> },

      // Signed in
      {
        element: <RequireAuth />,
        children: [
          { path: ROUTES.onboarding, lazy: page(() => import('@/pages/onboarding/OnboardingPage')) },
          {
            element: <RequireOnboarded />,
            children: [
              {
                element: <RequireWorkspace />,
                children: [
                  {
                    element: <AppLayout />,
                    children: [
                      { path: ROUTES.app.dashboard, lazy: page(() => import('@/pages/app/DashboardPage')) },
                      { path: ROUTES.app.tasks, lazy: page(() => import('@/pages/app/TasksPage')) },
                      { path: ROUTES.app.today, lazy: page(() => import('@/pages/app/TodayPage')) },
                      { path: ROUTES.app.upcoming, lazy: page(() => import('@/pages/app/UpcomingPage')) },
                      { path: ROUTES.app.kanban, lazy: page(() => import('@/pages/app/KanbanPage')) },
                      { path: ROUTES.app.calendar, lazy: page(() => import('@/pages/app/CalendarPage')) },
                      { path: ROUTES.app.projects, lazy: page(() => import('@/pages/app/ProjectsPage')) },
                      { path: ROUTES.app.project, lazy: page(() => import('@/pages/app/ProjectDetailPage')) },
                      { path: ROUTES.app.files, element: <FilesPage /> },
                      { path: ROUTES.app.activity, element: <ActivityPage /> },
                      { path: ROUTES.app.members, element: <MembersPage /> },
                      { path: ROUTES.app.chat, lazy: page(() => import('@/pages/app/ChatPage')) },
                      { path: ROUTES.app.messages, lazy: page(() => import('@/pages/app/MessagesPage')) },
                      { path: ROUTES.app.notifications, lazy: page(() => import('@/pages/app/NotificationsPage')) },
                      { path: ROUTES.app.focus, lazy: page(() => import('@/pages/app/FocusPage')) },
                      { path: ROUTES.app.analytics, lazy: page(() => import('@/pages/app/AnalyticsPage')) },
                      { path: ROUTES.app.ai, lazy: page(() => import('@/pages/app/AiPage')) },
                      { path: ROUTES.app.search, lazy: page(() => import('@/pages/app/SearchPage')) },
                      { path: ROUTES.app.profile, lazy: page(() => import('@/pages/app/ProfilePage')) },
                      { path: ROUTES.app.settings, lazy: page(() => import('@/pages/app/SettingsPage')) },
                    ],
                  },
                ],
              },
            ],
          },

          // Admin or higher (Moderator min for layout)
          {
            element: <RequireRole min="moderator" />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { path: ROUTES.admin.root, lazy: page(() => import('@/pages/admin/AdminOverviewPage')) },
                  { path: ROUTES.admin.messages, lazy: page(() => import('@/pages/admin/AdminMessagesPage')) },
                  { path: ROUTES.admin.reports, lazy: page(() => import('@/pages/admin/AdminReportsPage')) },
                  {
                    element: <RequireRole min="admin" />,
                    children: [
                      { path: ROUTES.admin.users, lazy: page(() => import('@/pages/admin/AdminUsersPage')) },
                      { path: ROUTES.admin.workspaces, lazy: page(() => import('@/pages/admin/AdminWorkspacesPage')) },
                      { path: ROUTES.admin.tasks, lazy: page(() => import('@/pages/admin/AdminTasksPage')) },
                      { path: ROUTES.admin.projects, lazy: page(() => import('@/pages/admin/AdminProjectsPage')) },
                      { path: ROUTES.admin.analytics, lazy: page(() => import('@/pages/admin/AdminAnalyticsPage')) },
                      { path: ROUTES.admin.logs, lazy: page(() => import('@/pages/admin/AdminLogsPage')) },
                    ],
                  },
                  {
                    element: <RequireRole min="super_admin" />,
                    children: [
                      { path: ROUTES.admin.security, lazy: page(() => import('@/pages/admin/AdminSecurityPage')) },
                      { path: ROUTES.admin.settings, lazy: page(() => import('@/pages/admin/AdminSettingsPage')) },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
