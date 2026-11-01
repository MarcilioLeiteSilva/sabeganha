import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MobileAdapterService } from './mobile-adapter.service';

@ApiTags('Mobile App Adapter (Flutter Compatibility)')
@Controller()
export class MobileAdapterController {
  constructor(private readonly mobileAdapterService: MobileAdapterService) {}

  @Post('general_setting')
  @ApiOperation({ summary: 'Configurações globais consumidas pelo Splash/Init do app' })
  async getGeneralSettings() {
    return this.mobileAdapterService.getGeneralSettings();
  }

  @Post('get_onboarding_screen')
  @ApiOperation({ summary: 'Telas de apresentação educativa inicial' })
  async getOnboardingScreen() {
    return this.mobileAdapterService.getOnboardingScreens();
  }

  @Post('get_category')
  @ApiOperation({ summary: 'Lista as 9 macro-categorias do SabeGanha' })
  async getCategory() {
    return this.mobileAdapterService.getCategories();
  }

  @Post('login')
  @ApiOperation({ summary: 'Login / Cadastro mobile com carteira contábil' })
  async login(@Body() body: any) {
    return this.mobileAdapterService.loginOrRegister(body || {});
  }

  @Post('profile')
  @ApiOperation({ summary: 'Consulta perfil e saldo auditado de Quiz Coins' })
  async profile(@Body() body: any) {
    const userId = body?.user_id || body?.id;
    return this.mobileAdapterService.getProfile(userId);
  }

  @Post('quiz_configuration')
  @ApiOperation({ summary: 'Configuração dos modos de jogo do quiz' })
  async quizConfiguration() {
    return this.mobileAdapterService.getQuizConfiguration();
  }

  @Post('question')
  @ApiOperation({ summary: 'Questões do quiz por categoria ou ID' })
  async question(@Body() body: any) {
    const categoryId = body?.category_id || body?.categoryId;
    const quizId = body?.quiz_id || body?.quizId;
    return this.mobileAdapterService.getQuestions(categoryId, quizId);
  }

  @Post('report')
  @ApiOperation({ summary: 'Salva resultado e credita Quiz Coins no Ledger' })
  async report(@Body() body: any) {
    return this.mobileAdapterService.saveReport(body || {});
  }

  @Post('product')
  @ApiOperation({ summary: 'Catálogo de prêmios e vouchers (Modelo A)' })
  async product() {
    return this.mobileAdapterService.getProducts();
  }

  @Post('reward_transaction_list')
  @ApiOperation({ summary: 'Extrato do Ledger de Quiz Coins do usuário' })
  async rewardTransactionList(@Body() body: any) {
    const userId = body?.user_id;
    return this.mobileAdapterService.getRewardTransactions(userId);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Avatares disponíveis' })
  async avatar() {
    return this.mobileAdapterService.getAvatars();
  }

  @Post('exam')
  @ApiOperation({ summary: 'Exames e simulados' })
  async exam() {
    return this.mobileAdapterService.getExam();
  }

  @Post('live_ultimate_challenge')
  @ApiOperation({ summary: 'Desafios especiais' })
  async liveUltimateChallenge() {
    return this.mobileAdapterService.getLiveContest();
  }

  @Post('live_content')
  @ApiOperation({ summary: 'Conteúdos em destaque' })
  async liveContent() {
    return this.mobileAdapterService.getLiveContest();
  }
}

