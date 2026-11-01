import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyType, AccountType, Prisma } from '@prisma/client';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Garante a existência da carteira e das contas contábeis do usuário
   */
  async getOrCreateUserWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { accounts: true },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          accounts: {
            create: [
              {
                currencyType: CurrencyType.QUIZ_COINS,
                accountType: AccountType.USER_WALLET,
                cachedBalance: new Prisma.Decimal(0),
              },
              {
                currencyType: CurrencyType.GEMS,
                accountType: AccountType.USER_WALLET,
                cachedBalance: new Prisma.Decimal(0),
              },
              {
                currencyType: CurrencyType.REWARD_CREDITS,
                accountType: AccountType.USER_WALLET,
                cachedBalance: new Prisma.Decimal(0),
              },
            ],
          },
        },
        include: { accounts: true },
      });
      this.logger.log(`Carteira e contas criadas para o usuário ${userId}`);
    }

    return wallet;
  }

  /**
   * Retorna os saldos consolidados do usuário
   */
  async getBalances(userId: string) {
    const wallet = await this.getOrCreateUserWallet(userId);

    const quizCoins =
      wallet.accounts.find((a) => a.currencyType === CurrencyType.QUIZ_COINS)
        ?.cachedBalance || 0;
    const gems =
      wallet.accounts.find((a) => a.currencyType === CurrencyType.GEMS)
        ?.cachedBalance || 0;
    const rewardCredits =
      wallet.accounts.find((a) => a.currencyType === CurrencyType.REWARD_CREDITS)
        ?.cachedBalance || 0;

    return {
      quizCoins: Number(quizCoins),
      gems: Number(gems),
      rewardCredits: Number(rewardCredits),
      updatedAt: wallet.accounts[0]?.updatedAt || new Date(),
    };
  }

  /**
   * Retorna o extrato contábil paginado do usuário
   */
  async getStatement(userId: string, page = 1, limit = 20) {
    const wallet = await this.getOrCreateUserWallet(userId);
    const accountIds = wallet.accounts.map((a) => a.id);

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: {
          OR: [
            { debitAccountId: { in: accountIds } },
            { creditAccountId: { in: accountIds } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ledgerEntry.count({
        where: {
          OR: [
            { debitAccountId: { in: accountIds } },
            { creditAccountId: { in: accountIds } },
          ],
        },
      }),
    ]);

    const formatted = entries.map((entry) => {
      const isCredit = accountIds.includes(entry.creditAccountId);
      return {
        id: entry.id,
        type: isCredit ? 'CREDIT' : 'DEBIT',
        amount: Number(entry.amount),
        currency: entry.currencyType,
        eventType: entry.eventType,
        description: entry.description,
        createdAt: entry.createdAt,
      };
    });

    return {
      entries: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Executa crédito atômico no Ledger (Double-Entry Bookkeeping)
   */
  async credit(
    userId: string,
    amount: number,
    currencyType: CurrencyType,
    eventType: string,
    idempotencyKey: string,
    description: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('O valor deve ser estritamente positivo.');
    }

    // 1. Verifica idempotência
    const existing = await this.prisma.ledgerEntry.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      this.logger.warn(`Operação duplicada evitada pela chave de idempotência: ${idempotencyKey}`);
      return { status: 'already_processed', entryId: existing.id };
    }

    const wallet = await this.getOrCreateUserWallet(userId);
    const userAccount = wallet.accounts.find(
      (a) => a.currencyType === currencyType,
    );
    if (!userAccount) {
      throw new BadRequestException(`Conta para ${currencyType} não encontrada.`);
    }

    // 2. Busca ou cria conta do sistema
    let systemAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        accountType: AccountType.SYSTEM_LIABILITY,
        currencyType,
      },
    });

    if (!systemAccount) {
      systemAccount = await this.prisma.ledgerAccount.create({
        data: {
          currencyType,
          accountType: AccountType.SYSTEM_LIABILITY,
          cachedBalance: new Prisma.Decimal(0),
        },
      });
    }

    const decAmount = new Prisma.Decimal(amount);

    // 3. Transação atômica de dupla entrada
    const result = await this.prisma.$transaction(async (tx) => {
      // Cria o lançamento contábil
      const entry = await tx.ledgerEntry.create({
        data: {
          debitAccountId: systemAccount.id,
          creditAccountId: userAccount.id,
          amount: decAmount,
          currencyType,
          eventType,
          idempotencyKey,
          description,
        },
      });

      // Atualiza o saldo do usuário
      const updatedUserAccount = await tx.ledgerAccount.update({
        where: { id: userAccount.id },
        data: {
          cachedBalance: {
            increment: decAmount,
          },
        },
      });

      // Atualiza o passivo do sistema
      await tx.ledgerAccount.update({
        where: { id: systemAccount.id },
        data: {
          cachedBalance: {
            decrement: decAmount,
          },
        },
      });

      return {
        entry,
        newBalance: Number(updatedUserAccount.cachedBalance),
      };
    });

    return {
      status: 'success',
      entryId: result.entry.id,
      newBalance: result.newBalance,
    };
  }

  /**
   * Executa débito atômico no Ledger (Double-Entry Bookkeeping) com checagem de saldo
   */
  async debit(
    userId: string,
    amount: number,
    currencyType: CurrencyType,
    eventType: string,
    idempotencyKey: string,
    description: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('O valor de débito deve ser estritamente positivo.');
    }

    const existing = await this.prisma.ledgerEntry.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return { status: 'already_processed', entryId: existing.id };
    }

    const wallet = await this.getOrCreateUserWallet(userId);
    const userAccount = wallet.accounts.find(
      (a) => a.currencyType === currencyType,
    );
    if (!userAccount) {
      throw new BadRequestException(`Conta para ${currencyType} não encontrada.`);
    }

    if (Number(userAccount.cachedBalance) < amount) {
      throw new BadRequestException('Saldo insuficiente para completar esta operação.');
    }

    let systemAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        accountType: AccountType.SYSTEM_RESERVE,
        currencyType,
      },
    });

    if (!systemAccount) {
      systemAccount = await this.prisma.ledgerAccount.create({
        data: {
          currencyType,
          accountType: AccountType.SYSTEM_RESERVE,
          cachedBalance: new Prisma.Decimal(0),
        },
      });
    }

    const decAmount = new Prisma.Decimal(amount);

    const result = await this.prisma.$transaction(async (tx) => {
      // Bloqueio de linha para evitar race condition
      const current = await tx.ledgerAccount.findUnique({
        where: { id: userAccount.id },
      });

      if (Number(current.cachedBalance) < amount) {
        throw new BadRequestException('Saldo insuficiente durante a transação.');
      }

      const entry = await tx.ledgerEntry.create({
        data: {
          debitAccountId: userAccount.id,
          creditAccountId: systemAccount.id,
          amount: decAmount,
          currencyType,
          eventType,
          idempotencyKey,
          description,
        },
      });

      const updatedUserAccount = await tx.ledgerAccount.update({
        where: { id: userAccount.id },
        data: {
          cachedBalance: {
            decrement: decAmount,
          },
        },
      });

      await tx.ledgerAccount.update({
        where: { id: systemAccount.id },
        data: {
          cachedBalance: {
            increment: decAmount,
          },
        },
      });

      return {
        entry,
        newBalance: Number(updatedUserAccount.cachedBalance),
      };
    });

    return {
      status: 'success',
      entryId: result.entry.id,
      newBalance: result.newBalance,
    };
  }
}

