import {
  Controller,
  Get,
  Query,
  Headers,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { WalletService } from './wallet.service';

@ApiTags('Wallet & Ledger')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balances')
  @ApiOperation({ summary: 'Consulta os saldos consolidados do usuário (Quiz Coins, Gems, Reward Credits)' })
  @ApiHeader({ name: 'x-user-id', description: 'ID do usuário temporário para dev' })
  async getBalances(@Headers('x-user-id') headerUserId?: string) {
    // No MVP inicial / dev usamos o x-user-id ou mock; integrado com JwtAuthGuard
    const userId = headerUserId || '00000000-0000-0000-0000-000000000001';
    return this.walletService.getBalances(userId);
  }

  @Get('statement')
  @ApiOperation({ summary: 'Extrato contábil paginado das movimentações do Ledger' })
  @ApiHeader({ name: 'x-user-id', description: 'ID do usuário temporário para dev' })
  async getStatement(
    @Headers('x-user-id') headerUserId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const userId = headerUserId || '00000000-0000-0000-0000-000000000001';
    return this.walletService.getStatement(userId, page, limit);
  }
}

