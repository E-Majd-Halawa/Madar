import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Workspace } from '../../common/contracts/api.contracts.js';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { AcceptInvitationDto } from './dto/invitations.dto.js';
import { InvitationsService } from './invitations.service.js';

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationAcceptController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @RateLimit('strict')
  @ApiOperation({ summary: 'Accept an invitation with the emailed token' })
  @ApiResponse({ status: 200, description: 'Workspace' })
  @ApiResponse({ status: 403, description: 'invitation_email_mismatch' })
  @ApiResponse({ status: 404, description: 'invitation_not_found' })
  @ApiResponse({ status: 410, description: 'invitation_expired' })
  accept(
    @Body() dto: AcceptInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Workspace> {
    return this.invitationsService.accept(user, dto.token);
  }
}
