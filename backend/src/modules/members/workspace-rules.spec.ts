import { describe, expect, it } from 'vitest';
import {
  canAssignRole,
  canManageMember,
  isInvitationRole,
} from './workspace-rules.js';

describe('workspace-rules', () => {
  it('lets an owner manage every workspace role', () => {
    for (const role of ['owner', 'admin', 'member', 'guest'] as const) {
      expect(canManageMember('owner', role)).toBe(true);
    }
  });

  it('lets an admin manage only member and guest', () => {
    expect(canManageMember('admin', 'member')).toBe(true);
    expect(canManageMember('admin', 'guest')).toBe(true);
    expect(canManageMember('admin', 'admin')).toBe(false);
    expect(canManageMember('admin', 'owner')).toBe(false);
  });

  it('never lets member or guest manage anyone', () => {
    for (const actor of ['member', 'guest'] as const) {
      for (const target of ['owner', 'admin', 'member', 'guest'] as const) {
        expect(canManageMember(actor, target)).toBe(false);
      }
    }
  });

  it('only lets an owner grant admin or owner', () => {
    expect(canAssignRole('owner', 'owner')).toBe(true);
    expect(canAssignRole('owner', 'admin')).toBe(true);
    expect(canAssignRole('admin', 'admin')).toBe(false);
    expect(canAssignRole('admin', 'owner')).toBe(false);
    expect(canAssignRole('admin', 'member')).toBe(true);
    expect(canAssignRole('admin', 'guest')).toBe(true);
    expect(canAssignRole('member', 'member')).toBe(false);
    expect(canAssignRole('guest', 'guest')).toBe(false);
  });

  it('forbids owner as an invitation role', () => {
    expect(isInvitationRole('owner')).toBe(false);
    expect(isInvitationRole('admin')).toBe(true);
    expect(isInvitationRole('member')).toBe(true);
    expect(isInvitationRole('guest')).toBe(true);
  });
});
