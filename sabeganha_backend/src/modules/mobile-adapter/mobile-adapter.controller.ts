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
    const levelId = body?.level_id || body?.levelId;
    return this.mobileAdapterService.getQuestions(categoryId, quizId, levelId);
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
    'save_contest_question_report',
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

  @All(['reward_transaction_list', 'transaction_list', 'get_reward_transaction'])
  @ApiOperation({ summary: 'Extrato do Ledger de Quiz Coins do usuário' })
  async rewardTransactionList(@Body() body: any) {
    const userId = body?.user_id;
    return this.mobileAdapterService.getRewardTransactions(userId);
  }

  @All(['reward_transaction', 'add_reward_transaction'])
  @ApiOperation({ summary: 'Credita recompensa de giro ou bônus no Ledger' })
  async rewardTransaction(@Body() body: any) {
    const userId = body?.user_id;
    const coin = Number(body?.coin) || 0;
    const type = body?.type;
    return this.mobileAdapterService.processRewardTransaction(userId, coin, type);
  }

  @All(['reward_setting'])
  @ApiOperation({ summary: 'Configurações de recompensas diárias e da roleta' })
  async rewardSetting() {
    return this.mobileAdapterService.getRewardSetting();
  }

  @All(['get_coin_leaderboard', 'coin_leaderboard', 'leaderboard', 'get_leaderboard'])
  @ApiOperation({ summary: 'Ranking geral de pontuação' })
  async coinLeaderboard(@Body() body: any) {
    const userId = body?.user_id;
    return this.mobileAdapterService.getLeaderboard(userId);
  }

  @All(['get_contest_leaderboard', 'contest_leaderboard'])
  @ApiOperation({ summary: 'Ranking de concurso' })
  async contestLeaderboard(@Body() body: any) {
    const contestId = body?.contest_id;
    const userId = body?.user_id;
    return this.mobileAdapterService.getContestLeaderboard(contestId, userId);
  }

  @All(['get_package', 'package', 'packages'])
  @ApiOperation({ summary: 'Pacotes disponíveis' })
  async packages() {
    return this.mobileAdapterService.getPackages();
  }

  @All(['get_badge_list', 'badge_list', 'badges'])
  @ApiOperation({ summary: 'Lista de insígnias e conquistas' })
  async badgeList(@Body() body: any) {
    const userId = body?.user_id;
    return this.mobileAdapterService.getBadgeList(userId);
  }

  @All(['get_notification', 'notification', 'notifications'])
  @ApiOperation({ summary: 'Notificações para o usuário' })
  async notifications(@Body() body: any) {
    const userId = body?.user_id;
    return this.mobileAdapterService.getNotifications(userId);
  }

  @All(['read_notification'])
  @ApiOperation({ summary: 'Marca notificação como lida' })
  async readNotification(@Body() body: any) {
    const id = body?.id || body?.notification_id;
    return this.mobileAdapterService.readNotification(id);
  }

  @All(['get_pages', 'pages'])
  @ApiOperation({ summary: 'Páginas de políticas, termos e sobre' })
  async getPages() {
    return this.mobileAdapterService.getPages();
  }

  @All(['get_social_link', 'social_link', 'sociallink'])
  @ApiOperation({ summary: 'Links para redes sociais' })
  async getSocialLink() {
    return this.mobileAdapterService.getSocialLink();
  }

  @All(['get_user_product', 'user_product'])
  @ApiOperation({ summary: 'Recompensas / vouchers resgatados pelo usuário' })
  async getUserProduct(@Body() body: any) {
    const userId = body?.user_id;
    return this.mobileAdapterService.getUserProducts(userId);
  }

  @All(['add_product_transaction', 'product_transaction'])
  @ApiOperation({ summary: 'Resgata produto/voucher debitando Quiz Coins' })
  async addProductTransaction(@Body() body: any) {
    return this.mobileAdapterService.addProductTransaction(body || {});
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

  @All(['get_user_exam', 'user_exam', 'completed_exam'])
  @ApiOperation({ summary: 'Histórico de exames do usuário' })
  async getUserExam(@Body() body: any) {
    const userId = body?.user_id;
    return this.mobileAdapterService.getUserExam(userId);
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

  @All(['join_contest'])
  @ApiOperation({ summary: 'Inscrição em concurso' })
  async joinContest(@Body() body: any) {
    return this.mobileAdapterService.joinContest(body || {});
  }

  @All(['get_review_question_by_contest_id', 'review_question'])
  @ApiOperation({ summary: 'Revisão de questões de concurso' })
  async getReviewQuestion(@Body() body: any) {
    const contestId = body?.contest_id;
    return this.mobileAdapterService.getReviewQuestion(contestId);
  }

  @All(['withdrawal_list', 'get_withdrawal_list'])
  @ApiOperation({ summary: 'Histórico de resgates e saques' })
  async withdrawalList() {
    return { status: 200, message: 'success', result: [] };
  }

  @All(['withdrawal_request', 'withdrwalrequest'])
  @ApiOperation({ summary: 'Solicitação de resgate de benefício' })
  async withdrawalRequest(@Body() body: any) {
    return this.mobileAdapterService.withdrawalRequest(body || {});
  }

  @All(['get_payment_option', 'payment_option'])
  @ApiOperation({ summary: 'Opções de pagamento/gateways' })
  async getPaymentOption() {
    return this.mobileAdapterService.getPaymentOption();
  }

  @All(['get_payment_token', 'paytm_token', 'paytmToken'])
  @ApiOperation({ summary: 'Token de pagamento' })
  async getPaymentToken() {
    return { status: 200, message: 'success', result: { txnToken: 'mock-token' } };
  }

  @All(['forgot_password', 'forgotpassword'])
  @ApiOperation({ summary: 'Recuperação de senha' })
  async forgotPassword(@Body() body: any) {
    return this.mobileAdapterService.forgotPassword(body?.email);
  }

  @All(['add_transaction'])
  @ApiOperation({ summary: 'Adiciona transação' })
  async addTransaction(@Body() body: any) {
    return this.mobileAdapterService.addTransaction(body || {});
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
    return this.mobileAdapterService.getReferEarnHistory();
  }
}
