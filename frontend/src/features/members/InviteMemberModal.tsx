import { useState } from 'react';
import { Copy, Check, Shield, User, Users, Mail, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useMemberStore } from '@/store/memberStore';
import { toast } from '@/store/toastStore';
import type { WorkspaceRole } from '@/types';
import { cn } from '@/utils/cn';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
  const { t } = useTranslation();
  const inviteMember = useMemberStore((s) => s.inviteMember);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
  const [department, setDepartment] = useState('Engineering');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/register?invite=tf3d-ws-demo-${Math.random().toString(36).substring(7)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success(t('members.inviteLinkCopied', 'Invite link copied to clipboard'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error(t('members.validEmailRequired', 'Please enter a valid email address'));
      return;
    }

    setSubmitting(true);
    try {
      await inviteMember(email.trim(), role, department);
      toast.success(t('members.inviteSent', 'Invitation sent to {{email}}', { email }));
      setEmail('');
      onClose();
    } catch {
      toast.error(t('common.error', 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('members.inviteTitle', 'Invite to Workspace')}
      description={t('members.inviteSubtitle', 'Collaborate across 3D dashboards, tasks, and project timelines.')}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <Field label={t('members.emailAddress', 'Email Address')} required>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className={cn(inputClass, 'ps-9')}
            />
          </div>
        </Field>

        {/* Role Selection Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
            {t('members.selectRole', 'Select Permission Role')}
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              {
                key: 'admin' as const,
                label: t('members.roleAdmin', 'Admin'),
                icon: Shield,
                desc: t('members.roleAdminDesc', 'Full management and settings control.'),
              },
              {
                key: 'member' as const,
                label: t('members.roleMember', 'Member'),
                icon: User,
                desc: t('members.roleMemberDesc', 'Can edit tasks, projects, files & chat.'),
              },
              {
                key: 'guest' as const,
                label: t('members.roleGuest', 'Guest'),
                icon: Users,
                desc: t('members.roleGuestDesc', 'Restricted to assigned projects only.'),
              },
            ].map((option) => {
              const Icon = option.icon;
              const selected = role === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRole(option.key)}
                  className={cn(
                    'flex flex-col text-start rounded-xl border p-3 transition',
                    selected
                      ? 'border-accent bg-accent/10 shadow-sm'
                      : 'border-border/15 bg-surface-2/30 hover:border-border/30 hover:bg-surface-2/60',
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className={cn('size-4', selected ? 'text-accent' : 'text-muted')} />
                    {selected && <Check className="size-3.5 text-accent" />}
                  </div>
                  <span className="font-semibold text-sm">{option.label}</span>
                  <span className="mt-0.5 text-[11px] text-muted leading-tight">{option.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Department / Team Field */}
        <Field label={t('members.department', 'Team / Department')}>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={inputClass}
          >
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Product">Product</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
            <option value="General">General</option>
          </select>
        </Field>

        {/* Shareable Invite Link Box */}
        <div className="rounded-xl border bg-surface-2/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-muted">
              <LinkIcon className="size-3.5 text-accent" />
              {t('members.quickInviteLink', 'Or share direct invitation link')}
            </span>
            <span className="text-muted/60">{t('members.expiresIn', 'Expires in 7 days')}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className={cn(inputClass, 'text-xs text-muted truncate')}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 shrink-0"
            >
              {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
              {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
            </Button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? t('common.sending', 'Sending…') : t('members.sendInvite', 'Send Invitation')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
