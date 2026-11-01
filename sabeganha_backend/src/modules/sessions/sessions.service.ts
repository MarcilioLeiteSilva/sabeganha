import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CurrencyType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface AnswerSubmission {
  questionId: string;
  selectedOptionId: string;
  responseTimeMs: number;
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Inicializa uma sessão de quiz retornando as questões sem respostas corretas
   */
  async startSession(userId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId, isActive: true },
      include: {
        questions: {
          include: {
            options: {
              select: {
                id: true,
                text: true,
                // Omitido isCorrect propositalmente
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz não encontrado ou inativo.');
    }

    if (quiz.questions.length === 0) {
      throw new BadRequestException('Este quiz ainda não possui perguntas cadastradas.');
    }

    const sessionToken = uuidv4();

    // Embaralha alternativas de cada questão no servidor
    const sanitizedQuestions = quiz.questions.map((q) => {
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      return {
        id: q.id,
        statement: q.statement,
        mediaUrl: q.mediaUrl,
        mediaType: q.mediaType,
        pointsReward: q.pointsReward,
        options: shuffledOptions,
      };
    });

    const session = await this.prisma.quizSession.create({
      data: {
        userId,
        quizId,
        sessionToken,
        totalQuestions: quiz.questions.length,
        status: 'IN_PROGRESS',
      },
    });

    return {
      sessionId: session.id,
      sessionToken,
      quizTitle: quiz.title,
      timeLimitSeconds: quiz.timeLimit * quiz.questions.length,
      questions: sanitizedQuestions,
    };
  }

  /**
   * Avalia a submissão, processa integridade, credita moedas no Ledger e retorna explicações
   */
  async submitSession(
    userId: string,
    sessionToken: string,
    answers: AnswerSubmission[],
    idempotencyKey: string,
  ) {
    const session = await this.prisma.quizSession.findUnique({
      where: { sessionToken },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Sessão de quiz não encontrada.');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Esta sessão já foi concluída ou cancelada.');
    }

    let correctCount = 0;
    let earnedCoins = 0;
    const reviewDetails: any[] = [];

    // Avaliação questão a questão
    for (const q of session.quiz.questions) {
      const userAns = answers.find((a) => a.questionId === q.id);
      const correctOption = q.options.find((opt) => opt.isCorrect);

      const isCorrect =
        !!userAns && !!correctOption && userAns.selectedOptionId === correctOption.id;

      if (isCorrect) {
        correctCount++;
        earnedCoins += q.pointsReward;
      }

      // Checagem de velocidade biológica (antifraude)
      if (userAns && userAns.responseTimeMs < 800) {
        this.logger.warn(
          `Alerta antifraude: Usuário ${userId} respondeu a pergunta ${q.id} em ${userAns.responseTimeMs}ms`,
        );
        await this.prisma.fraudEvent.create({
          data: {
            userId,
            severity: 'MEDIUM',
            eventType: 'SPEED_ANOMALY',
            payloadJson: {
              questionId: q.id,
              responseTimeMs: userAns.responseTimeMs,
            },
          },
        });
      }

      reviewDetails.push({
        questionId: q.id,
        statement: q.statement,
        explanation: q.explanation, // Pílula pedagógica
        selectedOptionId: userAns?.selectedOptionId || null,
        correctOptionId: correctOption?.id,
        isCorrect,
      });
    }

    // Atualiza status da sessão
    await this.prisma.quizSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        correctCount,
        earnedCoins,
        completedAt: new Date(),
      },
    });

    // Se conquistou moedas, credita atomicamente no Ledger Contábil
    let walletResult = null;
    if (earnedCoins > 0) {
      walletResult = await this.walletService.credit(
        userId,
        earnedCoins,
        CurrencyType.QUIZ_COINS,
        'QUIZ_REWARD',
        `quiz_reward_${session.id}_${idempotencyKey}`,
        `Recompensa por conclusão do quiz: ${session.quiz.title}`,
      );
    }

    return {
      sessionId: session.id,
      totalQuestions: session.totalQuestions,
      correctCount,
      accuracyPercentage: Math.round((correctCount / session.totalQuestions) * 100),
      earnedCoins,
      newWalletBalance: walletResult?.newBalance || null,
      review: reviewDetails,
    };
  }
}

