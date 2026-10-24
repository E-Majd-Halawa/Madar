import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PasswordField } from '@/components/ui/PasswordField';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { ROUTES } from '@/constants/routes';
import { resetSchema, type ResetForm } from '@/schemas/auth';
import { delay } from '@/api/mock/delay';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema), mode: 'onTouched' });

  // Mock: a real backend would validate the emailed reset token here.
  const submit = async () => {
    await delay(500);
    setDone(true);
  };

  return (
    <AuthShell
      title={t('auth.reset.title')}
      subtitle={t('auth.reset.subtitle')}
      footer={
        <Link to={ROUTES.login} className="font-medium text-accent hover:underline">
          {t('auth.backToSignIn')}
        </Link>
      }
    >
      {done ? (
        <div role="status" className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 className="size-6" aria-hidden />
          </span>
          <p className="mt-4 font-medium">{t('auth.reset.doneTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('auth.reset.doneBody')}</p>
          <ButtonLink to={ROUTES.login} variant="primary" className="mt-5 w-full">
            {t('common.signIn')}
          </ButtonLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          <div>
            <PasswordField
              label={t('auth.reset.newPassword')}
              autoComplete="new-password"
              error={errors.password?.message ? t(errors.password.message) : undefined}
              {...register('password')}
            />
            <PasswordStrength value={watch('password') ?? ''} />
          </div>
          <PasswordField
            label={t('auth.fields.confirmPassword')}
            autoComplete="new-password"
            error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined}
            {...register('confirmPassword')}
          />
          <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
            {t('auth.reset.submit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
