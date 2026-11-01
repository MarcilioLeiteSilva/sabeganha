import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QuizService } from './quiz.service';

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
}

