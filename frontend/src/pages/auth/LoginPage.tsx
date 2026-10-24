import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';
import { ROUTES } from '@/constants/routes';
import { DEMO_ACCOUNTS } from '@/data/users';
import { loginSchema, type LoginForm } from '@/schemas/auth';
import { useAuthStore } from '@/store/authStore';
import { safeRedirect } from '@/utils/redirect';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session, status, error, login, clearError } = useAuthStore();
  const target = safeRedirect(params.get('redirect'));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { remember: true } });

  if (session) return <Navigate to={target} replace />;

  const loading = status === 'loading';
  const submit = async (values: LoginForm) => {
    if (await login({ email: values.email, password: values.password }, values.remember ?? false)) {
      navigate(target, { replace: true });
    }
  };
  const fillDemo = (email: string, password: string) => {
    clearError();
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };
  const err = (key?: string) => (key ? t(key) : undefined);

  return (
    <AuthShell
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link to={ROUTES.register} className="font-medium text-accent hover:underline">
            {t('auth.register.title')}
          </Link>
        </>
      }
    >
      {params.get('reason') === 'expired' && (
        <p role="status" className="mb-4 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
          {t('login.expired')}
        </p>
      )}
      <SocialButtons />
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <Field
          label={t('common.email')}
          type="email"
          dir="ltr"
          autoComplete="email"
          error={err(errors.email?.message)}
          {...register('email', { onChange: clearError })}
        />
        <PasswordField
          label={t('common.password')}
          autoComplete="current-password"
          error={err(errors.password?.message)}
          {...register('password', { onChange: clearError })}
        />
        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-[rgb(var(--accent))]" {...register('remember')} />
            {t('auth.login.remember')}
          </label>
          <Link to={ROUTES.forgotPassword} className="text-sm text-accent hover:underline">
            {t('auth.login.forgot')}
          </Link>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {t(`errors.auth.${error}`)}
          </p>
        )}
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          {t('auth.login.submit')}
        </Button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-6 rounded-xl border border-dashed p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{t('login.demoCredentials')}</p>
            <Badge tone="warning">{t('auth.login.demoOnly')}</Badge>
          </div>
          <ul className="mt-3 space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-3">
                <span className="min-w-0 text-xs text-muted" dir="ltr">
                  <span className="block truncate text-fg">{a.email}</span>
                  {a.password}
                </span>
                <Button size="sm" disabled={loading} onClick={() => fillDemo(a.email, a.password)}>
                  {t(`roles.${a.role}`)}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AuthShell>
  );
}
