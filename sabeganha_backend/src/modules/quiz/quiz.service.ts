import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizService {
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
    const where: any = { isActive: true };
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
}

