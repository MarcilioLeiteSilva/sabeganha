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
  @ApiOperation({ summary: 'Gera perguntas e quiz automaticamente via IA (Gemini)' })
  async generateQuizWithAI(@Body() dto: GenerateQuizAiDto) {
    return this.quizService.generateQuizWithAI(dto);
  }
}
