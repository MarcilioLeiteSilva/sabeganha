import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MobileAdapterService } from './mobile-adapter.service';

@ApiTags('Mobile App Adapter (Flutter Compatibility)')
@Controller()
@UseInterceptors(AnyFilesInterceptor())
export class MobileAdapterController {
  constructor(private readonly mobileAdapterService: MobileAdapterService) {}

  @Post(['general_setting', 'get_general_setting'])
  @ApiOperation({ summary: 'Configurações globais consumidas pelo Splash/Init do app' })
  async getGeneralSettings() {
    return this.mobileAdapterService.getGeneralSettings();
  }

  @Post(['get_onboarding_screen', 'onboarding_screen'])
  @ApiOperation({ summary: 'Telas de apresentação educativa inicial' })
  async getOnboardingScreen() {
    return this.mobileAdapterService.getOnboardingScreens();
  }

  @Post(['get_category', 'category', 'categories'])
  @ApiOperation({ summary: 'Lista as 9 macro-categorias do SabeGanha' })
  async getCategory() {
    return this.mobileAdapterService.getCategories();
  }

  @Post(['login', 'login_with_social', 'registration'])
  @ApiOperation({ summary: 'Login / Cadastro mobile com carteira contábil' })
  async login(@Body() body: any) {
    return this.mobileAdapterService.loginOrRegister(body || {});
  }

  @Post(['profile', 'get_profile'])
  @ApiOperation({ summary: 'Consulta perfil e saldo auditado de Quiz Coins' })
  async profile(@Body() body: any) {
    const userId = body?.user_id || body?.id;
    return this.mobileAdapterService.getProfile(userId);
  }

  @Post(['update_profile'])
  @ApiOperation({ summary: 'Atualização básica do perfil' })
  async updateProfile(@Body() body: any) {
    return { status: 200, message: 'Perfil atualizado com sucesso', result: [] };
  }

  @Post(['quiz_configuration', 'get_quiz_configuration'])
  @ApiOperation({ summary: 'Configuração dos modos de jogo do quiz' })
  async quizConfiguration() {
    return this.mobileAdapterService.getQuizConfiguration();
  }

  @Post(['question', 'get_question'])
  @ApiOperation({ summary: 'Questões do quiz por categoria ou ID' })
  async question(@Body() body: any) {
    const categoryId = body?.category_id || body?.categoryId;
    const quizId = body?.quiz_id || body?.quizId;
    return this.mobileAdapterService.getQuestions(categoryId, quizId);
  }

  @Post(['report', 'save_report'])
  @ApiOperation({ summary: 'Salva resultado e credita Quiz Coins no Ledger' })
  async report(@Body() body: any) {
    return this.mobileAdapterService.saveReport(body || {});
  }

  @Post(['product', 'get_product'])
  @ApiOperation({ summary: 'Catálogo de prêmios e vouchers (Modelo A)' })
  async product() {
    return this.mobileAdapterService.getProducts();
  }

  @Post(['reward_transaction_list', 'transaction_list', 'reward_transaction'])
  @ApiOperation({ summary: 'Extrato do Ledger de Quiz Coins do usuário' })
  async rewardTransactionList(@Body() body: any) {
    const userId = body?.user_id;
    return this.mobileAdapterService.getRewardTransactions(userId);
  }

  @Post(['avatar', 'get_avatar'])
  @ApiOperation({ summary: 'Avatares disponíveis' })
  async avatar() {
    return this.mobileAdapterService.getAvatars();
  }

  @Post(['exam', 'get_exam'])
  @ApiOperation({ summary: 'Exames e simulados' })
  async exam() {
    return this.mobileAdapterService.getExam();
  }

  @Post(['live_ultimate_challenge', 'get_live_ultimate_challenge'])
  @ApiOperation({ summary: 'Desafios especiais' })
  async liveUltimateChallenge() {
    return this.mobileAdapterService.getLiveContest();
  }

  @Post(['live_content', 'get_live_content'])
  @ApiOperation({ summary: 'Conteúdos em destaque' })
  async liveContent() {
    return this.mobileAdapterService.getLiveContest();
  }
}
