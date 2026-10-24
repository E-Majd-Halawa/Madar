import { Database } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { userService } from '@/services/userService';
import { workspaceService } from '@/services/workspaceService';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

interface ProbeResult {
  total: number;
  users: User[];
  workspaceCount: number | null;
}

export function ServiceProbeCard() {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [result, setResult] = useState<ProbeResult | null>(null);

  const load = async () => {
    setState('loading');
    try {
      const [page, workspaces] = await Promise.all([
        userService.list({ pageSize: 5 }),
        userId ? workspaceService.listForUser(userId) : Promise.resolve(null),
      ]);
      setResult({ total: page.total, users: page.items, workspaceCount: workspaces?.length ?? null });
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <Card
      title={t('foundation.services')}
      description={t('foundation.servicesHint')}
      icon={<Database className="size-5" aria-hidden />}
    >
      <Button variant="secondary" loading={state === 'loading'} onClick={() => void load()}>
        {t('foundation.loadData')}
      </Button>

      {state === 'error' && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {t('foundation.loadFailed')}
        </p>
      )}

      {result && state !== 'error' && (
        <div className="mt-4 space-y-2 text-sm" aria-live="polite">
          <p>{t('foundation.dataLoaded', { total: result.total, shown: result.users.length })}</p>
          <ul className="text-muted">
            {result.users.map((user) => (
              <li key={user.id}>{user.fullName}</li>
            ))}
          </ul>
          {result.workspaceCount !== null && (
            <p>{t('foundation.workspacesLoaded', { count: result.workspaceCount })}</p>
          )}
        </div>
      )}
    </Card>
  );
}
