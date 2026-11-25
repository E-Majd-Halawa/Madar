import { useEffect, useState } from 'react';
import { Check, Loader2, Search, Shield, User, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { workspaceService } from '@/services/workspaceService';
import { useMemberStore } from '@/store/memberStore';
import { toast } from '@/store/toastStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';
import type { CandidateUser } from '@/types/members';
import type { WorkspaceRole } from '@/types';
import { cn } from '@/utils/cn';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
}

/** Adds an existing account to the active workspace by exact username. */
export function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
  const { t } = useTranslation();
  const activeWorkspace = useWorkspaceStore(selectActiveWorkspace);
  const addMember = useMemberStore((s) => s.addMember);

  const [username, setUsername] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
  const [department, setDepartment] = useState('Engineering');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CandidateUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Reset the form whenever the modal is reopened.
  useEffect(() => {
    if (!open) return;
    setUsername('');
    setError(null);
    setResults([]);
    setSearching(false);
    setResultsOpen(false);
    setActiveIndex(-1);
  }, [open]);

  // Live autocomplete, debounced so every keystroke does not hit the API.
  useEffect(() => {
    const workspaceId = activeWorkspace?.id;
    const needle = username.trim().replace(/^@/, '');
    if (!open || !workspaceId || !needle) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const users = await workspaceService.searchCandidateUsers(workspaceId, needle);
        if (!cancelled) setResults(users);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeWorkspace?.id, open, username]);

  const selectCandidate = (candidate: CandidateUser) => {
    setUsername(candidate.username);
    setResultsOpen(false);
    setActiveIndex(-1);
    setError(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setResultsOpen(false);
      return;
    }
    if (!resultsOpen || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const candidate = results[activeIndex];
      if (candidate) selectCandidate(candidate);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = username.trim().replace(/^@/, '');
    if (!value) {
      setError(t('members.usernameRequired', 'Enter a username.'));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await addMember(value, role, department);
      toast.success(
        t('members.memberAdded', '{{username}} was added to the workspace.', { username: value }),
      );
      onClose();
    } catch (caught) {
      const status =
        typeof caught === 'object' && caught !== null && 'status' in caught
          ? Number((caught as { status?: unknown }).status)
          : undefined;
      if (status === 404) {
        setError(
          t('members.userNotFound', 'No user found with username @{{username}}.', {
            username: value,
          }),
        );
      } else if (status === 409) {
        setError(
          t('members.alreadyMember', '@{{username}} is already a member of this workspace.', {
            username: value,
          }),
        );
      } else {
        setError(
          caught instanceof Error && caught.message
            ? caught.message
            : t('members.memberAddFailed', 'Could not add the member. Try again.'),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const trimmed = username.trim().replace(/^@/, '');
  const showResults = resultsOpen && trimmed.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('members.addMemberTitle', 'Add Member')}
      description={t(
        'members.addMemberSubtitle',
        'Add an existing teammate to this workspace by username.',
      )}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username with live autocomplete */}
        <div className="space-y-1.5">
          <label htmlFor="add-member-username" className="block text-sm font-medium">
            {t('members.usernameLabel', 'Username')}
          </label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id="add-member-username"
              type="text"
              required
              autoComplete="off"
              dir="ltr"
              role="combobox"
              aria-expanded={showResults}
              aria-controls="add-member-search-results"
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0 ? `add-member-option-${activeIndex}` : undefined
              }
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError(null);
                setResultsOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => {
                if (trimmed) setResultsOpen(true);
              }}
              onBlur={() => setResultsOpen(false)}
              onKeyDown={handleKeyDown}
              placeholder={t('members.usernamePlaceholder', 'e.g. sarah.chen')}
              className={cn(inputClass, 'ps-9 pe-9')}
            />
            {searching && (
              <Loader2 className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />
            )}

            {showResults && (
              <ul
                id="add-member-search-results"
                role="listbox"
                aria-label={t('members.searchResults', 'Matching users')}
                className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-surface p-1 shadow-depth"
                onMouseDown={(event) => event.preventDefault()}
              >
                {results.length > 0 ? (
                  results.map((candidate, index) => (
                    <li key={candidate.id} role="presentation">
                      <button
                        type="button"
                        id={`add-member-option-${index}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        onClick={() => selectCandidate(candidate)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start transition',
                          index === activeIndex ? 'bg-accent/12 text-accent' : 'hover:bg-surface-2',
                        )}
                      >
                        <Avatar name={candidate.name} src={candidate.avatar ?? undefined} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{candidate.name}</span>
                          <span className="block truncate font-mono text-xs text-muted">
                            @{candidate.username}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-2.5 py-2 text-xs text-muted">
                    {searching
                      ? t('members.searchingUsers', 'Searching…')
                      : t('members.noUsersFound', 'No matching users.')}
                  </li>
                )}
              </ul>
            )}
          </div>
          <p className="text-xs text-muted">
            {t(
              'members.usernameHint',
              'Choose a suggestion or submit the username directly.',
            )}
          </p>
          {error && (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          )}
        </div>

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
        <div className="space-y-1.5">
          <label htmlFor="add-member-department" className="block text-sm font-medium">
            {t('members.department', 'Team / Department')}
          </label>
          <select
            id="add-member-department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className={inputClass}
          >
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Product">Product</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
            <option value="General">General</option>
          </select>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting
              ? t('members.adding', 'Adding…')
              : t('members.addMember', 'Add Member')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
