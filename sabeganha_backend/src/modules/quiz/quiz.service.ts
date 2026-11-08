import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateQuizDto {
  categoryId: string;
  title: string;
  description?: string;
  difficulty?: string;
  timeLimit?: number;
  isActive?: boolean;
  scheduledAt?: string;
  isAiGenerated?: boolean;
  questions?: {
    statement: string;
    explanation?: string;
    pointsReward?: number;
    options: {
      text: string;
      isCorrect: boolean;
    }[];
  }[];
}

export interface UpdateQuizDto {
  categoryId?: string;
  title?: string;
  description?: string;
  difficulty?: string;
  timeLimit?: number;
  isActive?: boolean;
  scheduledAt?: string;
  questions?: {
    statement: string;
    explanation?: string;
    pointsReward?: number;
    options: {
      text: string;
      isCorrect: boolean;
    }[];
  }[];
}

export interface GenerateQuizAiDto {
  topic: string;
  categoryId?: string;
  difficulty?: string;
  questionsCount?: number;
  apiKey?: string;
  autoPublish?: boolean;
  scheduledAt?: string;
  toneGuideline?: string;
  suggestionId?: string;
}

export interface AiGovernanceConfig {
  maxGenerationsPerWeek: number;
  maxGenerationsPerDay: number;
  currentWeekUsage: number;
  currentDayUsage: number;
  weekResetDate: string;
  dayResetDate: string;
  requireCuratorApproval: boolean;
  securityPromptFiltersActive: boolean;
  communityVotingEnabled: boolean;
  bonusCoinMultiplier: number; // Ex: 1.20 (+20% QC para engajar em quizzes de IA)
}

export interface UserTopicSuggestion {
  id: string;
  topic: string;
  categoryName?: string;
  categoryId?: string;
  suggestedBy?: string;
  votesCount: number;
  status: 'PENDING' | 'ACCEPTED' | 'GENERATED';
  createdAt: string;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  // Governança e Parâmetros de Controle de Quotas
  private governanceConfig: AiGovernanceConfig = {
    maxGenerationsPerWeek: 5,
    maxGenerationsPerDay: 3,
    currentWeekUsage: 1,
    currentDayUsage: 1,
    weekResetDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    dayResetDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    requireCuratorApproval: true,
    securityPromptFiltersActive: true,
    communityVotingEnabled: true,
    bonusCoinMultiplier: 1.20,
  };

