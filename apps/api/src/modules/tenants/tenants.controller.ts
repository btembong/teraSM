import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { TenantsService } from './tenants.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant (school) details' })
  getMyTenant(@CurrentUser() user: { tenantId: string }) {
    return this.tenantsService.findById(user.tenantId)
  }

  @Post('onboarding')
  @ApiOperation({ summary: 'Save onboarding data (profile, academics, invites)' })
  saveOnboarding(
    @CurrentUser() user: { tenantId: string },
    @Body() body: any,
  ) {
    return this.tenantsService.saveOnboarding(user.tenantId, body)
  }
}
