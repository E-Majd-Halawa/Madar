import { Navigate, Outlet } from 'react-router-dom';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';

/** New accounts finish onboarding before they see the app. */
export function RequireOnboarded() {
  const isDemo = useAuthStore((s) => s.session?.isDemo ?? false);
  const { status, prefs } = usePreferencesStore();
  if (isDemo) return <Outlet />;
  if (status !== 'ready') return <FullScreenLoader />;
  return prefs.onboardingCompleted ? <Outlet /> : <Navigate to={ROUTES.onboarding} replace />;
}
