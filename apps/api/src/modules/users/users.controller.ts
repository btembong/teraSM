import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: { id: string; tenantId: string }) {
    return this.usersService.findById(user.id, user.tenantId)
  }

  @Get()
  @ApiOperation({ summary: 'List all users in the tenant' })
  @ApiQuery({ name: 'role', required: false })
  listUsers(
    @CurrentUser() user: { tenantId: string },
    @Query('role') role?: string,
  ) {
    return this.usersService.findAllByTenant(user.tenantId, role)
  }
}
