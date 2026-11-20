import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';

@ApiTags('Rewards Catalog & Redemptions')
@Controller()
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('rewards')
  @ApiOperation({ summary: 'Lista os benefícios disponíveis no catálogo com estoque' })
  async getActiveRewards() {
    return this.rewardsService.getActiveRewards();
  }

  @Get('rewards/:id')
  @ApiOperation({ summary: 'Recupera detalhes e termos de um benefício' })
  async getRewardById(@Param('id') id: string) {
    return this.rewardsService.getRewardById(id);
  }

  @Post('rewards/redeem')
  @ApiOperation({ summary: 'Executa o resgate de um benefício com débito contábil e entrega de voucher' })
  @ApiHeader({ name: 'x-user-id', required: false })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rewardId'],
      properties: {
        rewardId: { type: 'string', format: 'uuid' },
      },
    },
  })
  async redeemReward(
    @Body('rewardId') rewardId: string,
    @Headers('Idempotency-Key') idempotencyKey: string,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    if (!rewardId) {
      throw new BadRequestException('O campo rewardId é obrigatório.');
    }
    const userId = headerUserId || '00000000-0000-0000-0000-000000000001';
    const key = idempotencyKey || `rdm_${Date.now()}`;
    return this.rewardsService.redeemReward(userId, rewardId, key);
  }

  @Get('redemptions/my')
  @ApiOperation({ summary: 'Lista os vouchers e cupons resgatados pelo usuário autenticado' })
  @ApiHeader({ name: 'x-user-id', required: false })
  async getMyRedemptions(@Headers('x-user-id') headerUserId?: string) {
    const userId = headerUserId || '00000000-0000-0000-0000-000000000001';
    return this.rewardsService.getMyRedemptions(userId);
  }

  @Get('admin/redemptions')
  @ApiOperation({ summary: 'Lista todas as solicitações de resgate e saques para auditoria admin' })
  async getAllRedemptions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
    @Query('status') status?: string,
  ) {
    return this.rewardsService.getAllRedemptions(page, limit, status);
  }

  @Patch('admin/redemptions/:id/status')
  @ApiOperation({ summary: 'Atualiza o status de um resgate (DELIVERED, PENDING, CANCELLED com estorno no Ledger)' })
  async updateRedemptionStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason?: string,
  ) {
    if (!status) {
      throw new BadRequestException('O campo status é obrigatório.');
    }
    return this.rewardsService.updateRedemptionStatus(id, status, reason);
  }
}

