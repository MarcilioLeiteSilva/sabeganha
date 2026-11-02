import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CurrencyType } from '@prisma/client';

@Injectable()
export class MobileAdapterService {
  private readonly logger = new Logger(MobileAdapterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Configurações gerais consumidas pelo splash/inicialização do app
   */
  async getGeneralSettings() {
    return {
      status: 200,
      message: 'success',
      result: [
        { id: 1, key: 'app_name', value: 'SabeGanha' },
        { id: 2, key: 'app_version', value: '1.3.0' },
        { id: 3, key: 'app_slogan', value: 'Aprenda. Jogue. Conquiste.' },
        { id: 4, key: 'currency_symbol', value: 'QC ' },
        { id: 5, key: 'currency', value: 'Quiz Coins' },
        { id: 6, key: 'refer_status', value: '1' },
        { id: 7, key: 'redeem_status', value: '1' },
        { id: 8, key: 'banner_ad', value: '0' },
        { id: 9, key: 'reward_ad', value: '0' },
        { id: 10, key: 'interstitial_ad', value: '0' },
        { id: 11, key: 'onesignal_app_id', value: '' },
      ],
    };
  }

  /**
   * Telas de Onboarding educativo
   */
  async getOnboardingScreens() {
    return {
      status: 200,
      message: 'success',
      result: [
        {
          id: 1,
          title: 'Aprenda Todo Dia',
          description:
            'Desafie seus conhecimentos com perguntas educativas curadas em 9 macro-áreas do saber.',
          image: 'intro1.png',
        },
        {
          id: 2,
          title: 'Jogue com Propósito',
          description:
            'Cada resposta correta gera Quiz Coins creditados em sua carteira com auditoria contábil.',
          image: 'intro2.png',
        },
        {
          id: 3,
          title: 'Conquiste Benefícios Reais',
          description:
            'Troque seus pontos acumulados por vouchers e cupons de desconto no catálogo de parceiros.',
          image: 'intro3.png',
        },
      ],
    };
  }

  /**
   * Lista as 9 macro-categorias do SabeGanha no formato esperado pelo app
   */
  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: { select: { quizzes: true } },
      },
    });

    return {
      status: 200,
      message: 'success',
      result: categories.map((c, index) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.iconUrl || '',
        description: c.description,
        status: c.isActive ? 1 : 0,
        order: c.orderIndex,
        total_quizzes: c._count.quizzes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    };
  }

  /**
   * Autenticação e criação/recuperação de usuário com carteira Ledger
   */
  async loginOrRegister(data: {
    email?: string;
    fullname?: string;
    mobile_number?: string;
    device_token?: string;
    device_type?: string;
  }) {
    const email = data.email || `usuario_${Date.now()}@sabeganha.com.br`;
    const displayName = data.fullname || email.split('@')[0];

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          role: 'USER',
          profile: {
            create: {
              displayName,
              birthDate: new Date('2000-01-01'),
            },
          },
        },
        include: { profile: true },
      });
      this.logger.log(`Novo usuário criado via mobile: ${email} (${user.id})`);
    }

    // Garante que o usuário possua carteira contábil
    await this.walletService.getOrCreateUserWallet(user.id);
    const balances = await this.walletService.getBalances(user.id);

    return {
      status: 200,
      message: 'Login realizado com sucesso',
      result: [
        {
          id: user.id,
          fullname: user.profile?.displayName || displayName,
          username: user.profile?.displayName || displayName,
          email: user.email,
          mobile_number: data.mobile_number || '',
          image: user.profile?.avatarUrl || '',
          total_points: balances.quizCoins,
          gems: balances.gems,
          reward_credits: balances.rewardCredits,
          status: 1,
        },
      ],
    };
  }

  /**
   * Consulta o perfil e saldo real de Quiz Coins do usuário
   */
  async getProfile(userId?: string) {
    if (!userId) {
      const defaultUser = await this.prisma.user.findFirst({
        include: { profile: true },
      });
      if (defaultUser) {
        userId = defaultUser.id;
      }
    }

    if (!userId) {
      return {
        status: 404,
        message: 'Usuário não encontrado',
        result: [],
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return { status: 404, message: 'Usuário não encontrado', result: [] };
    }

    const balances = await this.walletService.getBalances(user.id);

    return {
      status: 200,
      message: 'success',
      result: [
        {
          id: user.id,
          fullname: user.profile?.displayName || 'Usuário SabeGanha',
          username: user.profile?.displayName || 'sabeganha_player',
          email: user.email,
          image: user.profile?.avatarUrl || '',
          total_points: balances.quizCoins,
          gems: balances.gems,
          reward_credits: balances.rewardCredits,
          status: 1,
        },
      ],
    };
  }

  /**
   * Configuração de quizzes para habilitar os modos de jogo na Home
   */
  async getQuizConfiguration() {
    return {
      status: 200,
      message: 'success',
      result: [
        {
          id: 1,
          name: 'Prática Livre',
          icon: 'fa-pencil-alt',
          description: 'Pratique conhecimentos sem limite de tempo.',
          quiz_status: 1,
          category_status: 1,
          skill_status: 0,
          classification_status: 0,
          level_status: 0,
          quiz_sort_order: '1',
          total_questions: 10,
          quiz_duration: 30,
          joining_type: 1,
          joining_coin: 0,
          min_winning_percentage: 30,
          winning_coin_type: 1,
          winning_coin: 15,
          battles_commission: 0,
          min_user_join: 0,
          max_user_join: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Quiz Tradicional',
          icon: 'fa-brain',
          description: 'Desafios educativos de múltipla escolha.',
          quiz_status: 1,
          category_status: 1,
          skill_status: 0,
          classification_status: 0,
          level_status: 0,
          quiz_sort_order: '1',
          total_questions: 10,
          quiz_duration: 45,
          joining_type: 1,
          joining_coin: 0,
          min_winning_percentage: 50,
          winning_coin_type: 1,
          winning_coin: 25,
          battles_commission: 0,
          min_user_join: 0,
          max_user_join: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 5,
          name: 'Verdadeiro ou Falso',
          icon: 'fa-check-double',
          description: 'Teste sua agilidade mental com perguntas diretas.',
          quiz_status: 1,
          category_status: 1,
          skill_status: 0,
          classification_status: 0,
          level_status: 0,
          quiz_sort_order: '1',
          total_questions: 10,
          quiz_duration: 30,
          joining_type: 1,
          joining_coin: 0,
          min_winning_percentage: 50,
          winning_coin_type: 1,
          winning_coin: 20,
          battles_commission: 0,
          min_user_join: 0,
          max_user_join: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 7,
          name: 'Auto-Desafio',
          icon: 'fa-crosshairs',
          description: 'Personalize perguntas e tempo.',
          quiz_status: 1,
          category_status: 1,
          skill_status: 0,
          classification_status: 0,
          level_status: 0,
          quiz_sort_order: '1',
          total_questions: 10,
          quiz_duration: 60,
          joining_type: 1,
          joining_coin: 0,
          min_winning_percentage: 50,
          winning_coin_type: 1,
          winning_coin: 30,
          battles_commission: 0,
          min_user_join: 0,
          max_user_join: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 9,
          name: 'Desafio Diário',
          icon: 'fa-calendar-day',
          description: 'Uma rodada diária especial com bônus.',
          quiz_status: 1,
          category_status: 0,
          skill_status: 0,
          classification_status: 0,
          level_status: 0,
          quiz_sort_order: '',
          total_questions: 10,
          quiz_duration: 45,
          joining_type: 1,
          joining_coin: 0,
          min_winning_percentage: 50,
          winning_coin_type: 1,
          winning_coin: 50,
          battles_commission: 0,
          min_user_join: 0,
          max_user_join: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 12,
          name: 'Simulados e Exames',
          icon: 'fa-file-alt',
          description: 'Testes completos no formato simulado educativo.',
          quiz_status: 1,
          category_status: 0,
          skill_status: 0,
          classification_status: 0,
          level_status: 0,
          quiz_sort_order: '',
          total_questions: 20,
          quiz_duration: 120,
          joining_type: 1,
          joining_coin: 0,
          min_winning_percentage: 60,
          winning_coin_type: 1,
          winning_coin: 100,
          battles_commission: 0,
          min_user_join: 0,
          max_user_join: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };
  }

  /**
   * Retorna questões de quiz para a categoria solicitada
   */
  async getQuestions(categoryId?: string, quizId?: string) {
    let quiz: any = null;

    if (categoryId && categoryId !== '0') {
      quiz = await this.prisma.quiz.findFirst({
        where: { categoryId, isActive: true },
        include: { questions: { include: { options: true } } },
      });
    }

    if (!quiz && quizId && quizId !== '0') {
      quiz = await this.prisma.quiz.findFirst({
        where: { id: quizId, isActive: true },
        include: { questions: { include: { options: true } } },
      });
    }

    if (!quiz) {
      quiz = await this.prisma.quiz.findFirst({
        where: { isActive: true },
        include: { questions: { include: { options: true } } },
      });
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return {
        status: 200,
        message: 'Nenhuma questão cadastrada',
        result: [],
      };
    }

    const formattedQuestions = quiz.questions.map((q: any) => {
      const opts = q.options || [];
      const correctOptIndex = opts.findIndex((o: any) => o.isCorrect);
      const answerLetter = correctOptIndex >= 0 ? ['A', 'B', 'C', 'D'][correctOptIndex] : 'A';
      const answerIndex = correctOptIndex >= 0 ? correctOptIndex + 1 : 1;

      return {
        id: q.id,
        quiz_id: quiz.id,
        category_id: quiz.categoryId,
        question: q.statement,
        explanation: q.explanation || 'Excelente resposta!',
        option_a: opts[0]?.text || '',
        option_b: opts[1]?.text || '',
        option_c: opts[2]?.text || '',
        option_d: opts[3]?.text || '',
        answer: answerLetter,
        correct_answer: answerIndex,
        points: q.pointsReward || 15,
        timer: quiz.timeLimit || 30,
        note: q.explanation || 'Conhecimento é poder.',
        status: 1,
      };
    });

    return {
      status: 200,
      message: 'success',
      result: formattedQuestions,
    };
  }

  /**
   * Salva resultado da rodada e credita as Quiz Coins no Ledger
   */
  async saveReport(data: {
    user_id?: string;
    quiz_id?: string;
    score?: number | string;
    total_questions?: number | string;
    correct_answers?: number | string;
  }) {
    const userId = data.user_id;
    const correctCount = Number(data.correct_answers) || 1;
    const pointsToCredit = Number(data.score) || (correctCount * 15);

    if (userId && pointsToCredit > 0) {
      try {
        await this.walletService.credit(
          userId,
          pointsToCredit,
          CurrencyType.QUIZ_COINS,
          'REWARD_CREDIT',
          `quiz_completion_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          `Recompensa por conclusão de quiz educativo (${data.quiz_id || 'geral'})`,
        );
        this.logger.log(`Creditadas ${pointsToCredit} Quiz Coins no Ledger para ${userId}`);
      } catch (err: any) {
        this.logger.warn(`Não foi possível creditar pontos no Ledger: ${err.message}`);
      }
    }

    const currentBalances = userId
      ? await this.walletService.getBalances(userId)
      : { quizCoins: pointsToCredit };

    return {
      status: 200,
      message: 'Relatório salvo e Quiz Coins creditadas com sucesso!',
      result: [
        {
          total_coins: currentBalances.quizCoins,
          score: pointsToCredit,
          correct_answers: correctCount,
        },
      ],
    };
  }

  /**
   * Catálogo de Recompensas (Produtos / Vouchers do Modelo A)
   */
  async getProducts() {
    const rewards = await this.prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { costPoints: 'asc' },
    });

    return {
      status: 200,
      message: 'success',
      result: rewards.map((r) => ({
        id: r.id,
        name: r.title,
        price: Number(r.costPoints),
        coin: Number(r.costPoints),
        image: '',
        description: `${r.description}\n\nParceiro: ${r.partnerName}\nTermos: ${r.termsAndConditions || 'Válido conforme disponibilidade.'}`,
        stock: r.stockQuantity,
        partner: r.partnerName,
        status: r.stockQuantity > 0 ? 1 : 0,
      })),
    };
  }

  /**
   * Extrato contábil da carteira do usuário
   */
  async getRewardTransactions(userId?: string) {
    if (!userId) {
      return { status: 200, message: 'success', result: [] };
    }

    const statement = await this.walletService.getStatement(userId, 1, 30);

    return {
      status: 200,
      message: 'success',
      result: statement.entries.map((e, index) => ({
        id: e.id,
        user_id: userId,
        point: Number(e.amount),
        status: e.amount > 0 ? 1 : 2, // 1 = credit, 2 = debit
        remark: e.description,
        created_at: e.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Avatares disponíveis
   */
  async getAvatars() {
    return {
      status: 200,
      message: 'success',
      result: [
        { id: 1, image: 'avatar1.png' },
        { id: 2, image: 'avatar2.png' },
        { id: 3, image: 'avatar3.png' },
        { id: 4, image: 'avatar4.png' },
      ],
    };
  }

  /**
   * Simulados e exames (safe fallback)
   */
  async getExam() {
    return {
      status: 200,
      message: 'success',
      result: [],
    };
  }

  /**
   * Desafio final / live contest (safe fallback)
   */
  async getLiveContest() {
    return {
      status: 200,
      message: 'success',
      result: [],
    };
  }

  /**
   * Níveis de dificuldade educativos
   */
  async getLevels() {
    return {
      status: 200,
      message: 'success',
      result: [
        { id: 1, name: 'Nível Básico', image: '', joining_coin: 0, sort_order: 1, status: 1, total_question: 10 },
        { id: 2, name: 'Nível Intermediário', image: '', joining_coin: 0, sort_order: 2, status: 1, total_question: 10 },
        { id: 3, name: 'Nível Avançado', image: '', joining_coin: 0, sort_order: 3, status: 1, total_question: 10 },
      ],
    };
  }

  /**
   * Habilidades / competências
   */
  async getSkills() {
    return {
      status: 200,
      message: 'success',
      result: [
        { id: 1, name: 'Geral', image: '', sort_order: 1, status: 1 },
      ],
    };
  }

  /**
   * Classificações temáticas
   */
  async getClassifications() {
    return {
      status: 200,
      message: 'success',
      result: [
        { id: 1, name: 'Padrão', image: '', sort_order: 1, status: 1 },
      ],
    };
  }
}

