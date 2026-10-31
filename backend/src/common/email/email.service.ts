import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InvitationEmailInput {
  to: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  lang: string;
}

/**
 * Email boundary. Phase 3 ships the log driver only; an SMTP driver can be
 * added later by implementing this class and switching EMAIL_DRIVER.
 */
export abstract class EmailService {
  abstract sendInvitation(input: InvitationEmailInput): Promise<void>;
}

/**
 * Development/test driver. It never sends email; it prints one INFO line.
 *
 * Extension point: create `SmtpEmailService implements EmailService` and bind
 * it when `EMAIL_DRIVER=smtp`. Do not add SMTP credentials until then.
 */
@Injectable()
export class LogEmailService implements EmailService {
  private readonly logger = new Logger(LogEmailService.name);
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    this.isProduction = config.get<string>('NODE_ENV') === 'production';
    const driver = config.get<string>('EMAIL_DRIVER') ?? 'log';

    if (this.isProduction && driver === 'log') {
      throw new Error(
        'EMAIL_DRIVER=log is not allowed in production. Configure a real email driver.',
      );
    }
  }

  async sendInvitation(input: InvitationEmailInput): Promise<void> {
    if (this.isProduction) {
      throw new Error('LogEmailService cannot send email in production.');
    }

    this.logger.log(
      `Invitation email to=${input.to} workspace="${input.workspaceName}" inviter="${input.inviterName}" role=${input.role} acceptUrl=${input.acceptUrl}`,
    );
  }
}
