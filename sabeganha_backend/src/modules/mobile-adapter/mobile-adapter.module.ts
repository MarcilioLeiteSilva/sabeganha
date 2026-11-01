import { Module } from '@nestjs/common';
import { MobileAdapterController } from './mobile-adapter.controller';
import { MobileAdapterService } from './mobile-adapter.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [MobileAdapterController],
  providers: [MobileAdapterService],
  exports: [MobileAdapterService],
})
export class MobileAdapterModule {}

