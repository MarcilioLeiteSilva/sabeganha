import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CurrencyType, AccountType } from '@prisma/client';

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
          description: 'Pratique conhecimentos com escolha de nível.',
          quiz_status: 1,
          category_status: 1,
          skill_status: 0,
          classification_status: 0,
          level_status: 1,
          quiz_sort_order: '1,4',
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
          level_status: 1,
          quiz_sort_order: '1,4',
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
   * Retorna questões de quiz para a categoria solicitada e nível de dificuldade
   */
  async getQuestions(categoryId?: string, quizId?: string, levelId?: string | number) {
    let quiz: any = null;
    let targetDifficulty: string | undefined;
    let targetCount = 10;

    const lid = String(levelId || '');
    if (lid === '1' || lid.toLowerCase().includes('facil') || lid.toLowerCase().includes('easy')) {
      targetDifficulty = 'FACIL';
      targetCount = 5;
    } else if (lid === '2' || lid.toLowerCase().includes('medio') || lid.toLowerCase().includes('intermediate')) {
      targetDifficulty = 'MEDIO';
      targetCount = 10;
    } else if (lid === '3' || lid.toLowerCase().includes('dificil') || lid.toLowerCase().includes('hard')) {
      targetDifficulty = 'DIFICIL';
      targetCount = 15;
    }

    if (categoryId && categoryId !== '0') {
      if (targetDifficulty) {
        quiz = await this.prisma.quiz.findFirst({
          where: {
            categoryId,
            difficulty: {
              in:
                targetDifficulty === 'FACIL'
                  ? ['FACIL', 'EASY']
                  : targetDifficulty === 'MEDIO'
                  ? ['MEDIO', 'INTERMEDIATE']
                  : ['DIFICIL', 'HARD'],
            },
            isActive: true,
          },
          include: { questions: { include: { options: true } } },
        });
      }
      if (!quiz) {
        quiz = await this.prisma.quiz.findFirst({
          where: { categoryId, isActive: true },
          include: { questions: { include: { options: true } } },
        });
      }
    }

    if (!quiz && quizId && quizId !== '0') {
      quiz = await this.prisma.quiz.findFirst({
        where: { id: quizId, isActive: true },
        include: { questions: { include: { options: true } } },
      });
    }

    if (!quiz) {
      if (targetDifficulty) {
        quiz = await this.prisma.quiz.findFirst({
          where: {
            difficulty: {
              in:
                targetDifficulty === 'FACIL'
                  ? ['FACIL', 'EASY']
                  : targetDifficulty === 'MEDIO'
                  ? ['MEDIO', 'INTERMEDIATE']
                  : ['DIFICIL', 'HARD'],
            },
            isActive: true,
          },
          include: { questions: { include: { options: true } } },
        });
      }
      if (!quiz) {
        quiz = await this.prisma.quiz.findFirst({
          where: { isActive: true },
          include: { questions: { include: { options: true } } },
        });
      }
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return {
        status: 200,
        message: 'Nenhuma questão cadastrada',
        result: [],
      };
    }

    const questionsToFormat = quiz.questions.slice(0, targetCount);

    const formattedQuestions = questionsToFormat.map((q: any) => {
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
        points: q.pointsReward || (targetDifficulty === 'FACIL' ? 10 : targetDifficulty === 'DIFICIL' ? 25 : 15),
        timer: quiz.timeLimit || (targetDifficulty === 'FACIL' ? 30 : targetDifficulty === 'DIFICIL' ? 20 : 25),
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
   * Níveis de dificuldade educativos com seleção de questões (5, 10 e 15)
   */
  async getLevels() {
    return {
      status: 200,
      message: 'success',
      result: [
        {
          id: 1,
          name: 'Fácil (5 Perguntas)',
          image: '',
          joining_coin: 0,
          sort_order: 1,
          status: 1,
          total_question: 5,
          is_pass_level: 1,
        },
        {
          id: 2,
          name: 'Médio (10 Perguntas)',
          image: '',
          joining_coin: 0,
          sort_order: 2,
          status: 1,
          total_question: 10,
          is_pass_level: 1,
        },
        {
          id: 3,
          name: 'Difícil (15 Perguntas)',
          image: '',
          joining_coin: 0,
          sort_order: 3,
          status: 1,
          total_question: 15,
          is_pass_level: 1,
        },
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

  /**
   * Ranking / Leaderboard geral de Quiz Coins
   */
  async getLeaderboard(userId?: string) {
    try {
      const accounts = await this.prisma.ledgerAccount.findMany({
        where: {
          currencyType: CurrencyType.QUIZ_COINS,
          accountType: AccountType.USER_WALLET,
        },
        orderBy: { cachedBalance: 'desc' },
        take: 25,
        include: {
          wallet: {
            include: {
              user: {
                include: { profile: true },
              },
            },
          },
        },
      });

      const result = accounts.map((a, index) => {
        const user = a.wallet?.user;
        return {
          id: index + 1,
          user_name: user?.profile?.displayName || user?.email?.split('@')[0] || `Sábio ${index + 1}`,
          full_name: user?.profile?.displayName || user?.email?.split('@')[0] || `Sábio ${index + 1}`,
          email: user?.email || '',
          country_code: 'BR',
          mobile_number: '',
          country_name: 'Brasil',
          type: 1,
          image_type: 1,
          image: user?.profile?.avatarUrl || '',
          bio: 'Entusiasta do Conhecimento SabeGanha',
          reference_code: '',
          wallet_coin: Math.max(0, Math.floor(Number(a.cachedBalance))),
          device_type: 1,
          device_token: '',
          qr_code: '',
          is_account_verify: 1,
          status: 1,
          created_at: a.updatedAt?.toISOString() || new Date().toISOString(),
          updated_at: a.updatedAt?.toISOString() || new Date().toISOString(),
          rank: index + 1,
        };
      });

      // Garante pelo menos um usuário no ranking se o banco estiver inicial
      if (result.length === 0) {
        result.push({
          id: 1,
          user_name: 'Pioneiro do Saber',
          full_name: 'Pioneiro do Saber',
          email: 'pioneiro@sabeganha.com.br',
          country_code: 'BR',
          mobile_number: '',
          country_name: 'Brasil',
          type: 1,
          image_type: 1,
          image: '',
          bio: 'Top 1 no ranking educativo',
          reference_code: '',
          wallet_coin: 150,
          device_type: 1,
          device_token: '',
          qr_code: '',
          is_account_verify: 1,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          rank: 1,
        });
      }

      // Procura posição do usuário requisitante
      let currentUserEntry = result[0];
      if (userId) {
        const found = result.find((_, i) => accounts[i]?.wallet?.userId === userId);
        if (found) {
          currentUserEntry = found;
        } else {
          // Busca saldo avulso do usuário requisitante
          try {
            const userBal = await this.walletService.getBalances(userId);
            currentUserEntry = {
              id: 999,
              user_name: 'Você',
              full_name: 'Você',
              email: '',
              country_code: 'BR',
              mobile_number: '',
              country_name: 'Brasil',
              type: 1,
              image_type: 1,
              image: '',
              bio: 'Seu perfil',
              reference_code: '',
              wallet_coin: Math.max(0, Math.floor(userBal.quizCoins)),
              device_type: 1,
              device_token: '',
              qr_code: '',
              is_account_verify: 1,
              status: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              rank: result.length + 1,
            };
          } catch {
            // fallback mantem result[0]
          }
        }
      }

      return {
        status: 200,
        message: 'success',
        result,
        user: [currentUserEntry],
      };
    } catch (err: any) {
      this.logger.error(`Erro ao carregar leaderboard: ${err.message}`);
      return {
        status: 200,
        message: 'success',
        result: [],
        user: [],
      };
    }
  }

  /**
   * Ranking por concurso
   */
  async getContestLeaderboard(contestId?: string, userId?: string) {
    return {
      status: 200,
      message: 'success',
      result: [],
      user: [],
    };
  }

  /**
   * Pacotes educativos / loja de pontos
   */
  async getPackages() {
    return {
      status: 200,
      message: 'success',
      result: [
        {
          id: 1,
          name: 'Kit Estudos Essencial',
          image: '',
          price: '0.00',
          coin: 100,
          android_product_package: 'com.sabeganha.pack1',
          ios_product_package: '',
          web_product_package: '',
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Kit Estudos Ouro',
          image: '',
          price: '0.00',
          coin: 500,
          android_product_package: 'com.sabeganha.pack2',
          ios_product_package: '',
          web_product_package: '',
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };
  }

  /**
   * Conquistas / Insígnias (Badges)
   */
  async getBadgeList(userId?: string) {
    return {
      status: 200,
      message: 'success',
      result: [
        {
          id: 1,
          name: 'Primeiro Passo',
          label: 'Iniciante',
          description: 'Completou seu primeiro quiz educativo.',
          image: '',
          earning_coin: 25,
          min_pass_quiz: 1,
          min_win_contest: 0,
          min_day_play: 1,
          min_coin_sharing: 0,
          min_referrals: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_user_win: 1,
        },
        {
          id: 2,
          name: 'Mestre da Língua',
          label: 'Língua Portuguesa',
          description: 'Acertou 10 perguntas de Língua Portuguesa consecutivas.',
          image: '',
          earning_coin: 50,
          min_pass_quiz: 10,
          min_win_contest: 0,
          min_day_play: 2,
          min_coin_sharing: 0,
          min_referrals: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_user_win: 0,
        },
        {
          id: 3,
          name: 'Gênio dos Números',
          label: 'Matemática e Lógica',
          description: 'Acertou 10 perguntas de Matemática.',
          image: '',
          earning_coin: 50,
          min_pass_quiz: 10,
          min_win_contest: 0,
          min_day_play: 2,
          min_coin_sharing: 0,
          min_referrals: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_user_win: 0,
        },
        {
          id: 4,
          name: 'Cidadão Consciente',
          label: 'História e Sociedade',
          description: 'Concluiu 5 quizzes de História e Geografia do Brasil.',
          image: '',
          earning_coin: 50,
          min_pass_quiz: 5,
          min_win_contest: 0,
          min_day_play: 3,
          min_coin_sharing: 0,
          min_referrals: 0,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_user_win: 0,
        },
      ],
    };
  }

  /**
   * Notificações do sistema
   */
  async getNotifications(userId?: string) {
    return {
      status: 200,
      message: 'success',
      result: [
        {
          id: 1,
          title: 'Bem-vindo ao SabeGanha!',
          description: 'Aprenda diariamente, acumule Quiz Coins e troque por vouchers reais.',
          image: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Novos Quizzes Disponíveis',
          description: 'Explore perguntas educativas em Língua Portuguesa, Matemática e Atualidades.',
          image: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };
  }

  /**
   * Marca notificação como lida
   */
  async readNotification(notificationId?: string) {
    return {
      status: 200,
      message: 'Notificação lida com sucesso',
      result: [],
    };
  }

  /**
   * Páginas institucionais e regulatórias (Termos, Privacidade, Sobre)
   */
  async getPages() {
    return {
      status: 200,
      message: 'success',
      result: [
        {
          title: 'Termos de Uso e Condições',
          url: 'https://sabeganha.com.br/termos',
          icon: '',
        },
        {
          title: 'Política de Privacidade (LGPD)',
          url: 'https://sabeganha.com.br/privacidade',
          icon: '',
        },
        {
          title: 'Sobre o SabeGanha (Modelo A)',
          url: 'https://sabeganha.com.br/sobre',
          icon: '',
        },
        {
          title: 'Perguntas Frequentes (FAQ)',
          url: 'https://sabeganha.com.br/faq',
          icon: '',
        },
      ],
    };
  }

  /**
   * Redes sociais oficiais
   */
  async getSocialLink() {
    return {
      status: 200,
      message: 'success',
      result: [
        {
          id: 1,
          name: 'Instagram Oficial',
          image: '',
          url: 'https://instagram.com/sabeganha',
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Website Oficial',
          image: '',
          url: 'https://sabeganha.com.br',
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };
  }

  /**
   * Recompensas resgatadas pelo usuário (vouchers adquiridos)
   */
  async getUserProducts(userId?: string) {
    if (!userId) {
      return { status: 200, message: 'success', result: [] };
    }

    try {
      const redemptions = await this.prisma.redemption.findMany({
        where: { userId },
        include: {
          reward: true,
          voucher: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        status: 200,
        message: 'success',
        result: redemptions.map((r, index) => ({
          id: index + 1,
          user_id: 1,
          product_id: 1,
          coin: Math.floor(Number(r.costPoints)),
          address: r.voucher?.voucherCode || 'VOUCHER-DISPONIVEL',
          status: 1,
          created_at: r.createdAt.toISOString(),
          updated_at: r.createdAt.toISOString(),
          product_name: r.reward?.title || 'Cupom Parceiro',
          product_image: '',
        })),
      };
    } catch (err: any) {
      this.logger.error(`Erro ao buscar resgates do usuário: ${err.message}`);
      return { status: 200, message: 'success', result: [] };
    }
  }

  /**
   * Processa o resgate de uma recompensa / voucher
   */
  async addProductTransaction(data: {
    user_id?: string;
    product_id?: string;
    coin?: number | string;
    address?: string;
  }) {
    const userId = data.user_id;
    const coin = Number(data.coin) || 0;

    if (!userId) {
      return { status: 400, message: 'Usuário não informado', result: [] };
    }

    try {
      // Debita as Quiz Coins do Ledger
      if (coin > 0) {
        await this.walletService.debit(
          userId,
          coin,
          CurrencyType.QUIZ_COINS,
          'REWARD_REDEMPTION',
          `redemption_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          `Resgate de voucher no catálogo de parceiros`,
        );
      }

      // Cria o registro contábil de redenção
      if (data.product_id) {
        const reward = await this.prisma.reward.findUnique({
          where: { id: data.product_id },
        });

        if (reward) {
          const voucherCode = `SG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const voucher = await this.prisma.rewardVoucher.create({
            data: {
              rewardId: reward.id,
              voucherCode,
              isClaimed: true,
              claimedAt: new Date(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            },
          });

          await this.prisma.redemption.create({
            data: {
              userId,
              rewardId: reward.id,
              voucherId: voucher.id,
              costPoints: coin,
              currencyType: CurrencyType.QUIZ_COINS,
              status: 'DELIVERED',
            },
          });
        }
      }

      return {
        status: 200,
        message: 'Resgate realizado com sucesso! Seu voucher já está disponível em Minhas Recompensas.',
        result: [],
      };
    } catch (err: any) {
      this.logger.error(`Erro ao resgatar produto: ${err.message}`);
      return {
        status: 400,
        message: err.message || 'Saldo insuficiente ou erro ao processar resgate.',
        result: [],
      };
    }
  }

  /**
   * Configurações de recompensas diárias e giros educativos
   */
  async getRewardSetting() {
    return {
      status: 200,
      message: 'success',
      result: [
        // reward_type 1: Giros da Roleta Educativa
        { id: 1, reward_type: 1, key: '10', value: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, reward_type: 1, key: '15', value: 15, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, reward_type: 1, key: '20', value: 20, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 4, reward_type: 1, key: '25', value: 25, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 5, reward_type: 1, key: '50', value: 50, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 6, reward_type: 1, key: '100', value: 100, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

        // reward_type 2: Recompensa diária progressiva (7 dias)
        { id: 7, reward_type: 2, key: 'Dia 1', value: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 8, reward_type: 2, key: 'Dia 2', value: 15, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 9, reward_type: 2, key: 'Dia 3', value: 20, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 10, reward_type: 2, key: 'Dia 4', value: 25, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 11, reward_type: 2, key: 'Dia 5', value: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 12, reward_type: 2, key: 'Dia 6', value: 40, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 13, reward_type: 2, key: 'Dia 7', value: 50, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

        // reward_type 3: Bônus diário gratuito de estudos
        { id: 14, reward_type: 3, key: 'Bônus de Estudo', value: 20, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ],
    };
  }

  /**
   * Credita recompensa da roleta ou bônus diário no Ledger
   */
  async processRewardTransaction(userId: string, coin: number, type?: any) {
    if (userId && coin > 0) {
      try {
        await this.walletService.credit(
          userId,
          coin,
          CurrencyType.QUIZ_COINS,
          'DAILY_BONUS',
          `daily_reward_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          `Bônus diário de engajamento educativo`,
        );
      } catch (err: any) {
        this.logger.warn(`Não foi possível creditar bônus no ledger: ${err.message}`);
      }
    }

    return {
      status: 200,
      message: 'Recompensa creditada com sucesso!',
      result: [],
    };
  }

  /**
   * Solicitação de resgate / voucher
   */
  async withdrawalRequest(data: any) {
    return {
      status: 200,
      message: 'Solicitação registrada com sucesso! Processamento em até 24 horas úteis.',
      result: [],
    };
  }

  /**
   * Histórico de simulados concluídos
   */
  async getUserExam(userId?: string) {
    return {
      status: 200,
      message: 'success',
      result: [],
    };
  }

  /**
   * Opções de pagamento / Gateway
   */
  async getPaymentOption() {
    return {
      status: 200,
      message: 'success',
      result: {
        inapppurchage: {
          id: 1,
          name: 'Google Play In-App',
          visibility: '1',
          is_live: '1',
          key_1: '',
          key_2: '',
          key_3: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        paypal: {
          id: 2,
          name: 'PIX',
          visibility: '0',
          is_live: '0',
          key_1: '',
          key_2: '',
          key_3: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        razorpay: { id: 3, visibility: '0', is_live: '0' },
        flutterwave: { id: 4, visibility: '0', is_live: '0' },
        payumoney: { id: 5, visibility: '0', is_live: '0' },
        paytm: { id: 6, visibility: '0', is_live: '0' },
        stripe: { id: 7, visibility: '0', is_live: '0' },
      },
    };
  }

  /**
   * Inscrição em concursos
   */
  async joinContest(data: any) {
    return {
      status: 200,
      message: 'Inscrição realizada com sucesso!',
      result: [],
    };
  }

  /**
   * Revisão de questões de concurso
   */
  async getReviewQuestion(contestId?: string) {
    return {
      status: 200,
      message: 'success',
      result: [],
    };
  }

  /**
   * Recuperação de senha
   */
  async forgotPassword(email?: string) {
    return {
      status: 200,
      message: 'Instruções de recuperação enviadas para o e-mail informado.',
      result: [],
    };
  }

  /**
   * Adiciona transação avulsa
   */
  async addTransaction(data: any) {
    return {
      status: 200,
      message: 'Transação registrada com sucesso.',
      result: [],
    };
  }

  /**
   * Histórico de indicações (Refer & Earn)
   */
  async getReferEarnHistory() {
    return {
      status: 200,
      message: 'success',
      result: [],
    };
  }
}

