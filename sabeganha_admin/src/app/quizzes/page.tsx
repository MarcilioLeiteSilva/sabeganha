'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Save,
  X,
  Search,
  Filter,
  BrainCircuit,
} from 'lucide-react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://sabeganha-sabeganha-backend.gtalg3.easypanel.host/api/v1';

interface Option {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id?: string;
  statement: string;
  explanation?: string;
  pointsReward?: number;
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  difficulty: string;
  timeLimit: number;
  isActive: boolean;
  questions?: Question[];
  _count?: { questions: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { quizzes: number };
}

// Extrai seguramente arrays de payloads REST (suportando { status, data: [...] } do NestJS)
function extractArray<T = any>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

// Extrai seguramente objetos de payloads REST
function extractObject<T = any>(payload: any): T | null {
  if (!payload) return null;
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as T;
  }
  return payload as T;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<'none' | 'ai_generate' | 'edit_quiz'>('none');
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // AI Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategoryId, setAiCategoryId] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('INTERMEDIATE');
  const [aiCount, setAiCount] = useState(5);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState<{
    title: string;
    description: string;
    difficulty: string;
    timeLimit: number;
    questions: Question[];
  } | null>(null);

  // Carrega quizzes e categorias do backend
  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, quizRes] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/quizzes`),
      ]);

      if (catRes.ok) {
        const catJson = await catRes.json();
        const catList = extractArray<Category>(catJson);
        setCategories(catList);
        if (catList.length > 0 && !aiCategoryId) {
          setAiCategoryId(catList[0].id);
        }
      }

      if (quizRes.ok) {
        const quizJson = await quizRes.json();
        const qList = extractArray<Quiz>(quizJson);
        setQuizzes(qList);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      showToast('error', 'Não foi possível carregar dados do servidor. Usando contingência.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('sabeganha_gemini_api_key');
      if (savedKey) setAiApiKey(savedKey);
    }
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Abrir Modal de Edição carregando dados completos (perguntas e opções)
  const handleOpenEdit = async (quiz: Quiz) => {
    try {
      setSavingQuiz(true);
      const res = await fetch(`${API_BASE}/quizzes/${quiz.id}`);
      if (res.ok) {
        const fullQuizJson = await res.json();
        const fullQuiz = extractObject<Quiz>(fullQuizJson) || quiz;
        setEditingQuiz({
          ...fullQuiz,
          questions: extractArray<Question>(fullQuiz.questions),
        });
        setActiveModal('edit_quiz');
      } else {
        setEditingQuiz({
          ...quiz,
          questions: extractArray<Question>(quiz.questions),
        });
        setActiveModal('edit_quiz');
      }
    } catch (err) {
      showToast('error', 'Falha ao buscar detalhes do quiz para edição.');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Salvar Quiz Editado
  const handleSaveEditedQuiz = async () => {
    if (!editingQuiz) return;
    if (!editingQuiz.title.trim()) {
      showToast('error', 'O título do quiz é obrigatório.');
      return;
    }

    try {
      setSavingQuiz(true);
      const res = await fetch(`${API_BASE}/quizzes/${editingQuiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingQuiz.title,
          description: editingQuiz.description,
          categoryId: editingQuiz.categoryId,
          difficulty: editingQuiz.difficulty,
          timeLimit: Number(editingQuiz.timeLimit) || 30,
          isActive: editingQuiz.isActive,
          questions: (editingQuiz.questions || []).map((q) => ({
            statement: q.statement,
            explanation: q.explanation,
            pointsReward: q.pointsReward,
            options: (q.options || []).map((opt) => ({
              text: opt.text,
              isCorrect: !!opt.isCorrect,
            })),
          })),
        }),
      });

      if (res.ok) {
        showToast('success', 'Quiz atualizado com sucesso no banco de dados!');
        setActiveModal('none');
        setEditingQuiz(null);
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.message || 'Erro ao atualizar quiz.');
      }
    } catch (err: any) {
      showToast('error', 'Erro de conexão ao salvar alterações do quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Remover Quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Deseja realmente excluir este quiz e todas as suas perguntas associadas?')) {
      return;
    }

    try {
      setDeletingId(quizId);
      const res = await fetch(`${API_BASE}/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('success', 'Quiz removido com sucesso!');
        setQuizzes((prev) => extractArray<Quiz>(prev).filter((q) => q.id !== quizId));
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.message || 'Erro ao excluir quiz.');
      }
    } catch (err) {
      showToast('error', 'Erro ao tentar excluir quiz.');
    } finally {
      setDeletingId(null);
    }
  };

  // OPÇÃO 2: Gerar Quiz com IA (Gemini)
  const handleGenerateAiQuiz = async () => {
    if (!aiTopic.trim()) {
      showToast('error', 'Por favor, informe o tema do quiz para a Inteligência Artificial.');
      return;
    }

    try {
      setAiLoading(true);
      setAiPreviewData(null);

      const res = await fetch(`${API_BASE}/quizzes/generate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          categoryId: aiCategoryId || (categories[0] ? categories[0].id : undefined),
          difficulty: aiDifficulty,
          questionsCount: Number(aiCount) || 5,
          apiKey: aiApiKey.trim() || undefined,
          autoPublish: false,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const quizData = extractObject(result) || result;
        setAiPreviewData({
          title: quizData.title || `Quiz Especial: ${aiTopic}`,
          description: quizData.description || `Quiz educativo focado em ${aiTopic}.`,
          difficulty: quizData.difficulty || aiDifficulty,
          timeLimit: quizData.timeLimit || 30,
          questions: extractArray<Question>(quizData.questions),
        });
        showToast('success', result.message || 'Perguntas geradas com sucesso pela IA! Revise e publique.');
      } else {
        const err = await res.json().catch(() => ({}));
        const msg =
          err.error?.message ||
          err.message ||
          (Array.isArray(err.message) ? err.message.join(', ') : null) ||
          (typeof err.error === 'string' ? err.error : null) ||
          `Erro HTTP ${res.status}: Falha ao gerar perguntas com IA.`;
        showToast('error', msg);
      }
    } catch (err: any) {
      showToast('error', 'Erro de comunicação com o servidor de IA.');
    } finally {
      setAiLoading(false);
    }
  };

  // Publicar Quiz Gerado pela IA
  const handlePublishAiQuiz = async () => {
    if (!aiPreviewData) return;
    const catId = aiCategoryId || (categories[0] ? categories[0].id : '');

    if (!catId) {
      showToast('error', 'Selecione uma categoria para publicar o quiz.');
      return;
    }

    try {
      setSavingQuiz(true);
      const res = await fetch(`${API_BASE}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiPreviewData.title,
          description: aiPreviewData.description,
          categoryId: catId,
          difficulty: aiPreviewData.difficulty,
          timeLimit: aiPreviewData.timeLimit,
          isActive: true,
          questions: aiPreviewData.questions,
        }),
      });

      if (res.ok) {
        showToast('success', '🎉 Quiz gerado por IA publicado com sucesso no SabeGanha!');
        setActiveModal('none');
        setAiPreviewData(null);
        setAiTopic('');
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.message || 'Erro ao publicar quiz gerado.');
      }
    } catch (err) {
      showToast('error', 'Erro ao publicar quiz gerado por IA.');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Filtragem ultra-segura na Tabela
  const safeQuizzes = extractArray<Quiz>(quizzes);
  const safeCategories = extractArray<Category>(categories);

  const filteredQuizzes = safeQuizzes.filter((q) => {
    if (!q) return false;
    const qTitle = (q.title || '').toLowerCase();
    const qCatName = (q.category?.name || '').toLowerCase();
    const search = searchQuery.toLowerCase();
    const matchesSearch = qTitle.includes(search) || qCatName.includes(search);
    const matchesCategory = filterCategory === 'ALL' || q.categoryId === filterCategory;
    const matchesDifficulty = filterDifficulty === 'ALL' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header com Ações Principais */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quizzes & Categorias</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie o acervo educacional com geração por IA (Gemini) e edição completa.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveModal('ai_generate');
              setAiPreviewData(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-200 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Gerar com IA (Gemini)</span>
          </button>
          <button
            onClick={loadData}
            title="Recarregar"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Macro-Categorias Curadas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Macro-Categorias Curadas ({safeCategories.length})
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
            Padrão Regulamentar SabeGanha
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {safeCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.id ? 'ALL' : cat.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition ${
                filterCategory === cat.id
                  ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/20'
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">{cat.name}</p>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Ativa
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {cat._count?.quizzes ?? 0} {cat._count?.quizzes === 1 ? 'quiz' : 'quizzes'} cadastrados
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por título ou tema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="w-4 h-4" />
            <span>Categoria:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="ALL">Todas as Categorias</option>
              {safeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Dificuldade:</span>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="ALL">Todas</option>
              <option value="EASY">Fácil</option>
              <option value="INTERMEDIATE">Médio</option>
              <option value="HARD">Difícil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Quizzes com Ações de Edição e Exclusão */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Acervo Educativo em Produção ({filteredQuizzes.length})
          </h2>
          <span className="text-xs text-slate-400">Banco de Dados PostgreSQL auditado</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">Título do Quiz</th>
                <th className="px-5 py-3 font-semibold">Categoria</th>
                <th className="px-5 py-3 font-semibold">Dificuldade</th>
                <th className="px-5 py-3 font-semibold">Questões</th>
                <th className="px-5 py-3 font-semibold">Tempo</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    Carregando acervo de quizzes...
                  </td>
                </tr>
              ) : filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhum quiz encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredQuizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                      {q.title}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                        {q.category?.name || 'Geral'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          q.difficulty === 'EASY'
                            ? 'bg-blue-100 text-blue-700'
                            : q.difficulty === 'HARD'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {q.difficulty === 'EASY' ? 'Fácil' : q.difficulty === 'HARD' ? 'Difícil' : 'Médio'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-700">
                        {q._count?.questions ?? (q.questions?.length || 0)} itens
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{q.timeLimit || 30}s / item</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          q.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {q.isActive ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold hover:bg-purple-100 transition flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(q.id)}
                          disabled={deletingId === q.id}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Excluir Quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Gerador de Quizzes com IA (Opção 2 - Gemini) */}
      {activeModal === 'ai_generate' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Gerador de Quizzes com IA (Google Gemini)</h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Crie avaliações pedagógicas completas de mérito educativo em segundos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {!aiPreviewData ? (
                // Formulário de Criação com IA
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tema do Quiz (Tópico Curricular) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Revolução Constitucionalista de 1932, Estrutura do DNA, Astronomia Solar..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      A IA formulará enunciados objetivos e pedagogicamente justificados sobre este tema.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Categoria SabeGanha *
                      </label>
                      <select
                        value={aiCategoryId}
                        onChange={(e) => setAiCategoryId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        {safeCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Dificuldade Curricular
                      </label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="EASY">Fácil (Iniciante — 10 QC)</option>
                        <option value="INTERMEDIATE">Médio (Intermediário — 15 QC)</option>
                        <option value="HARD">Difícil (Avançado — 20 QC)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Quantidade de Questões
                      </label>
                      <select
                        value={aiCount}
                        onChange={(e) => setAiCount(Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value={5}>5 Questões (Rápido)</option>
                        <option value={8}>8 Questões</option>
                        <option value={10}>10 Questões (Padrão)</option>
                        <option value={15}>15 Questões (Avançado)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Chave Google Gemini API
                        </label>
                        <div className="flex items-center gap-2">
                          {aiApiKey.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                setAiApiKey('');
                                if (typeof window !== 'undefined') {
                                  localStorage.removeItem('sabeganha_gemini_api_key');
                                }
                              }}
                              className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Limpar chave
                            </button>
                          )}
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-purple-600 hover:text-purple-800 underline font-semibold flex items-center gap-1"
                          >
                            Obter chave gratuita ↗
                          </a>
                        </div>
                      </div>
                      <input
                        type="password"
                        placeholder="Cole sua chave AIzaSy... (Salva automaticamente)"
                        value={aiApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAiApiKey(val);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('sabeganha_gemini_api_key', val.trim());
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Status do Motor de IA */}
                  {aiApiKey.trim() ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-900">
                        Google Gemini 1.5 Flash Conectado: Perguntas formuladas em tempo real pela IA do Google.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                      <div className="text-xs text-amber-900">
                        <span className="font-semibold">Modo Motor Curricular Integrado:</span> O sistema usará o banco
                        pedagógico contextual. Para perguntas inéditas e dinâmicas geradas diretamente pela IA do Google,
                        cole sua chave gratuita do Google AI Studio acima.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Pré-visualização e Edição das Perguntas Geradas
                <div className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Perguntas Geradas com Sucesso!</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Revise os enunciados e alternativas abaixo antes de publicar no banco de dados.
                      </p>
                    </div>
                    <button
                      onClick={() => setAiPreviewData(null)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 rounded-lg hover:bg-emerald-100 transition"
                    >
                      Nova Geração
                    </button>
                  </div>

                  {/* Informações Básicas do Quiz Gerado */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Título do Quiz
                      </label>
                      <input
                        type="text"
                        value={aiPreviewData.title}
                        onChange={(e) =>
                          setAiPreviewData({ ...aiPreviewData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Descrição Educativa
                      </label>
                      <textarea
                        rows={2}
                        value={aiPreviewData.description}
                        onChange={(e) =>
                          setAiPreviewData({ ...aiPreviewData, description: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Lista de Questões Geradas */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Perguntas Geradas ({aiPreviewData.questions.length})
                    </h4>
                    {aiPreviewData.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                            Pergunta #{qIdx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {q.pointsReward || 10} Quiz Coins
                          </span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Enunciado:
                          </label>
                          <textarea
                            rows={2}
                            value={q.statement}
                            onChange={(e) => {
                              const newQuestions = [...aiPreviewData.questions];
                              newQuestions[qIdx].statement = e.target.value;
                              setAiPreviewData({ ...aiPreviewData, questions: newQuestions });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>

                        {/* Alternativas */}
                        <div className="space-y-2">
                          <label className="block text-[11px] font-semibold text-slate-600">
                            Alternativas (Selecione a correta):
                          </label>
                          {(q.options || []).map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition ${
                                opt.isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`ai_correct_${qIdx}`}
                                checked={opt.isCorrect}
                                onChange={() => {
                                  const newQuestions = [...aiPreviewData.questions];
                                  newQuestions[qIdx].options.forEach((o, i) => {
                                    o.isCorrect = i === optIdx;
                                  });
                                  setAiPreviewData({ ...aiPreviewData, questions: newQuestions });
                                }}
                                className="w-4 h-4 text-emerald-600"
                              />
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const newQuestions = [...aiPreviewData.questions];
                                  newQuestions[qIdx].options[optIdx].text = e.target.value;
                                  setAiPreviewData({ ...aiPreviewData, questions: newQuestions });
                                }}
                                className="flex-1 bg-transparent border-none text-xs focus:outline-none"
                              />
                              {opt.isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                                  Correta
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Explicação Pedagógica:
                          </label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => {
                              const newQuestions = [...aiPreviewData.questions];
                              newQuestions[qIdx].explanation = e.target.value;
                              setAiPreviewData({ ...aiPreviewData, questions: newQuestions });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Cancelar
              </button>
              {!aiPreviewData ? (
                <button
                  onClick={handleGenerateAiQuiz}
                  disabled={aiLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Gerando com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Gerar Perguntas com IA</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handlePublishAiQuiz}
                  disabled={savingQuiz}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {savingQuiz ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Publicar no SabeGanha</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editor Completo de Quiz */}
      {activeModal === 'edit_quiz' && editingQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Editar Quiz: {editingQuiz.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID: <span className="font-mono text-purple-300">{editingQuiz.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Metadados do Quiz */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Título do Quiz *
                  </label>
                  <input
                    type="text"
                    value={editingQuiz.title}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Descrição Educativa
                  </label>
                  <textarea
                    rows={2}
                    value={editingQuiz.description || ''}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={editingQuiz.categoryId}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {safeCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dificuldade
                  </label>
                  <select
                    value={editingQuiz.difficulty}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="EASY">Fácil (Iniciante)</option>
                    <option value="INTERMEDIATE">Médio (Intermediário)</option>
                    <option value="HARD">Difícil (Avançado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tempo Limite por Questão (Segundos)
                  </label>
                  <input
                    type="number"
                    value={editingQuiz.timeLimit || 30}
                    onChange={(e) =>
                      setEditingQuiz({ ...editingQuiz, timeLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status de Publicação
                  </label>
                  <select
                    value={editingQuiz.isActive ? 'true' : 'false'}
                    onChange={(e) =>
                      setEditingQuiz({ ...editingQuiz, isActive: e.target.value === 'true' })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="true">Publicado (Disponível no App)</option>
                    <option value="false">Rascunho (Oculto)</option>
                  </select>
                </div>
              </div>

              {/* Gerenciamento de Questões */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    Questões do Quiz ({editingQuiz.questions?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      const newQuestions = editingQuiz.questions ? [...editingQuiz.questions] : [];
                      newQuestions.push({
                        statement: 'Nova pergunta sobre o tema...',
                        explanation: 'Justificativa pedagógica.',
                        pointsReward: 10,
                        options: [
                          { text: 'Opção Correta', isCorrect: true },
                          { text: 'Alternativa B', isCorrect: false },
                          { text: 'Alternativa C', isCorrect: false },
                          { text: 'Alternativa D', isCorrect: false },
                        ],
                      });
                      setEditingQuiz({ ...editingQuiz, questions: newQuestions });
                    }}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Questão
                  </button>
                </div>

                <div className="space-y-4">
                  {(editingQuiz.questions || []).map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          Questão #{qIdx + 1}
                        </span>
                        <button
                          onClick={() => {
                            const newQuestions = (editingQuiz.questions || []).filter((_, i) => i !== qIdx);
                            setEditingQuiz({ ...editingQuiz, questions: newQuestions });
                          }}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover Questão
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Enunciado da Pergunta:
                        </label>
                        <textarea
                          rows={2}
                          value={q.statement}
                          onChange={(e) => {
                            const newQuestions = [...(editingQuiz.questions || [])];
                            newQuestions[qIdx].statement = e.target.value;
                            setEditingQuiz({ ...editingQuiz, questions: newQuestions });
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>

                      {/* Opções de Resposta */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Alternativas (Selecione a correta):
                        </label>
                        {(q.options || []).map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition ${
                              opt.isCorrect
                                ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`edit_correct_${qIdx}`}
                              checked={opt.isCorrect}
                              onChange={() => {
                                const newQuestions = [...(editingQuiz.questions || [])];
                                newQuestions[qIdx].options.forEach((o, i) => {
                                  o.isCorrect = i === optIdx;
                                });
                                setEditingQuiz({ ...editingQuiz, questions: newQuestions });
                              }}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const newQuestions = [...(editingQuiz.questions || [])];
                                newQuestions[qIdx].options[optIdx].text = e.target.value;
                                setEditingQuiz({ ...editingQuiz, questions: newQuestions });
                              }}
                              className="flex-1 bg-transparent border-none text-xs focus:outline-none"
                            />
                            {opt.isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                                Resposta Correta
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Justificativa / Explicação Pedagógica:
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => {
                            const newQuestions = [...(editingQuiz.questions || [])];
                            newQuestions[qIdx].explanation = e.target.value;
                            setEditingQuiz({ ...editingQuiz, questions: newQuestions });
                          }}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedQuiz}
                disabled={savingQuiz}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {savingQuiz ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Salvando alterações...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
