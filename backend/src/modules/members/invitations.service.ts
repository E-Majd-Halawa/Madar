import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type {
  PendingInvite,
  Workspace,
} from '../../common/contracts/api.contracts.js';
import { EmailService } from '../../common/email/email.service.js';
import { DomainEvents } from '../../common/events/domain-events.js';
import { toPendingInviteDto } from '../../common/mappers/invitation.mapper.js';
import { toWorkspaceDto } from '../../common/mappers/workspace.mapper.js';
import { isUniqueConstraintError } from '../../common/utils/prisma-errors.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { WorkspacesRepository } from '../workspaces/workspaces.repository.js';
import type { InviteMemberInput } from './dto/invitations.dto.js';
import { InvitationsRepository } from './invitations.repository.js';
import { MembersRepository } from './members.repository.js';
import { isInvitationRole } from './workspace-rules.js';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function newToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitations: InvitationsRepository,
    private readonly members: MembersRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly events: DomainEvents,
  ) {}

  async list(workspaceId: string): Promise<PendingInvite[]> {
    const now = new Date();
    const rows = await this.invitations.listPending(workspaceId, now);
    return rows.map(toPendingInviteDto);
  }

  async create(
    workspaceId: string,
    actor: AuthenticatedUser,
    input: InviteMemberInput,
  ): Promise<PendingInvite> {
    const role = input.role;
    if (!isInvitationRole(role)) {
      throw new BadRequestException({
        code: 'invalid_role',
        message: 'Invitations cannot grant the owner role.',
      });
    }

    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new ForbiddenException({
        code: 'not_a_member',
        message: 'You are not a member of this workspace.',
      });
    }

    if (workspace.type === 'personal') {
      throw new ConflictException({
        code: 'personal_workspace_restricted',
        message: 'Personal workspaces do not allow invitations.',
      });
    }

    const existingMember = await this.members.findActiveByEmail(
      workspaceId,
      input.email,
    );
    if (existingMember) {
      throw new ConflictException({
        code: 'already_member',
        message: 'That email already belongs to an active member.',
      });
    }

    const now = new Date();
    const department = input.department?.trim()
      ? input.department.trim()
      : null;
    const token = newToken();
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

    let created;
    try {
      created = await this.invitations.transaction(async (tx) => {
        await this.invitations.expireStale(workspaceId, input.email, now, tx);

        const pending = await this.invitations.findPendingByEmail(
          workspaceId,
          input.email,
          now,
          tx,
        );
        if (pending) {
          throw new ConflictException({
            code: 'already_invited',
            message: 'A pending invitation already exists for that email.',
          });
        }

        return this.invitations.create(
          {
            workspaceId,
            email: input.email,
            role,
            department,
            invitedById: actor.id,
            tokenHash: token.hash,
            expiresAt,
          },
          tx,
        );
      });
    } catch (error) {
      // The partial unique index also covers two concurrent create requests.
      if (isUniqueConstraintError(error)) {
        throw new ConflictException({
          code: 'already_invited',
          message: 'A pending invitation already exists for that email.',
        });
      }
      throw error;
    }

    const acceptUrl = this.acceptUrl(token.raw);
    await this.email.sendInvitation({
      to: created.email,
      workspaceName: workspace.name,
      inviterName: actor.fullName,
      role: created.role,
      acceptUrl,
      lang: 'en',
    });

    this.events.emit('member.invited', {
      workspaceId,
      invitationId: created.id,
      email: created.email,
      role: created.role,
      invitedById: actor.id,
    });

    return toPendingInviteDto(created);
  }

  async revoke(
    workspaceId: string,
    invitationId: string,
    actorId: string,
  ): Promise<void> {
    const invitation = await this.invitations.findById(
      workspaceId,
      invitationId,
    );
    if (!invitation) {
      throw new NotFoundException({
        code: 'invitation_not_found',
        message: 'Invitation not found.',
      });
    }

    const revoked = await this.invitations.revokePending(
      workspaceId,
      invitationId,
    );
    if (revoked.count === 0) {
      throw new NotFoundException({
        code: 'invitation_not_found',
        message: 'Invitation not found.',
      });
    }

    this.events.emit('invitation.revoked', {
      workspaceId,
      invitationId,
      email: invitation.email,
      actorId,
    });
  }

  async resend(
    workspaceId: string,
    invitationId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const invitation = await this.invitations.findById(
      workspaceId,
      invitationId,
    );
    if (!invitation || invitation.status !== 'pending') {
      throw new NotFoundException({
        code: 'invitation_not_found',
        message: 'Invitation not found.',
      });
    }

    const now = new Date();
    if (invitation.expiresAt <= now) {
      await this.invitations.markExpired(invitationId, now);
      throw new GoneException({
        code: 'invitation_expired',
        message: 'This invitation has expired.',
      });
    }

    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException({
        code: 'invitation_not_found',
        message: 'Invitation not found.',
      });
    }

    const token = newToken();
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);
    const rotated = await this.invitations.rotatePending(
      workspaceId,
      invitationId,
      token.hash,
      expiresAt,
    );
    if (rotated.count === 0) {
      throw new NotFoundException({
        code: 'invitation_not_found',
        message: 'Invitation not found.',
      });
    }

    await this.email.sendInvitation({
      to: invitation.email,
      workspaceName: workspace.name,
      inviterName: actor.fullName,
      role: invitation.role,
      acceptUrl: this.acceptUrl(token.raw),
      lang: 'en',
    });
  }

  async accept(user: AuthenticatedUser, rawToken: string): Promise<Workspace> {
    const invitation = await this.invitations.findByTokenHash(
      hashToken(rawToken),
    );

    if (!invitation || invitation.status === 'revoked') {
      throw new NotFoundException({
        code: 'invitation_not_found',
        message: 'Invitation not found.',
      });
    }

    const now = new Date();

    if (invitation.status === 'expired') {
      throw new GoneException({
        code: 'invitation_expired',
        message: 'This invitation has expired.',
      });
    }

    if (invitation.status === 'pending' && invitation.expiresAt <= now) {
      await this.invitations.markExpired(invitation.id, now);
      throw new GoneException({
        code: 'invitation_expired',
        message: 'This invitation has expired.',
      });
    }

    if (invitation.email.toLowerCase() !== user.email.trim().toLowerCase()) {
      throw new ForbiddenException({
        code: 'invitation_email_mismatch',
        message: 'This invitation belongs to a different email address.',
      });
    }

    // Idempotent repeat: the token was already consumed and the user joined.
    if (invitation.status === 'accepted') {
      const existing = await this.members.findActiveMembership(
        invitation.workspaceId,
        user.id,
      );
      const workspace = existing
        ? await this.workspaces.findByIdWithActiveMembers(
            invitation.workspaceId,
          )
        : null;

      if (workspace) return toWorkspaceDto(workspace);

      throw new NotFoundException({
        code: 'invitation_not_found',
        message: 'Invitation not found.',
      });
    }

    const result = await this.invitations.transaction(async (tx) => {
      const claimed = await this.invitations.claim(invitation.id, now, tx);

      if (claimed.count === 0) {
        const current = await this.invitations.findById(
          invitation.workspaceId,
          invitation.id,
          tx,
        );

        if (current?.status === 'accepted') {
          const existing = await this.members.findActiveMembership(
            invitation.workspaceId,
            user.id,
            tx,
          );
          const workspace = existing
            ? await this.workspaces.findByIdWithActiveMembers(
                invitation.workspaceId,
                tx,
              )
            : null;
          if (workspace) {
            return { workspace, joined: false };
          }
        }

        if (
          current?.status === 'expired' ||
          (current?.status === 'pending' && current.expiresAt <= now)
        ) {
          throw new GoneException({
            code: 'invitation_expired',
            message: 'This invitation has expired.',
          });
        }

        throw new NotFoundException({
          code: 'invitation_not_found',
          message: 'Invitation not found.',
        });
      }

      const existing = await this.members.findMembership(
        invitation.workspaceId,
        user.id,
        tx,
      );

      if (!existing) {
        await this.members.createMembership(
          {
            workspaceId: invitation.workspaceId,
            userId: user.id,
            role: invitation.role,
            department: invitation.department,
            status: 'active',
            joinedAt: now,
            lastActiveAt: now,
          },
          tx,
        );
      } else if (existing.status !== 'active') {
        await this.members.updateMembership(
          invitation.workspaceId,
          user.id,
          {
            role: invitation.role,
            department: invitation.department,
            status: 'active',
            lastActiveAt: now,
          },
          tx,
        );
      }

      const workspace = await this.workspaces.findByIdWithActiveMembers(
        invitation.workspaceId,
        tx,
      );
      if (!workspace) {
        throw new NotFoundException({
          code: 'invitation_not_found',
          message: 'Invitation not found.',
        });
      }

      return {
        workspace,
        joined: !existing || existing.status !== 'active',
      };
    });

    if (result.joined) {
      this.events.emit('member.joined', {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        role: invitation.role,
        invitationId: invitation.id,
      });
    }

    return toWorkspaceDto(result.workspace);
  }

  private acceptUrl(token: string): string {
    const webUrl = (
      this.config.get<string>('PUBLIC_WEB_URL') ?? 'http://localhost:5173'
    ).replace(/\/+$/, '');
    return `${webUrl}/accept-invite?token=${token}`;
  }
}
