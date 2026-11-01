import { PrismaClient, CurrencyType, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do SabeGanha...');

  // 1. Contas Contábeis do Sistema
  const currencies = [
    CurrencyType.QUIZ_COINS,
    CurrencyType.GEMS,
    CurrencyType.REWARD_CREDITS,
  ];

  for (const c of currencies) {
    await prisma.ledgerAccount.upsert({
      where: { id: `00000000-0000-0000-0000-00000000000${c === CurrencyType.QUIZ_COINS ? '1' : c === CurrencyType.GEMS ? '2' : '3'}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000000${c === CurrencyType.QUIZ_COINS ? '1' : c === CurrencyType.GEMS ? '2' : '3'}`,
        currencyType: c,
        accountType: AccountType.SYSTEM_LIABILITY,
        cachedBalance: 0,
      },
    });
  }

  // 2. As 9 Macro-Categorias do SabeGanha
  const categories = [
    { name: 'Conhecimentos Gerais', slug: 'conhecimentos-gerais', order: 1 },
    { name: 'Ciência e Tecnologia', slug: 'ciencia-tecnologia', order: 2 },
    { name: 'História', slug: 'historia', order: 3 },
    { name: 'Geografia', slug: 'geografia', order: 4 },
    { name: 'Esportes', slug: 'esportes', order: 5 },
    { name: 'Entretenimento', slug: 'entretenimento', order: 6 },
    { name: 'Matemática e Lógica', slug: 'matematica-logica', order: 7 },
    { name: 'Literatura', slug: 'literatura', order: 8 },
    { name: 'Cultura e Curiosidades', slug: 'cultura-curiosidades', order: 9 },
  ];

  for (const cat of categories) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, orderIndex: cat.order },
      create: {
        name: cat.name,
        slug: cat.slug,
        orderIndex: cat.order,
        description: `Quizzes e desafios educativos sobre ${cat.name}`,
      },
    });

    // Cria um quiz inicial para a categoria
    const quiz = await prisma.quiz.create({
      data: {
        categoryId: createdCat.id,
        title: `Desafio Inicial: ${cat.name}`,
        description: `Teste seus conhecimentos e aprenda conceitos fundamentais de ${cat.name}.`,
        difficulty: 'INTERMEDIATE',
        timeLimit: 30,
        questions: {
          create: [
            {
              statement: `Qual é o conceito fundamental explorado em ${cat.name}?`,
              explanation: `A resposta correta reflete a base teórica e histórica consolidada deste campo do saber.`,
              pointsReward: 15,
              options: {
                create: [
                  { text: 'Conhecimento empírico e validação científica', isCorrect: true },
                  { text: 'Suposição sem comprovação', isCorrect: false },
                  { text: 'Tradição puramente oral', isCorrect: false },
                  { text: 'Mera coincidência estatística', isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });
    console.log(`✅ Categoria criada: ${cat.name} com Quiz: ${quiz.title}`);
  }

  // 3. Catálogo Inicial de Benefícios (Modelo A)
  const rewards = [
    {
      title: 'Cupom de 20% OFF em Livros e Cursos',
      partnerName: 'Livraria & Conhecimento Parceira',
      costPoints: 100,
      currency: CurrencyType.QUIZ_COINS,
      stock: 50,
      vouchers: ['SABE20LIVROS', 'SABE20DESC1', 'SABE20DESC2'],
      terms: 'Válido para compras acima de R$ 50,00 até 31/12/2026. Não cumulativo com outras promoções.',
    },
    {
      title: 'Vale-Presente Digital R$ 10,00',
      partnerName: 'Distribuidor Corporativo Homologado',
      costPoints: 500,
      currency: CurrencyType.QUIZ_COINS,
      stock: 20,
      vouchers: ['GIFT-SABE-10-A1B2', 'GIFT-SABE-10-C3D4'],
      terms: 'Código resgatável em plataformas digitais parceiras. Válido por 1 ano após a emissão.',
    },
  ];

  for (const rew of rewards) {
    const createdReward = await prisma.reward.create({
      data: {
        title: rew.title,
        partnerName: rew.partnerName,
        costPoints: rew.costPoints,
        currencyRequired: rew.currency,
        stockQuantity: rew.stock,
        termsAndConditions: rew.terms,
        description: `Resgate exclusivo para membros fiéis do SabeGanha.`,
      },
    });

    for (const vCode of rew.vouchers) {
      await prisma.rewardVoucher.create({
        data: {
          rewardId: createdReward.id,
          voucherCode: vCode,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`🎁 Benefício cadastrado no catálogo: ${rew.title}`);
  }

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

