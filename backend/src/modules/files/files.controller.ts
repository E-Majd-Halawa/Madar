import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { WorkspaceRoles } from '../../common/guards/workspace-roles.decorator.js';
import { FilesService } from './files.service.js';
import { PresignFileDto, ConfirmFileDto } from './dto/files.dto.js';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('workspaces/:workspaceId/files')
  @UseGuards(JwtAuthGuard)
  @WorkspaceRoles('owner', 'admin', 'member', 'guest')
  list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
    @Query('folder') folder?: string,
    @Query('type') type?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.filesService.list(workspaceId, user.id, {
      search,
      folder,
      type,
      projectId,
    });
  }

  @Get('workspaces/:workspaceId/files/storage')
  @UseGuards(JwtAuthGuard)
  @WorkspaceRoles('owner', 'admin', 'member', 'guest')
  getStorageUsage(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.getStorageUsage(workspaceId, user.id);
  }

  @Post('workspaces/:workspaceId/files/presign')
  @UseGuards(JwtAuthGuard)
  @WorkspaceRoles('owner', 'admin', 'member')
  presign(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: PresignFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.presign(workspaceId, user.id, dto as any);
  }

  @Put('files/upload/:token')
  @Public()
  async uploadViaToken(@Param('token') token: string, @Req() req: Request) {
    return this.filesService.uploadViaToken(token, req);
  }

  @Post('workspaces/:workspaceId/files')
  @UseGuards(JwtAuthGuard)
  @WorkspaceRoles('owner', 'admin', 'member')
  confirm(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: ConfirmFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.confirm(workspaceId, user.id, dto as any);
  }

  @Get('files/:id/download')
  @UseGuards(JwtAuthGuard)
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const file = await this.filesService.download(id, user.id);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    const asciiFallback =
      file.name
        .replace(/[^\x20-\x7e]/g, '_')
        .replace(/[\r\n"]/g, '')
        .slice(0, 255) || 'file';
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(file.buffer);
  }

  @Delete('files/:id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.filesService.remove(id, user.id);
    return;
  }
}
