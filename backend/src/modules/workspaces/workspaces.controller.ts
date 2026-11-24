import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  AddMemberDto,
  CreateWorkspaceDto,
  UpdateMemberDto,
} from './dto/workspaces.dto.js';
import { WorkspacesService } from './workspaces.service.js';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List workspaces for the current user' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.listForUser(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workspace by id' })
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.getById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a workspace or team' })
  create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.create(dto as any, user);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List workspace members' })
  listMembers(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.listMembers(id, user);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to a workspace' })
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.addMember(id, dto as any, user);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a workspace member' })
  updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.updateMember(id, memberId, dto as any, user);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a workspace member' })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.removeMember(id, memberId, user);
  }
}