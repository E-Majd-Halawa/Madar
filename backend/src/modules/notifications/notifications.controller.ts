import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { JwtService } from '@nestjs/jwt';
import { CreateNotificationDto, MarkReadDto } from './dto/notifications.dto.js';
import { NotificationStreamService } from './notifications-stream.service.js';
import { NotificationsService } from './notifications.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly stream: NotificationStreamService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('notifications')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.list(user.id);
  }

  @Get('notifications/unread-count')
  unread(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.unreadCount(user.id).then((count) => ({ count }));
  }

  @Post('notifications')
  push(
    @Body() body: CreateNotificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notifications.push(body as any, user.id);
  }

  @Post('notifications/stream-ticket')
  ticket(@CurrentUser() user: AuthenticatedUser) {
    return this.stream.createTicket(user.id);
  }

  @Public()
  @Sse('notifications/stream')
  streamEvents(
    @Query('ticket') ticket: string,
    @Headers() headers: Record<string, string>,
  ) {
    const authHeader = headers['authorization'] || headers['Authorization'];
    let requestingUserId: string | undefined = undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify(authHeader.slice(7));
        requestingUserId = payload.sub;
      } catch {
        throw new ForbiddenException({
          code: 'not_a_member',
          message: 'Invalid authorization token.',
        });
      }
    }
    const userId = this.stream.validateTicket(ticket, requestingUserId);
    if (!userId) {
      throw new ForbiddenException({
        code: 'not_a_member',
        message: 'Invalid stream ticket or cross-user access.',
      });
    }
    const lastEventId = headers['last-event-id'] || headers['Last-Event-ID'];
    return this.stream.subscribe(userId, lastEventId ?? null);
  }

  @Patch('notifications/:id')
  @HttpCode(204)
  markRead(
    @Param('id') id: string,
    @Body() body: MarkReadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notifications.markRead(id, user.id, (body as any).read);
  }

  @Post('notifications/read-all')
  @HttpCode(204)
  readAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Delete('notifications/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notifications.remove(id, user.id);
  }
}
