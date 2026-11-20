import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Lista benefícios ativos com quantidade em estoque
   */
  async getActiveRewards() {
    return this.prisma.reward.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        partnerName: true,
        costPoints: true,
        currencyRequired: true,
        stockQuantity: true,
        termsAndConditions: true,
      },
      orderBy: { costPoints: 'asc' },
    });
  }

  /**
   * Detalhes de um benefício
   */
  async getRewardById(id: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
    });
    if (!reward) {
      throw new NotFoundException('Benefício não encontrado.');
    }
    return reward;
  }

  /**
   * Processa o resgate atômico com débito no Ledger e entrega de voucher
   */
  async redeemReward(userId: string, rewardId: string, idempotencyKey: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId, isActive: true },
      include: {
        vouchers: {
          where: { isClaimed: false },
          take: 1,
        },
      },
    });

    if (!reward) {
      throw new NotFoundException('Benefício não encontrado ou inativo.');
    }

    if (reward.stockQuantity <= 0 || reward.vouchers.length === 0) {
      throw new BadRequestException('Este item está temporariamente esgotado.');
    }

    const availableVoucher = reward.vouchers[0];
    const cost = Number(reward.costPoints);

    // 1. Débito no Ledger contábil
    const debitResult = await this.walletService.debit(
      userId,
      cost,
      reward.currencyRequired,
      'REDEMPTION',
      `redeem_${reward.id}_${idempotencyKey}`,
      `Resgate de benefício: ${reward.title} (${reward.partnerName})`,
    );

    // 2. Transação de entrega do voucher
    const redemption = await this.prisma.$transaction(async (tx) => {
      // Marca voucher como utilizado
      await tx.rewardVoucher.update({
        where: { id: availableVoucher.id },
        data: {
          isClaimed: true,
          claimedAt: new Date(),
        },
      });

      // Decrementa estoque
      await tx.reward.update({
        where: { id: reward.id },
        data: {
          stockQuantity: { decrement: 1 },
        },
      });

      // Cria registro de resgate
      return tx.redemption.create({
        data: {
          userId,
          rewardId: reward.id,
          voucherId: availableVoucher.id,
          costPoints: reward.costPoints,
          currencyType: reward.currencyRequired,
          status: 'DELIVERED',
        },
      });
    });

    return {
      status: 'success',
      redemptionId: redemption.id,
      rewardTitle: reward.title,
      partnerName: reward.partnerName,
      voucherCode: availableVoucher.voucherCode,
      expiresAt: availableVoucher.expiresAt,
      costPoints: cost,
      newWalletBalance: debitResult.newBalance,
    };
  }

  /**
   * Lista os resgates e vouchers do usuário
   */
  async getMyRedemptions(userId: string) {
    return this.prisma.redemption.findMany({
      where: { userId },
      include: {
        reward: {
          select: {
            title: true,
            partnerName: true,
            termsAndConditions: true,
          },
        },
        voucher: {
          select: {
            voucherCode: true,
            expiresAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista todas as solicitações de resgate para o painel administrativo
   */
  async getAllRedemptions(page = 1, limit = 50, status?: string) {
    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.redemption.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          reward: {
            select: {
              id: true,
              title: true,
              partnerName: true,
            },
          },
          voucher: {
            select: {
              voucherCode: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.redemption.count({ where: whereClause }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Atualização de status de resgate com estorno contábil opcional no Ledger
   */
  async updateRedemptionStatus(redemptionId: string, newStatus: string, reason?: string) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { id: redemptionId },
      include: { reward: true },
    });

    if (!redemption) {
      throw new NotFoundException('Resgate não encontrado.');
    }

    if (newStatus === 'CANCELLED' && redemption.status !== 'CANCELLED') {
      await this.walletService.credit(
        redemption.userId,
        Number(redemption.costPoints),
        redemption.currencyType,
        'REDEMPTION_REFUND',
        `refund_${redemption.id}_${Date.now()}`,
        `Estorno de resgate cancelado: ${reason || 'Cancelado pelo administrador'}`,
      );
    }

    return this.prisma.redemption.update({
      where: { id: redemptionId },
      data: { status: newStatus },
    });
  }
}

