import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Field } from '@/components/ui/Field';
import { ROUTES } from '@/constants/routes';
import { forgotSchema, type ForgotForm } from '@/schemas/auth';
import { authService } from '@/services/authService';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const submit = async ({ email }: ForgotForm) => {
    await authService.requestPasswordReset(email);
    setSentTo(email);
  };

  return (
    <AuthShell
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      footer={
        <Link to={ROUTES.login} className="font-medium text-accent hover:underline">
          {t('auth.backToSignIn')}
        </Link>
      }
    >
      {sentTo ? (
        <div role="status" className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent">
            <MailCheck className="size-6" aria-hidden />
          </span>
          <p className="mt-4 font-medium">{t('auth.forgot.sentTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('auth.forgot.sentBody', { email: sentTo })}</p>
          {/* Mock mode has no inbox, so the demo links straight to the reset screen. */}
          <ButtonLink to={ROUTES.resetPassword} variant="primary" className="mt-5 w-full">
            {t('auth.forgot.openReset')}
          </ButtonLink>
          <p className="mt-2 text-xs text-muted">{t('auth.forgot.mockHint')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          <Field
            label={t('common.email')}
            type="email"
            dir="ltr"
            autoComplete="email"
            error={errors.email?.message ? t(errors.email.message) : undefined}
            {...register('email')}
          />
          <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
            {t('auth.forgot.submit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
