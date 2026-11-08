import React from 'react';

export default function QuizzesPage() {
  const categories = [
    { id: 1, name: 'Conhecimentos Gerais', slug: 'conhecimentos-gerais', quizzesCount: 18, active: true },
    { id: 2, name: 'Ciência e Tecnologia', slug: 'ciencia-tecnologia', quizzesCount: 24, active: true },
    { id: 3, name: 'História', slug: 'historia', quizzesCount: 15, active: true },
    { id: 4, name: 'Geografia', slug: 'geografia', quizzesCount: 12, active: true },
    { id: 5, name: 'Esportes', slug: 'esportes', quizzesCount: 14, active: true },
    { id: 6, name: 'Entretenimento', slug: 'entretenimento', quizzesCount: 20, active: true },
    { id: 7, name: 'Matemática e Lógica', slug: 'matematica-logica', quizzesCount: 16, active: true },
    { id: 8, name: 'Literatura', slug: 'literatura', quizzesCount: 10, active: true },
    { id: 9, name: 'Cultura e Curiosidades', slug: 'cultura-curiosidades', quizzesCount: 12, active: true },
  ];

  const recentQuizzes = [
    { title: 'Fundamentos do Conhecimento Científico', category: 'Ciência e Tecnologia', level: 'Médio', questions: 10, reward: '20 QC', active: true },
    { title: 'História do Brasil Império', category: 'História', level: 'Difícil', questions: 12, reward: '25 QC', active: true },
    { title: 'Geografia Física e Climatologia', category: 'Geografia', level: 'Fácil', questions: 8, reward: '15 QC', active: true },
    { title: 'Lógica Proposicional e Algoritmos', category: 'Matemática e Lógica', level: 'Difícil', questions: 15, reward: '30 QC', active: true },
    { title: 'Grandes Obras da Literatura Brasileira', category: 'Literatura', level: 'Médio', questions: 10, reward: '20 QC', active: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quizzes & Categorias</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie a matriz de conhecimento educativo do SabeGanha.</p>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 shadow-sm transition">
          + Novo Quiz
        </button>
      </div>

      {/* Grid de Macro-Categorias */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Macro-Categorias Curadas (9)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">{cat.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{cat.quizzesCount} Quizzes ativos</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Ativo
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Quizzes Ativos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Acervo Educativo em Produção</h2>
          <span className="text-xs text-slate-400">Total: 141 Quizzes indexados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">Título do Quiz</th>
                <th className="px-5 py-3 font-semibold">Categoria</th>
                <th className="px-5 py-3 font-semibold">Dificuldade</th>
                <th className="px-5 py-3 font-semibold">Questões</th>
                <th className="px-5 py-3 font-semibold">Recompensa</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentQuizzes.map((q, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{q.title}</td>
                  <td className="px-5 py-3.5">{q.category}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      q.level === 'Fácil' ? 'bg-blue-100 text-blue-700' :
                      q.level === 'Médio' ? 'bg-amber-100 text-amber-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {q.level}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">{q.questions} itens</td>
                  <td className="px-5 py-3.5 font-semibold text-purple-700">{q.reward}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      Publicado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

