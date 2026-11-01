import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';

@ApiTags('Quiz Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Inicia uma sessão de perguntas retornando alternativas sem gabarito' })
  @ApiHeader({ name: 'x-user-id', required: false })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['quizId'],
      properties: {
        quizId: { type: 'string', format: 'uuid' },
      },
    },
  })
  async startSession(
    @Body('quizId') quizId: string,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    if (!quizId) {
      throw new BadRequestException('O campo quizId é obrigatório.');
    }
    const userId = headerUserId || '00000000-0000-0000-0000-000000000001';
    return this.sessionsService.startSession(userId, quizId);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submete as respostas da rodada, computa acertos, credita moedas e devolve explicações' })
  @ApiHeader({ name: 'x-user-id', required: false })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['sessionToken', 'answers'],
      properties: {
        sessionToken: { type: 'string' },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              questionId: { type: 'string', format: 'uuid' },
              selectedOptionId: { type: 'string', format: 'uuid' },
              responseTimeMs: { type: 'integer' },
            },
          },
        },
      },
    },
  })
  async submitSession(
    @Body('sessionToken') sessionToken: string,
    @Body('answers') answers: any[],
    @Headers('Idempotency-Key') idempotencyKey: string,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    if (!sessionToken || !answers) {
      throw new BadRequestException('sessionToken e answers são obrigatórios.');
    }
    const userId = headerUserId || '00000000-0000-0000-0000-000000000001';
    const key = idempotencyKey || `sub_${Date.now()}`;
    return this.sessionsService.submitSession(userId, sessionToken, answers, key);
  }
}

