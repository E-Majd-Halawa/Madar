import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { ROUTES } from '@/constants/routes';
import { registerSchema, type RegisterForm } from '@/schemas/auth';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, status, error, register: signUp, clearError } = useAuthStore();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false },
    mode: 'onTouched',
  });

  if (session && status !== 'loading') return <Navigate to={ROUTES.onboarding} replace />;

  const submit = async (v: RegisterForm) => {
    const ok = await signUp({ fullName: v.fullName, username: v.username, email: v.email, password: v.password });
    if (ok) {
      toast.success(t('auth.register.success'));
      navigate(ROUTES.onboarding, { replace: true });
    }
  };
  const err = (key?: string) => (key ? t(key) : undefined);
  const serverError =
    error === 'email_taken' || error === 'username_taken' ? t(`errors.auth.${error}`) : error ? t(`errors.auth.${error}`) : null;

  return (
    <AuthShell
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          {t('auth.register.haveAccount')}{' '}
          <Link to={ROUTES.login} className="font-medium text-accent hover:underline">
            {t('common.signIn')}
          </Link>
        </>
      }
    >
      <SocialButtons />
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <Field label={t('auth.fields.fullName')} autoComplete="name" error={err(errors.fullName?.message)} {...register('fullName')} />
        <Field
          label={t('auth.fields.username')}
          autoComplete="username"
          dir="ltr"
          error={err(errors.username?.message)}
          {...register('username', { onChange: clearError })}
        />
        <Field
          label={t('common.email')}
          type="email"
          dir="ltr"
          autoComplete="email"
          error={err(errors.email?.message)}
          {...register('email', { onChange: clearError })}
        />
        <div>
          <PasswordField label={t('common.password')} autoComplete="new-password" error={err(errors.password?.message)} {...register('password')} />
          <PasswordStrength value={watch('password') ?? ''} />
        </div>
        <PasswordField
          label={t('auth.fields.confirmPassword')}
          autoComplete="new-password"
          error={err(errors.confirmPassword?.message)}
          {...register('confirmPassword')}
        />
        <div>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-[rgb(var(--accent))]" {...register('terms')} />
            <span>{t('auth.register.terms')}</span>
          </label>
          {errors.terms?.message && (
            <p role="alert" className="mt-1.5 text-xs text-danger">
              {t(errors.terms.message)}
            </p>
          )}
        </div>
        {serverError && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {serverError}
          </p>
        )}
        <Button type="submit" variant="primary" className="w-full" loading={status === 'loading'}>
          {t('auth.register.submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
