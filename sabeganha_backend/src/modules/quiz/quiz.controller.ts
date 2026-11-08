import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { QuizService, CreateQuizDto, UpdateQuizDto, GenerateQuizAiDto } from './quiz.service';

@ApiTags('Quizzes & Categories')
@Controller()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lista as 9 categorias temáticas do SabeGanha' })
  async getCategories() {
    return this.quizService.getCategories();
  }

  @Get('quizzes')
  @ApiOperation({ summary: 'Lista os quizzes disponíveis com filtros' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'difficulty', required: false })
  async getQuizzes(
    @Query('categoryId') categoryId?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.quizService.getQuizzes(categoryId, difficulty);
  }

  @Get('quizzes/ai/governance')
  @ApiOperation({ summary: 'Consulta as cotas de geração semanal/diária e parâmetros de governança' })
  async getGovernanceStatus() {
    return this.quizService.getGovernanceStatus();
  }

  @Put('quizzes/ai/governance')
  @ApiOperation({ summary: 'Atualiza parâmetros de governança de IA (limites, aprovação obrigatória)' })
  async updateGovernanceConfig(@Body() dto: any) {
    return this.quizService.updateGovernanceConfig(dto);
  }

  @Get('quizzes/community/suggestions')
  @ApiOperation({ summary: 'Lista sugestões de temas enviadas pelos usuários e comunidade' })
  async getSuggestions() {
    return this.quizService.getSuggestions();
  }

  @Post('quizzes/community/suggestions')
  @ApiOperation({ summary: 'Envia nova sugestão de tema de quiz' })
  async createSuggestion(@Body() body: { topic: string; categoryName?: string; categoryId?: string; userName?: string }) {
    return this.quizService.createSuggestion(body.topic, body.categoryName, body.categoryId, body.userName);
  }

  @Post('quizzes/community/suggestions/:id/vote')
  @ApiOperation({ summary: 'Vota em uma sugestão da comunidade' })
  async voteSuggestion(@Param('id') id: string) {
    return this.quizService.voteSuggestion(id);
  }

  @Post('quizzes/:id/approve')
  @ApiOperation({ summary: 'Aprova e publica um quiz que estava em curadoria/revisão' })
  async approveQuiz(@Param('id') id: string, @Body() body?: { curatorName?: string }) {
    return this.quizService.approveQuiz(id, body?.curatorName);
  }

  @Post('quizzes/:id/schedule')
  @ApiOperation({ summary: 'Agenda a publicação futura de um quiz' })
  async scheduleQuiz(@Param('id') id: string, @Body() body: { scheduledFor: string }) {
    return this.quizService.scheduleQuiz(id, body.scheduledFor);
  }

  @Get('quizzes/:id')
  @ApiOperation({ summary: 'Recupera detalhes de um quiz específico' })
  async getQuizById(@Param('id') id: string) {
    return this.quizService.getQuizById(id);
  }

  @Post('quizzes')
  @ApiOperation({ summary: 'Cria um novo quiz com perguntas e alternativas' })
  async createQuiz(@Body() dto: CreateQuizDto) {
    return this.quizService.createQuiz(dto);
  }

  @Put('quizzes/:id')
  @ApiOperation({ summary: 'Atualiza um quiz e suas questões' })
  async updateQuiz(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quizService.updateQuiz(id, dto);
  }

  @Delete('quizzes/:id')
  @ApiOperation({ summary: 'Remove um quiz e suas perguntas associadas' })
  async deleteQuiz(@Param('id') id: string) {
    return this.quizService.deleteQuiz(id);
  }

  @Post('quizzes/generate-ai')
  @ApiOperation({ summary: 'Gera perguntas e quiz automaticamente via IA com governança e cotas' })
  async generateQuizWithAI(@Body() dto: GenerateQuizAiDto) {
    return this.quizService.generateQuizWithAI(dto);
  }
}
