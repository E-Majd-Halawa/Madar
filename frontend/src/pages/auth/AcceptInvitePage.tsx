import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import { httpMemberService } from '@/api/adapters/http/httpMemberService';
import { HttpError } from '@/api/adapters/http/httpClient';
import { useAuthStore, selectUser } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { toast } from '@/store/toastStore';

const PENDING_KEY = 'pendingInviteToken';

export default function AcceptInvitePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore(selectUser);
  const isHttpMode = Boolean(import.meta.env.VITE_API_URL);

  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = params.get('token');
    if (fromUrl) {
      try {
        window.sessionStorage.setItem(PENDING_KEY, fromUrl);
      } catch {
        /* ignore storage errors */
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
      setToken(fromUrl);
      return;
    }

    let saved: string | null = null;
    try {
      saved = window.sessionStorage.getItem(PENDING_KEY);
    } catch {
      saved = null;
    }
    setToken(saved);
  }, [params]);

  useEffect(() => {
    if (!isHttpMode || !session || !token || status !== 'idle') return;

    let cancelled = false;
    setStatus('accepting');
    httpMemberService
      .acceptInvitation(token)
      .then(async (workspace) => {
        if (cancelled) return;
        const userId = user?.id;
        if (userId) {
          const wsStore = useWorkspaceStore.getState();
          await wsStore.load(userId);
          wsStore.setActive(workspace.id);
        }
        try {
          window.sessionStorage.removeItem(PENDING_KEY);
        } catch {
          /* ignore */
        }
        setStatus('done');
        toast.success(t('acceptInvite.accepted', 'Invitation accepted'));
        navigate(ROUTES.app.dashboard, { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        const code = err instanceof HttpError ? err.code : undefined;
        const message =
          code === 'invitation_not_found'
            ? t('errors.invitation.notFound', 'This invitation was not found.')
            : code === 'invitation_expired'
              ? t('errors.invitation.expired', 'This invitation has expired.')
              : code === 'invitation_email_mismatch'
                ? t('errors.invitation.emailMismatch', 'This invitation was sent to a different email address.')
              : err instanceof Error
                ? err.message
                : t('errors.unknown', 'Something went wrong.');
        setErrorMessage(message);
      });

    return () => {
      cancelled = true;
    };
  }, [isHttpMode, session, token, status, user?.id, navigate, t]);

  if (!isHttpMode) {
    return (
      <AuthShell
        title={t('acceptInvite.title', 'Accept invitation')}
        subtitle={t('acceptInvite.requiresBackend', 'Invitations require the real backend.')}
      >
        <p className="text-sm text-muted">
          {t(
            'acceptInvite.requiresBackendBody',
            'Set VITE_API_URL to your API base URL and reload this page.',
          )}
        </p>
      </AuthShell>
    );
  }

  if (session && status === 'accepting') {
    return (
      <AuthShell
        title={t('acceptInvite.title', 'Accept invitation')}
        subtitle={t('acceptInvite.accepting', 'Accepting your invitationâ€¦')}
      >
        <p className="text-sm text-muted">{t('common.loading', 'Loading')}</p>
      </AuthShell>
    );
  }

  if (session && status === 'error' && errorMessage) {
    return (
      <AuthShell
        title={t('acceptInvite.title', 'Accept invitation')}
        subtitle={t('acceptInvite.failed', 'We could not accept this invitation.')}
      >
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => navigate(ROUTES.app.dashboard, { replace: true })}>
            {t('acceptInvite.goToDashboard', 'Go to dashboard')}
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (session && !token) {
    return <Navigate to={ROUTES.app.dashboard} replace />;
  }

  if (!session) {
    return (
      <AuthShell
        title={t('acceptInvite.title', 'Accept invitation')}
        subtitle={t('acceptInvite.signInPrompt', 'Sign in or create an account to accept this invitation.')}
      >
        <div className="flex flex-col gap-3">
          <Link
            to={`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.acceptInvite)}`}
            className="block"
          >
            <Button variant="primary" className="w-full">
              {t('auth.login.submit', 'Sign in')}
            </Button>
          </Link>
          <Link
            to={`${ROUTES.register}?redirect=${encodeURIComponent(ROUTES.acceptInvite)}`}
            className="block"
          >
            <Button variant="secondary" className="w-full">
              {t('auth.register.submit', 'Create account')}
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('acceptInvite.title', 'Accept invitation')}
      subtitle={t('acceptInvite.accepting', 'Accepting your invitationâ€¦')}
    >
      <p className="text-sm text-muted">{t('common.loading', 'Loading')}</p>
    </AuthShell>
  );
}