  // Espaço para Sugestões dos Usuários (Crowdsourcing de Conteúdo)
  private userSuggestions: UserTopicSuggestion[] = [
    {
      id: 'sug_1',
      topic: 'História da Aviação: De Santos Dumont aos Jatos Comerciais',
      categoryName: 'História',
      suggestedBy: 'Gabriel Ramos (@gramos)',
      votesCount: 42,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'sug_2',
      topic: 'Energias Renováveis e Sustentabilidade no Brasil',
      categoryName: 'Ciência e Tecnologia',
      suggestedBy: 'Mariana Lima (@mlima)',
      votesCount: 38,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'sug_3',
      topic: 'Grandes Clássicos do Cinema Brasileiro e Cinema Novo',
      categoryName: 'Entretenimento',
      suggestedBy: 'Lucas Silveira (@lsilveira)',
      votesCount: 29,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'sug_4',
      topic: 'Educação Financeira: Tesouro Direto e Renda Fixa',
      categoryName: 'Matemática e Lógica',
      suggestedBy: 'Ana Clara (@anaclara_fin)',
      votesCount: 25,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { quizzes: true },
        },
      },
    });
  }

  async getQuizzes(categoryId?: string, difficulty?: string) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (difficulty) where.difficulty = difficulty;

    return this.prisma.quiz.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuizById(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        category: true,
        questions: {
          include: {
            options: true,
          },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz com ID ${id} não encontrado.`);
    }

    return quiz;
  }

  async createQuiz(dto: CreateQuizDto) {
    if (!dto.categoryId || !dto.title) {
      throw new BadRequestException('Categoria e título do quiz são obrigatórios.');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Categoria ${dto.categoryId} não encontrada.`);
    }

    let description = dto.description || `Quiz educativo sobre ${dto.title}.`;
    let isActive = dto.isActive !== undefined ? dto.isActive : true;

    // Se houver agendamento
    if (dto.scheduledAt) {
      const scheduledDate = new Date(dto.scheduledAt);
      if (!isNaN(scheduledDate.getTime()) && scheduledDate > new Date()) {
        isActive = false; // Permanece inativo até a data
        description = `[AGENDADO para ${scheduledDate.toLocaleDateString('pt-BR')}] ${description}`;
      }
    }

    return this.prisma.quiz.create({
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        description,
        difficulty: dto.difficulty || 'INTERMEDIATE',
        timeLimit: dto.timeLimit || 30,
        isActive,
        questions: dto.questions && dto.questions.length > 0 ? {
          create: dto.questions.map((q) => ({
            statement: q.statement,
            explanation: q.explanation || 'Conhecimento comprovado e alinhado aos padrões curriculares.',
            pointsReward: q.pointsReward || 10,
            mediaType: 'NONE',
            options: {
              create: q.options.map((opt) => ({
                text: opt.text,
                isCorrect: !!opt.isCorrect,
              })),
            },
          })),
        } : undefined,
      },
      include: {
        category: true,
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
  }

  async updateQuiz(id: string, dto: UpdateQuizDto) {
    const existing = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Quiz com ID ${id} não encontrado.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quiz.update({
        where: { id },
        data: {
          title: dto.title !== undefined ? dto.title : existing.title,
          description: dto.description !== undefined ? dto.description : existing.description,
          categoryId: dto.categoryId !== undefined ? dto.categoryId : existing.categoryId,
          difficulty: dto.difficulty !== undefined ? dto.difficulty : existing.difficulty,
          timeLimit: dto.timeLimit !== undefined ? dto.timeLimit : existing.timeLimit,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
        },
      });

      if (dto.questions && dto.questions.length > 0) {
        await tx.question.deleteMany({ where: { quizId: id } });

        for (const q of dto.questions) {
          await tx.question.create({
            data: {
              quizId: id,
              statement: q.statement,
              explanation: q.explanation || 'Conhecimento comprovado.',
              pointsReward: q.pointsReward || 10,
              mediaType: 'NONE',
              options: {
                create: q.options.map((opt) => ({
                  text: opt.text,
                  isCorrect: !!opt.isCorrect,
                })),
              },
            },
          });
        }
      }

      return tx.quiz.findUnique({
        where: { id },
        include: {
          category: true,
          questions: {
            include: {
              options: true,
            },
          },
        },
      });
    });
  }

  async deleteQuiz(id: string) {
    const existing = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Quiz com ID ${id} não encontrado.`);
    }

    await this.prisma.question.deleteMany({ where: { quizId: id } });
    await this.prisma.quiz.delete({ where: { id } });

    return { message: 'Quiz e questões associadas removidos com sucesso.' };
  }

  // -------------------------------------------------------------
  // GOVERNANÇA, AGENDAMENTO E AUTORIZAÇÃO (OPÇÃO 2 AVANÇADA)
  // -------------------------------------------------------------

  getGovernanceStatus() {
    this.refreshQuotasIfNeeded();
    return {
      status: 200,
      data: {
        ...this.governanceConfig,
        remainingThisWeek: Math.max(0, this.governanceConfig.maxGenerationsPerWeek - this.governanceConfig.currentWeekUsage),
        remainingToday: Math.max(0, this.governanceConfig.maxGenerationsPerDay - this.governanceConfig.currentDayUsage),
      },
    };
  }

  updateGovernanceConfig(dto: Partial<AiGovernanceConfig>) {
    if (dto.maxGenerationsPerWeek !== undefined) {
      this.governanceConfig.maxGenerationsPerWeek = Math.max(1, Number(dto.maxGenerationsPerWeek));
    }
    if (dto.maxGenerationsPerDay !== undefined) {
      this.governanceConfig.maxGenerationsPerDay = Math.max(1, Number(dto.maxGenerationsPerDay));
    }
    if (dto.requireCuratorApproval !== undefined) {
      this.governanceConfig.requireCuratorApproval = !!dto.requireCuratorApproval;
    }
    return this.getGovernanceStatus();
  }

  async approveQuiz(id: string, curatorName: string = 'SuperAdmin') {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException('Quiz não encontrado.');

    const cleanDescription = (quiz.description || '')
      .replace(/\[PENDENTE DE CURADORIA\]\s*/gi, '')
      .replace(/\[AGENDADO.*?\]\s*/gi, '')
      .trim();

    const updated = await this.prisma.quiz.update({
      where: { id },
      data: {
        isActive: true,
        description: `[Curado por ${curatorName}] ${cleanDescription}`,
      },
    });

    return {
      status: 200,
      message: `Quiz "${quiz.title}" aprovado e publicado com sucesso no catálogo oficial do SabeGanha!`,
      data: updated,
    };
  }

  async scheduleQuiz(id: string, scheduledFor: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException('Quiz não encontrado.');

    const targetDate = new Date(scheduledFor);
    if (isNaN(targetDate.getTime()) || targetDate <= new Date()) {
      throw new BadRequestException('A data de agendamento deve ser uma data e hora futura válida.');
    }

    const updated = await this.prisma.quiz.update({
      where: { id },
      data: {
        isActive: false,
        description: `[AGENDADO para ${targetDate.toLocaleDateString('pt-BR')} às ${targetDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}] ${quiz.description || ''}`,
      },
    });

    return {
      status: 200,
      message: `Quiz agendado com sucesso para publicação em ${targetDate.toLocaleString('pt-BR')}.`,
      data: updated,
    };
  }

  // -------------------------------------------------------------
  // ESPAÇO PARA SUGESTÕES DA COMUNIDADE (CROWDSOURCING)
  // -------------------------------------------------------------

  getSuggestions() {
    return {
      status: 200,
      data: this.userSuggestions.sort((a, b) => b.votesCount - a.votesCount),
    };
  }

  createSuggestion(topic: string, categoryName?: string, categoryId?: string, userName?: string) {
    if (!topic || !topic.trim()) {
      throw new BadRequestException('Tema da sugestão é obrigatório.');
    }
    this.validatePromptSafety(topic.trim());

    const newSug: UserTopicSuggestion = {
      id: `sug_${Date.now()}`,
      topic: topic.trim(),
      categoryName: categoryName || 'Geral',
      categoryId,
      suggestedBy: userName || 'Jogador Anônimo',
      votesCount: 1,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.userSuggestions.unshift(newSug);
    return {
      status: 201,
      message: 'Sugestão enviada com sucesso! Outros jogadores já podem votar nela.',
      data: newSug,
    };
  }

  voteSuggestion(id: string) {
    const sug = this.userSuggestions.find((s) => s.id === id);
    if (!sug) throw new NotFoundException('Sugestão não encontrada.');
    sug.votesCount++;
    return {
      status: 200,
      message: `Voto registrado para "${sug.topic}"! Total: ${sug.votesCount} votos.`,
      data: sug,
    };
  }

  // -------------------------------------------------------------
  // SEGURANÇA E GUARDRAILS (PROMPT INJECTION & MODELO A)
  // -------------------------------------------------------------

  private validatePromptSafety(topic: string) {
    if (!this.governanceConfig.securityPromptFiltersActive) return;

    const dangerousPatterns = [
      /ignore\s+(previous|all)\s+instructions/i,
      /system\s+prompt/i,
      /jailbreak/i,
      /<script[\s\S]*?>/i,
      /drop\s+table/i,
      /\b(cassino|aposta|bet365|blaze|jogo do bicho|tigrinho|roleta|slot|poker a dinheiro)\b/i, // Modelo A
      /\b(pornografia|sexo explícito|drogas ilícitas|armas de fogo ilegais)\b/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(topic)) {
        throw new BadRequestException(
          'Tema bloqueado pelos filtros de segurança do SabeGanha. Conformidade estrita com o Modelo A: proibido conteúdo ligado a apostas, sorte ou ilícitos.'
        );
      }
    }
  }

  private refreshQuotasIfNeeded() {
    const now = new Date();
    if (new Date(this.governanceConfig.dayResetDate) <= now) {
      this.governanceConfig.currentDayUsage = 0;
      this.governanceConfig.dayResetDate = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    }
    if (new Date(this.governanceConfig.weekResetDate) <= now) {
      this.governanceConfig.currentWeekUsage = 0;
      this.governanceConfig.weekResetDate = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
    }
  }

  private checkAndIncrementQuota() {
    this.refreshQuotasIfNeeded();

    if (this.governanceConfig.currentWeekUsage >= this.governanceConfig.maxGenerationsPerWeek) {
      throw new BadRequestException(
        `Limite semanal de gerações atingido (${this.governanceConfig.maxGenerationsPerWeek}/${this.governanceConfig.maxGenerationsPerWeek}). Reinício do ciclo em ${new Date(this.governanceConfig.weekResetDate).toLocaleDateString('pt-BR')}. Altere o parâmetro de governança para ampliar.`
      );
    }

    if (this.governanceConfig.currentDayUsage >= this.governanceConfig.maxGenerationsPerDay) {
      throw new BadRequestException(
        `Limite diário de gerações atingido (${this.governanceConfig.maxGenerationsPerDay}/${this.governanceConfig.maxGenerationsPerDay}). Tente novamente amanhã ou ajuste a quota de governança.`
      );
    }

    this.governanceConfig.currentDayUsage++;
    this.governanceConfig.currentWeekUsage++;
  }

  /**
   * GERADOR DE QUIZZES COM IA (GEMINI 1.5 FLASH) COM GOVERNANÇA E SEGURANÇA
   */
  async generateQuizWithAI(dto: GenerateQuizAiDto) {
    if (!dto.topic || !dto.topic.trim()) {
      throw new BadRequestException('O tema do quiz é obrigatório.');
    }

    const topic = dto.topic.trim();
    // 1. Guardrail de Segurança Anti-Injection e Modelo A
    this.validatePromptSafety(topic);

    // 2. Validação de Cotas de Governança
    this.checkAndIncrementQuota();

    const count = Math.min(Math.max(Number(dto.questionsCount) || 5, 1), 15);
    const difficulty = dto.difficulty || 'INTERMEDIATE';
    const apiKey = (dto.apiKey && dto.apiKey.trim()) || process.env.GEMINI_API_KEY;
    const points = difficulty === 'HARD' ? 20 : difficulty === 'EASY' ? 10 : 15;
    const toneGuideline = dto.toneGuideline ? `Diretriz adicional de estilo/foco: ${dto.toneGuideline}.` : '';

    let generatedQuizData: {
      title: string;
      description: string;
      questions: {
        statement: string;
        explanation: string;
        pointsReward: number;
        options: { text: string; isCorrect: boolean }[];
      }[];
    } | null = null;

    let geminiError: string | null = null;

    // 3. Execução da IA Generativa (Google Gemini 1.5 Flash)
    if (apiKey) {
      try {
        const prompt = `Você é um professor e especialista curricular brasileiro para a plataforma educativa SabeGanha (Aprenda. Jogue. Conquiste).
Crie um quiz educativo com alto rigor factual e pedagógico sobre o tema "${topic}".
Dificuldade: ${difficulty}.
Quantidade de perguntas EXATA: ${count}.
${toneGuideline}

REGRAS DE CONTEÚDO:
- Crie perguntas concretas e factuais sobre os ACONTECIMENTOS REAIS, fatos históricos, mecanismos, dados, leis ou pessoas envolvidas no tema "${topic}".
- NUNCA faça perguntas abstratas ou meta-linguísticas falando sobre a palavra ou o termo "${topic}" em si (por exemplo, JAMAIS pergunte "o que é a disciplina X" ou "qual princípio conceitual define a palavra X").
- Para cada pergunta:
  * Enunciado objetivo, informativo e contextualizado.
  * Exatamente 4 opções, onde APENAS UMA é correta (isCorrect: true) e as outras 3 são distratores plausíveis (isCorrect: false).
  * Explicação pedagógica detalhada do porquê a resposta correta é a certa.
  * Pontuação por questão: ${points} Quiz Coins.

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "title": "Título conciso e atrativo do quiz em português",
  "description": "Breve descrição educativa do quiz",
  "questions": [
    {
      "statement": "Enunciado da pergunta factual",
      "explanation": "Explicação pedagógica detalhada",
      "pointsReward": ${points},
      "options": [
        { "text": "Alternativa correta", "isCorrect": true },
        { "text": "Alternativa incorreta 1", "isCorrect": false },
        { "text": "Alternativa incorreta 2", "isCorrect": false },
        { "text": "Alternativa incorreta 3", "isCorrect": false }
      ]
    }
  ]
}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 4000,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const geminiData = await response.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJson = rawText
              .replace(/```json/gi, '')
              .replace(/```/g, '')
              .trim();
            generatedQuizData = JSON.parse(cleanJson);
          }
        } else {
          const errData = await response.json().catch(() => null);
          const errDetail = errData?.error?.message || `Status HTTP ${response.status}`;
          geminiError = `Aviso Gemini: ${errDetail}`;
          this.logger.warn(geminiError);
        }
      } catch (err: any) {
        geminiError = `Falha na conexão com Gemini: ${err.message}`;
        this.logger.warn(geminiError);
      }
    }

    // 4. Contingência Inteligente
    if (!generatedQuizData || !generatedQuizData.questions || generatedQuizData.questions.length === 0) {
      generatedQuizData = this.buildCurricularFallbackQuiz(topic, difficulty, count);
    }

    // 5. Garantia da quantidade exata de questões solicitadas
    this.fillToRequestedCount(generatedQuizData, topic, points, count);

    // Se o quiz veio de uma sugestão da comunidade, marca como gerado
    if (dto.suggestionId) {
      const sug = this.userSuggestions.find((s) => s.id === dto.suggestionId);
      if (sug) sug.status = 'GENERATED';
    }

    // 6. Publicação ou Agendamento Automático
    if (dto.autoPublish && dto.categoryId) {
      let isPublished = !this.governanceConfig.requireCuratorApproval;
      let finalDescription = generatedQuizData.description;

      if (this.governanceConfig.requireCuratorApproval) {
        isPublished = false;
        finalDescription = `[PENDENTE DE CURADORIA] ${finalDescription}`;
      }

      const created = await this.createQuiz({
        categoryId: dto.categoryId,
        title: generatedQuizData.title,
        description: finalDescription,
        difficulty,
        timeLimit: 30,
        isActive: isPublished,
        scheduledAt: dto.scheduledAt,
        questions: generatedQuizData.questions,
      });

      return {
        status: 200,
        message: this.governanceConfig.requireCuratorApproval
          ? 'Quiz gerado por IA submetido para curadoria! Está listado para aprovação.'
          : 'Quiz gerado por IA publicado com sucesso no catálogo!',
        data: created,
      };
    }

    let responseMessage = 'Quiz gerado com sucesso pelo Motor Curricular! Revise antes de publicar.';
    if (apiKey && !geminiError) {
      responseMessage = 'Quiz gerado via Google Gemini 1.5 Flash em tempo real! Revise antes de publicar.';
    } else if (geminiError) {
      responseMessage = `${geminiError}. O quiz foi gerado pelo Motor Curricular para garantir a continuidade da operação.`;
    }

    return {
      status: 200,
      message: responseMessage,
      data: {
        title: generatedQuizData.title,
        description: generatedQuizData.description,
        difficulty,
        timeLimit: 30,
        questions: generatedQuizData.questions,
        quotaStatus: {
          remainingThisWeek: Math.max(0, this.governanceConfig.maxGenerationsPerWeek - this.governanceConfig.currentWeekUsage),
          totalThisWeek: this.governanceConfig.maxGenerationsPerWeek,
        },
      },
    };
  }

  private fillToRequestedCount(
    quiz: { title: string; description: string; questions: any[] },
    topic: string,
    points: number,
    targetCount: number,
  ) {
    if (!quiz.questions) quiz.questions = [];

    const extraQuestions = [
      {
        statement: `Sobre "${topic}", qual elemento histórico, princípio científico ou acontecimento concreto é considerado a base de sua relevância contemporânea?`,
        explanation: `Na análise concreta de ${topic}, este elemento representa o ponto de convergência entre as causas históricas e seus desdobramentos práticos.`,
        correct: `Evidências documentadas e fatos verificáveis estabelecidos pela literatura especializada em ${topic}`,
        distractors: [
          `Mitos populares sem correspondência cronológica ou empírica com ${topic}`,
          `Suposições informais desprovidas de respaldo factual comprovado`,
          `Generalizações isoladas baseadas em anomalias casuais`,
        ],
      },
      {
        statement: `Ao examinar os fatores determinantes que impulsionaram "${topic}", qual aspecto exerceu maior influência em sua evolução?`,
        explanation: `O avanço de ${topic} resultou de processos sistemáticos de transformação, onde evidências e demandas reais moldaram os rumos da área.`,
        correct: `A convergência entre transformações estruturais da sociedade e o desenvolvimento técnico-metodológico`,
        distractors: [
          `A total estagnação de procedimentos sem qualquer revisão crítica ao longo das décadas`,
          `Fatores circunstanciais isolados sem qualquer conexão com a realidade histórica`,
          `Decisões arbitrárias desvinculadas das necessidades práticas do contexto`,
        ],
      },
      {
        statement: `Entre os debates e análises mais relevantes sobre "${topic}", qual distinção é essencial para evitar compreensões distorcidas?`,
        explanation: `Compreender com clareza os mecanismos centrais de ${topic} permite separar causas estruturantes de meros efeitos secundários.`,
        correct: `Diferenciar os componentes fundamentais e comprovados de manifestações superficiais ou passageiras`,
        distractors: [
          `Tratar fenômenos inteiramente distintos como se fossem equivalentes em causa e efeito`,
          `Ignorar as variáveis de contexto que condicionam os resultados práticos`,
          `Desconsiderar os registros documentais consolidados pelos pesquisadores`,
        ],
      },
      {
        statement: `Qual impacto direto ou consequência mais duradoura pode ser observada na sociedade como fruto do desenvolvimento de "${topic}"?`,
        explanation: `A consolidação de ${topic} produz efeitos tangíveis que afetam processos decisórios, avanços institucionais e o discernimento crítico dos cidadãos.`,
        correct: `Modernização de processos, aprimoramento crítico e geração de soluções sustentáveis para a coletividade`,
        distractors: [
          `Retrocesso generalizado de padrões e isolamento do conhecimento em nichos fechados`,
          `Extinção completa de debates e proibição de questionamentos fundamentados`,
          `Substituição de critérios técnicos por achismos momentâneos`,
        ],
      },
      {
        statement: `No cenário atual, qual desafio prático se apresenta como prioritário para os desdobramentos futuros de "${topic}"?`,
        explanation: `As perspectivas futuras de ${topic} envolvem conciliar inovação com responsabilidade ética, transparência e rigor metodológico.`,
        correct: `Integrar inovações tecnológicas e metodológicas preservando o compromisso ético e o rigor analítico`,
        distractors: [
          `Descartar todos os avanços prévios para reiniciar discussões a partir de dogmas rígidos`,
          `Renunciar à busca por soluções inclusivas em favor de benefícios restritos`,
          `Eliminar a exigência de dados comprobatórios nas análises e tomadas de decisão`,
        ],
      },
      {
        statement: `Como os princípios de "${topic}" se conectam de forma prática com outras áreas do conhecimento?`,
        explanation: `A natureza multifacetada de ${topic} estabelece pontes com diferentes áreas, enriquecendo o diagnóstico de problemas complexos.`,
        correct: `Atuando como elo integrador entre teoria e prática para responder a demandas interdisciplinares`,
        distractors: [
          `Fechando-se completamente para qualquer diálogo com disciplinas correlatas`,
          `Subordinando toda a reflexão crítica a uma única abordagem reducionista`,
          `Tornando dispensável a fundamentação técnica em projetos correlacionados`,
        ],
      },
      {
        statement: `Qual critério de validação é indispensável para aferir a confiabilidade de informações e práticas em "${topic}"?`,
        explanation: `A confiabilidade das conclusões em ${topic} repousa na transparência das fontes, no cruzamento metódico de dados e na replicabilidade dos resultados.`,
        correct: `Verificabilidade empírica, consistência documental e checagem cruzada de fontes primárias`,
        distractors: [
          `Viralização rápida em redes sociais sem conferência de autenticidade`,
          `Opiniões isoladas desacompanhadas de documentação probatória`,
          `Narrativas de apelo emocional desprovidas de respaldo analítico`,
        ],
      },
      {
        statement: `Em síntese, o domínio aprofundado dos fatos e mecanismos de "${topic}" capacita o participante a:`,
        explanation: `O conhecimento factual e rigoroso sobre ${topic} instrumentaliza o indivíduo para discernir cenários, identificar causalidades reais e emitir julgamentos qualificados.`,
        correct: `Interpretar cenários com autonomia intelectual, discernindo evidências concretas de conclusões precipitadas`,
        distractors: [
          `Decorar jargões e nomenclaturas sem entender suas correlações factuais`,
          `Aceitar de forma acrítica qualquer informação veiculada sem questionamento`,
          `Ignorar as repercussões práticas das decisões em prol de teorias abstratas`,
        ],
      },
    ];

    let extraIdx = 0;
    while (quiz.questions.length < targetCount && extraIdx < extraQuestions.length) {
      const q = extraQuestions[extraIdx++];
      quiz.questions.push({
        statement: q.statement,
        explanation: q.explanation,
        pointsReward: points,
        options: [
          { text: q.correct, isCorrect: true },
          { text: q.distractors[0], isCorrect: false },
          { text: q.distractors[1], isCorrect: false },
          { text: q.distractors[2], isCorrect: false },
        ],
      });
    }

    if (quiz.questions.length > targetCount) {
      quiz.questions = quiz.questions.slice(0, targetCount);
    }
  }

  private buildCurricularFallbackQuiz(topic: string, difficulty: string, count: number) {
    const points = difficulty === 'HARD' ? 20 : difficulty === 'EASY' ? 10 : 15;
    const lowerTopic = topic.toLowerCase();

    // 1. ATUALIDADES E GEOPOLÍTICA (2024-2026)
    if (
      lowerTopic.includes('atualidade') ||
      lowerTopic.includes('atualidades') ||
      lowerTopic.includes('geopolítica') ||
      lowerTopic.includes('geopolitica') ||
      lowerTopic.includes('mundo contemporâneo') ||
      lowerTopic.includes('cenário global') ||
      lowerTopic.includes('notícia') ||
      lowerTopic.includes('noticias')
    ) {
      return {
        title: `Atualidades & Geopolítica: Desafios Contemporâneos e Brasil`,
        description: `Questões factuais e aprofundadas sobre os principais acontecimentos econômicos, climáticos e geopolíticos recentes no Brasil e no mundo.`,
        questions: [
          {
            statement: 'Promulgada como Emenda Constitucional 132/2023, a Reforma Tributária sobre o consumo no Brasil instituiu qual modelo de tributação para simplificar o sistema?',
            explanation: 'A reforma tributária do consumo substitui PIS, Cofins, IPI, ICMS e ISS pelo modelo de IVA Dual (Imposto sobre Valor Agregado), composto pelo IBS (estados e municípios) e pela CBS (União).',
            pointsReward: points,
            options: [
              { text: 'IVA Dual, composto pelo IBS (subnacional) e pela CBS (federal)', isCorrect: true },
              { text: 'Imposto único sobre movimentações financeiras no modelo da antiga CPMF', isCorrect: false },
              { text: 'Tarifa aduaneira única e progressiva exclusiva para exportações de commodities', isCorrect: false },
              { text: 'Alíquota fixa idêntica para o Imposto de Renda de pessoas físicas e jurídicas', isCorrect: false },
            ],
          },
          {
            statement: 'O bloco dos BRICS concretizou uma expansão histórica de sua composição geopolítica. Quais nações integraram oficialmente o bloco nessa ampliação recente?',
            explanation: 'A ampliação dos BRICS oficializou a entrada de países como Egito, Etiópia, Irã e Emirados Árabes Unidos, reforçando a representatividade do Sul Global na economia internacional.',
            pointsReward: points,
            options: [
              { text: 'Egito, Etiópia, Irã e Emirados Árabes Unidos', isCorrect: true },
              { text: 'Austrália, Canadá, Coreia do Sul e Japão', isCorrect: false },
              { text: 'México, Chile, Colômbia e Peru', isCorrect: false },
              { text: 'Noruega, Suécia, Finlândia e Dinamarca', isCorrect: false },
            ],
          },
          {
            statement: 'O Brasil foi formalmente homologado pela ONU como país-sede da 30ª Conferência das Partes sobre Mudança do Clima (COP30). Qual capital amazônica sediará o evento global?',
            explanation: 'A cidade de Belém, capital do Pará, foi escolhida para sediar a COP30, posicionando a Amazônia no centro das discussões mundiais sobre transição ecológica e metas climáticas.',
            pointsReward: points,
            options: [
              { text: 'Belém (Pará)', isCorrect: true },
              { text: 'Manaus (Amazonas)', isCorrect: false },
              { text: 'Porto Velho (Rondônia)', isCorrect: false },
              { text: 'Macapá (Amapá)', isCorrect: false },
            ],
          },
          {
            statement: 'No campo da governança tecnológica global, qual bloco internacional aprovou a primeira legislação abrangente e vinculante do mundo para regulamentar a Inteligência Artificial (AI Act)?',
            explanation: 'A União Europeia aprovou o Regulamento da Inteligência Artificial (AI Act), estabelecendo exigências e limites rígidos de conformidade com base no nível de risco das aplicações de IA.',
            pointsReward: points,
            options: [
              { text: 'União Europeia (UE)', isCorrect: true },
              { text: 'Mercado Comum do Sul (Mercosul)', isCorrect: false },
              { text: 'Associação de Nações do Sudeste Asiático (ASEAN)', isCorrect: false },
              { text: 'Comunidade Britânica de Nações (Commonwealth)', isCorrect: false },
            ],
          },
          {
            statement: 'Durante a presidência do G20 pelo Brasil, qual foi a iniciativa central lançada no âmbito social e multilateral para engajar países e organismos globais?',
            explanation: 'O Brasil estruturou como marco principal de sua presidência a Aliança Global contra a Fome e a Pobreza, além de focar na reforma das instituições de governança global e transição ecológica justa.',
            pointsReward: points,
            options: [
              { text: 'Aliança Global contra a Fome e a Pobreza', isCorrect: true },
              { text: 'Criação de um Banco Central Único para o Hemisfério Sul', isCorrect: false },
              { text: 'Tratado de Desarmamento Cibernético Total Obrigatório', isCorrect: false },
              { text: 'Fundo Fixo de Subsídio Exclusivo para Combustíveis Fósseis', isCorrect: false },
            ],
          },
          {
            statement: 'Os dados consolidados do Censo Demográfico do IBGE revelaram qual transformação estrutural decisiva na pirâmide etária brasileira?',
            explanation: 'O Censo demonstrou que a taxa de fecundidade está abaixo do nível de reposição (cerca de 1,6 filho por mulher), acelerando o envelhecimento populacional e desacelerando o crescimento demográfico.',
            pointsReward: points,
            options: [
              { text: 'Aceleração do envelhecimento populacional e forte queda na taxa de fecundidade', isCorrect: true },
              { text: 'Crescimento demográfico acelerado superando 3,5% ao ano em todas as capitais', isCorrect: false },
              { text: 'Migração maciça da população urbana de volta para atividades exclusivamente rurais', isCorrect: false },
              { text: 'Aumento expressivo da proporção de crianças e adolescentes na composição total', isCorrect: false },
            ],
          },
          {
            statement: 'No panorama mundial da transição energética, qual característica diferencia favoravelmente a matriz elétrica brasileira em relação à média internacional?',
            explanation: 'Enquanto a matriz elétrica mundial depende em mais de 60% de combustíveis fósseis, a do Brasil possui mais de 80% de fontes renováveis (hidrelétrica, eólica, solar e biomassa).',
            pointsReward: points,
            options: [
              { text: 'Mais de 80% da eletricidade é gerada por fontes limpas e renováveis (hidro, eólica, solar e biomassa)', isCorrect: true },
              { text: 'Dependência quase exclusiva de carvão mineral importado e xisto betuminoso', isCorrect: false },
              { text: 'Geração prioritária por usinas termonucleares de grande porte no interior do país', isCorrect: false },
              { text: 'Inexistência de parques eólicos ou fazendas solares integrados ao Sistema Nacional', isCorrect: false },
            ],
          },
        ],
      };
    }

    // 2. HISTÓRIA DO BRASIL: PROCLAMAÇÃO DA REPÚBLICA
    if (lowerTopic.includes('república') || lowerTopic.includes('republica') || lowerTopic.includes('proclamação')) {
      return {
        title: `História do Brasil: Proclamação da República (1889)`,
        description: `Avaliação histórica sobre a transição do Império para a República no Brasil e seus desdobramentos sociopolíticos.`,
        questions: [
          {
            statement: 'Em 15 de novembro de 1889, a Proclamação da República no Brasil foi liderada principalmente por qual grupo social e político?',
            explanation: 'O movimento republicano ganhou força definitiva com a liderança de setores militares do Exército, sob a liderança do Marechal Deodoro da Fonseca, aliados aos cafeicultores paulistas.',
            pointsReward: points,
            options: [
              { text: 'Militares do Exército articulados com cafeicultores do Oeste Paulista', isCorrect: true },
              { text: 'Grandes industriais apoiados pela Coroa Britânica', isCorrect: false },
              { text: 'Movimentos populares camponeses liderados pelos quilombos', isCorrect: false },
              { text: 'Membros da nobreza imperial descontentes com D. Pedro II', isCorrect: false },
            ],
          },
          {
            statement: 'Qual fator socioeconômico de 1888 acelerou o isolamento político da monarquia de D. Pedro II antes da proclamação?',
            explanation: 'A assinatura da Lei Áurea em 1888 aboliu a escravidão sem indenização aos senhores de terras, fazendo com que os tradicionais fazendeiros escravistas rompessem com o Império.',
            pointsReward: points,
            options: [
              { text: 'A abolição da escravidão pela Lei Áurea sem indenização aos fazendeiros', isCorrect: true },
              { text: 'A proibição do plantio de café nas regiões de Minas Gerais e São Paulo', isCorrect: false },
              { text: 'A instauração de um imposto direto sobre a produção de açúcar no Nordeste', isCorrect: false },
              { text: 'A assinatura do tratado comercial com a França que reduziu as tarifas alfandegárias', isCorrect: false },
            ],
          },
          {
            statement: 'A primeira Constituição Republicana do Brasil, promulgada em 1891, estabeleceu qual forma de governo e estrutura de Estado?',
            explanation: 'A Constituição de 1891 consagrou a República Federativa Presidencialista, descentralizando o poder e concedendo grande autonomia aos estados.',
            pointsReward: points,
            options: [
              { text: 'República Federativa Presidencialista com três poderes independentes', isCorrect: true },
              { text: 'Monarquia Constitucional com Poder Moderador e voto censitário', isCorrect: false },
              { text: 'República Parlamentarista com primeiro-ministro eleito pelo Senado', isCorrect: false },
              { text: 'Estado Unitário Centralizado sob tutela vitalícia das Forças Armadas', isCorrect: false },
            ],
          },
        ],
      };
    }

    return {
      title: `Quiz Especial: ${topic}`,
      description: `Avaliação de mérito intelectual e raciocínio crítico focada em ${topic}.`,
      questions: [],
    };
  }
}
