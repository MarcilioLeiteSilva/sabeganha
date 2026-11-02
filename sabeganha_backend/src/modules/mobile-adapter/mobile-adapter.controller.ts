import {
  Controller,
  All,
  Post,
  Get,
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

  @All(['general_setting', 'get_general_setting'])
  @ApiOperation({ summary: 'Configurações globais consumidas pelo Splash/Init do app' })
  async getGeneralSettings() {
    return this.mobileAdapterService.getGeneralSettings();
  }

  @All(['get_onboarding_screen', 'onboarding_screen'])
  @ApiOperation({ summary: 'Telas de apresentação educativa inicial' })
  async getOnboardingScreen() {
    return this.mobileAdapterService.getOnboardingScreens();
  }

  @All(['get_category', 'category', 'categories'])
  @ApiOperation({ summary: 'Lista as 9 macro-categorias do SabeGanha' })
  async getCategory() {
    return this.mobileAdapterService.getCategories();
  }

  @All(['login', 'login_with_social', 'registration'])
  @ApiOperation({ summary: 'Login / Cadastro mobile com carteira contábil' })
  async login(@Body() body: any) {
    return this.mobileAdapterService.loginOrRegister(body || {});
  }

  @All(['profile', 'get_profile'])
  @ApiOperation({ summary: 'Consulta perfil e saldo auditado de Quiz Coins' })
  async profile(@Body() body: any) {
    const userId = body?.user_id || body?.id;
    return this.mobileAdapterService.getProfile(userId);
  }

  @All(['update_profile'])
  @ApiOperation({ summary: 'Atualização básica do perfil' })
  async updateProfile(@Body() body: any) {
    return { status: 200, message: 'Perfil atualizado com sucesso', result: [] };
  }

  @All(['quiz_configuration', 'get_quiz_configuration'])
  @ApiOperation({ summary: 'Configuração dos modos de jogo do quiz' })
  async quizConfiguration() {
    return this.mobileAdapterService.getQuizConfiguration();
  }

  @All([
    'question',
    'get_question',
    'get_practice_question',
    'get_normal_question',
    'get_audio_question',
    'get_video_question',
    'get_true_false_question',
    'get_fear_factor_question',
    'get_daily_quiz_question',
    'get_exam_question',
    'get_contest_question',
    'get_ultimate_challenge_question',
  ])
  @ApiOperation({ summary: 'Questões do quiz por categoria ou ID' })
  async question(@Body() body: any) {
    const categoryId = body?.category_id || body?.categoryId;
    const quizId = body?.quiz_id || body?.quizId;
    return this.mobileAdapterService.getQuestions(categoryId, quizId);
  }

  @All([
    'report',
    'save_report',
    'save_practice_report',
    'save_normal_report',
    'save_audio_report',
    'save_video_report',
    'save_true_false_report',
    'save_fear_factor_report',
    'save_daily_quiz_report',
    'save_exam_report',
    'save_ultimate_challenge_report',
  ])
  @ApiOperation({ summary: 'Salva resultado e credita Quiz Coins no Ledger' })
  async report(@Body() body: any) {
    return this.mobileAdapterService.saveReport(body || {});
  }

  @All(['product', 'get_product'])
  @ApiOperation({ summary: 'Catálogo de prêmios e vouchers (Modelo A)' })
  async product() {
    return this.mobileAdapterService.getProducts();
  }

  @All(['reward_transaction_list', 'transaction_list', 'reward_transaction'])
  @ApiOperation({ summary: 'Extrato do Ledger de Quiz Coins do usuário' })
  async rewardTransactionList(@Body() body: any) {
    const userId = body?.user_id;
    return this.mobileAdapterService.getRewardTransactions(userId);
  }

  @All(['avatar', 'get_avatar'])
  @ApiOperation({ summary: 'Avatares disponíveis' })
  async avatar() {
    return this.mobileAdapterService.getAvatars();
  }

  @All(['exam', 'get_exam'])
  @ApiOperation({ summary: 'Exames e simulados' })
  async exam() {
    return this.mobileAdapterService.getExam();
  }

  @All(['live_ultimate_challenge', 'get_live_ultimate_challenge'])
  @ApiOperation({ summary: 'Desafios especiais' })
  async liveUltimateChallenge() {
    return this.mobileAdapterService.getLiveContest();
  }

  @All(['live_content', 'get_live_content', 'get_contest', 'contest'])
  @ApiOperation({ summary: 'Conteúdos em destaque e concursos' })
  async liveContent() {
    return { status: 200, message: 'success', result: [] };
  }

  @All(['withdrawal_list', 'get_withdrawal_list', 'withdrwalrequest'])
  @ApiOperation({ summary: 'Histórico de resgates e saques' })
  async withdrawalList() {
    return { status: 200, message: 'success', result: [] };
  }

  @All(['get_skill', 'skill'])
  @ApiOperation({ summary: 'Skills do quiz' })
  async getSkill() {
    return this.mobileAdapterService.getSkills();
  }

  @All(['get_classification', 'classification'])
  @ApiOperation({ summary: 'Classificações do quiz' })
  async getClassification() {
    return this.mobileAdapterService.getClassifications();
  }

  @All(['get_level', 'level'])
  @ApiOperation({ summary: 'Níveis de quiz' })
  async getLevel() {
    return this.mobileAdapterService.getLevels();
  }

  @All(['transaction', 'get_transaction'])
  @ApiOperation({ summary: 'Transações de pontos' })
  async getTransaction() {
    return { status: 200, message: 'success', result: [] };
  }

  @All(['get_refer_earn_history', 'refer_earn_history'])
  @ApiOperation({ summary: 'Histórico de indicações' })
  async getReferEarnHistory() {
    return { status: 200, message: 'success', result: [] };
  }
}
