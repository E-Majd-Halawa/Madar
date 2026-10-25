import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Paged, User } from '../../common/contracts/api.contracts.js';
import { ListUsersQueryDto } from './dto/users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users (directory) with search, role filter and pagination',
  })
  @ApiResponse({ status: 200, description: 'Paged<User>' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  list(@Query() query: ListUsersQueryDto): Promise<Paged<User>> {
    return this.usersService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by id' })
  @ApiResponse({ status: 200, description: 'User' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getById(@Param('id') id: string): Promise<User> {
    return this.usersService.getById(id);
  }
}
