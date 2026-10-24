import { Check, KeyRound, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { ALL_PERMISSIONS, ROLE_ORDER, ROLE_PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/utils/cn';

export function PermissionMatrixCard() {
  const { t } = useTranslation();
  const { role: currentRole } = usePermission();

  return (
    <Card
      title={t('foundation.rbac')}
      description={t('foundation.rbacHint')}
      icon={<KeyRound className="size-5" aria-hidden />}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="text-start text-xs text-muted">
              <th scope="col" className="py-2 pe-4 text-start font-medium">
                {t('foundation.permission')}
              </th>
              {ROLE_ORDER.map((role) => (
                <th
                  key={role}
                  scope="col"
                  className={cn('px-3 py-2 text-center font-medium', role === currentRole && 'text-accent')}
                >
                  {t(`roles.${role}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((permission) => (
              <tr key={permission} className="border-t">
                <th scope="row" className="py-2.5 pe-4 text-start font-normal">
                  {t(`permissions.${permission}`)}
                </th>
                {ROLE_ORDER.map((role) => {
                  const allowed = ROLE_PERMISSIONS[role].has(permission);
                  return (
                    <td key={role} className={cn('px-3 py-2.5 text-center', role === currentRole && 'bg-accent/10')}>
                      {allowed ? (
                        <Check className="mx-auto size-4 text-accent" aria-hidden />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted/50" aria-hidden />
                      )}
                      <span className="sr-only">{allowed ? t('foundation.allowed') : t('foundation.notAllowed')}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
