import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import { DEMO_ACCOUNTS } from '@/data/users';
import { useAuthStore } from '@/store/authStore';

/** Only same-site paths are honored, so the redirect param can't send users elsewhere. */
const safeRedirect = (value: string | null): string =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : ROUTES.app.dashboard;

/**
 * Phase 1 stand-in for the full authentication screens (built in phase 3 with
 * React Hook Form + Zod). It already talks to the real authService and store.
 */
export default function DevSignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session, status, error, login, enterDemo, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const target = safeRedirect(params.get('redirect'));
  const loading = status === 'loading';

  if (session) {
    return <Navigate to={target} replace />;
  }

  const signIn = async (credentials: { email: string; password: string }) => {
    if (await login(credentials)) navigate(target, { replace: true });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void signIn({ email, password });
  };

  const onExploreDemo = async () => {
    if (await enterDemo()) navigate(target, { replace: true });
  };

  return (
    <main className="bg-ambient grid min-h-dvh place-items-center px-6 py-10">
      <div className="w-full max-w-md space-y-5">
        <Card title={t('login.title')} description={t('login.subtitle')}>
          {params.get('reason') === 'expired' && (
            <p role="status" className="mb-4 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
              {t('login.expired')}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                {t('login.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                dir="ltr"
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                className="h-10 w-full rounded-xl border bg-surface-2/60 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  dir="ltr"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  className="h-10 w-full rounded-xl border bg-surface-2/60 ps-3 pe-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                  className="absolute inset-y-0 end-0 grid w-10 place-items-center text-muted hover:text-fg"
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {t(`errors.auth.${error}`)}
              </p>
            )}

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              {t('login.submit')}
            </Button>
          </form>

          <div className="mt-5 border-t pt-5">
            <Button variant="secondary" className="w-full" disabled={loading} onClick={() => void onExploreDemo()}>
              {t('login.exploreDemo')}
            </Button>
            <p className="mt-2 text-center text-xs text-muted">{t('login.exploreDemoHint')}</p>
          </div>
        </Card>

        <Card title={t('login.demoCredentials')} description={t('login.demoNotice')}>
          <ul className="space-y-3">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm">
                    <Badge tone="accent">{t(`roles.${account.role}`)}</Badge>
                  </p>
                  <p className="mt-1 text-xs text-muted" dir="ltr">
                    {account.email} · {account.password}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void signIn({ email: account.email, password: account.password })}
                >
                  {t('login.useAccount')} {t(`roles.${account.role}`)}
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <p className="text-center text-sm">
          <Link to={ROUTES.home} className="text-muted hover:text-fg">
            {t('common.backHome')}
          </Link>
        </p>
      </div>
    </main>
  );
}
