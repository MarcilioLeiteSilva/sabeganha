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
  Calendar,
  ThumbsUp,
  ShieldCheck,
  Award,
  Clock,
  Send,
  Sliders,
  Check,
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

interface UserSuggestion {
  id: string;
  topic: string;
  categoryName?: string;
  categoryId?: string;
  suggestedBy?: string;
  votesCount: number;
  status: 'PENDING' | 'ACCEPTED' | 'GENERATED';
  createdAt: string;
}

interface AiGovernance {
  maxGenerationsPerWeek: number;
  maxGenerationsPerDay: number;
  currentWeekUsage: number;
  currentDayUsage: number;
  remainingThisWeek: number;
  remainingToday: number;
  weekResetDate: string;
  dayResetDate: string;
  requireCuratorApproval: boolean;
  securityPromptFiltersActive: boolean;
  communityVotingEnabled: boolean;
  bonusCoinMultiplier: number;
}

function extractArray<T = any>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function extractObject<T = any>(payload: any): T | null {
  if (!payload) return null;
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as T;
  }
  return payload as T;
}

export default function QuizzesPage() {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'suggestions' | 'governance'>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [governance, setGovernance] = useState<AiGovernance | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modais
  const [activeModal, setActiveModal] = useState<'none' | 'ai_generate' | 'edit_quiz' | 'new_suggestion'>('none');
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form de IA
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategoryId, setAiCategoryId] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('INTERMEDIATE');
  const [aiCount, setAiCount] = useState(5);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiToneGuideline, setAiToneGuideline] = useState('');
  const [aiPublishMode, setAiPublishMode] = useState<'immediate' | 'schedule' | 'draft'>('immediate');
  const [aiScheduledDate, setAiScheduledDate] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState<{
    title: string;
    description: string;
    difficulty: string;
    timeLimit: number;
    questions: Question[];
  } | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);

  // Form de Nova Sugestão de Usuário
  const [newSugTopic, setNewSugTopic] = useState('');
  const [newSugCategory, setNewSugCategory] = useState('');
  const [newSugUser, setNewSugUser] = useState('');

  // Carrega dados do backend
  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, quizRes, sugRes, govRes] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/quizzes`),
        fetch(`${API_BASE}/quizzes/community/suggestions`),
        fetch(`${API_BASE}/quizzes/ai/governance`),
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
        setQuizzes(extractArray<Quiz>(quizJson));
      }

      if (sugRes.ok) {
        const sugJson = await sugRes.json();
        setSuggestions(extractArray<UserSuggestion>(sugJson));
      }

      if (govRes.ok) {
        const govJson = await govRes.json();
        setGovernance(extractObject<AiGovernance>(govJson));
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      showToast('error', 'Falha ao sincronizar com o servidor.');
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

  // Abrir Modal de Edição de Quiz
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
        showToast('success', 'Quiz atualizado com sucesso!');
        setActiveModal('none');
        setEditingQuiz(null);
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.error?.message || err.message || 'Erro ao atualizar quiz.');
      }
    } catch (err: any) {
      showToast('error', 'Erro de conexão ao salvar alterações do quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Aprovar Quiz em Curadoria
  const handleApproveQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`${API_BASE}/quizzes/${quizId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curatorName: 'SuperAdmin' }),
      });
      if (res.ok) {
        showToast('success', 'Quiz aprovado e publicado com sucesso no acervo oficial!');
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.error?.message || err.message || 'Erro ao aprovar quiz.');
      }
    } catch (err) {
      showToast('error', 'Falha ao aprovar quiz.');
    }
  };

  // Excluir Quiz
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
        showToast('error', err.error?.message || err.message || 'Erro ao excluir quiz.');
      }
    } catch (err) {
      showToast('error', 'Erro ao tentar excluir quiz.');
    } finally {
      setDeletingId(null);
    }
  };

  // Gerar com IA
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
          toneGuideline: aiToneGuideline.trim() || undefined,
          suggestionId: selectedSuggestionId || undefined,
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
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        const msg =
          err.error?.message ||
          err.message ||
          (Array.isArray(err.message) ? err.message.join(', ') : null) ||
          `Erro HTTP ${res.status}: Falha ao gerar perguntas com IA.`;
        showToast('error', msg);
      }
    } catch (err: any) {
      showToast('error', 'Erro de comunicação com o servidor de IA.');
    } finally {
      setAiLoading(false);
    }
  };

  // Publicar / Agendar Quiz Gerado pela IA
  const handlePublishAiQuiz = async () => {
    if (!aiPreviewData) return;
    const catId = aiCategoryId || (categories[0] ? categories[0].id : '');

    if (!catId) {
      showToast('error', 'Selecione uma categoria para publicar o quiz.');
      return;
    }

    try {
      setSavingQuiz(true);
      const isDraft = aiPublishMode === 'draft';
      const isScheduled = aiPublishMode === 'schedule' && !!aiScheduledDate;

      const res = await fetch(`${API_BASE}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiPreviewData.title,
          description: isDraft
            ? `[PENDENTE DE CURADORIA] ${aiPreviewData.description}`
            : aiPreviewData.description,
          categoryId: catId,
          difficulty: aiPreviewData.difficulty,
          timeLimit: aiPreviewData.timeLimit,
          isActive: !isDraft && !isScheduled,
          scheduledAt: isScheduled ? aiScheduledDate : undefined,
          questions: aiPreviewData.questions,
        }),
      });

      if (res.ok) {
        showToast(
          'success',
          isScheduled
            ? `📅 Quiz agendado com sucesso para ${new Date(aiScheduledDate).toLocaleDateString('pt-BR')}!`
            : isDraft
            ? '📝 Quiz salvo como Rascunho para Curadoria!'
            : '🎉 Quiz gerado por IA publicado com sucesso no SabeGanha!'
        );
        setActiveModal('none');
        setAiPreviewData(null);
        setAiTopic('');
        setSelectedSuggestionId(null);
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.error?.message || err.message || 'Erro ao salvar quiz.');
      }
    } catch (err) {
      showToast('error', 'Erro ao processar publicação do quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Votar em Sugestão da Comunidade
  const handleVoteSuggestion = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/quizzes/community/suggestions/${id}/vote`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('success', 'Voto computado com sucesso!');
        await loadData();
      }
    } catch (err) {
      showToast('error', 'Falha ao registrar voto.');
    }
  };

  // Enviar Nova Sugestão
  const handleCreateSuggestion = async () => {
    if (!newSugTopic.trim()) {
      showToast('error', 'O tema da sugestão é obrigatório.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/quizzes/community/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newSugTopic.trim(),
          categoryName: newSugCategory || 'Geral',
          userName: newSugUser.trim() || 'Admin SabeGanha',
        }),
      });

      if (res.ok) {
        showToast('success', 'Sugestão adicionada ao painel da comunidade!');
        setNewSugTopic('');
        setActiveModal('none');
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.error?.message || err.message || 'Erro ao enviar sugestão.');
      }
    } catch (err) {
      showToast('error', 'Erro ao salvar sugestão.');
    }
  };

  // Atualizar Parâmetros de Governança
  const handleUpdateGovernance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!governance) return;

    try {
      const res = await fetch(`${API_BASE}/quizzes/ai/governance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxGenerationsPerWeek: governance.maxGenerationsPerWeek,
          maxGenerationsPerDay: governance.maxGenerationsPerDay,
          requireCuratorApproval: governance.requireCuratorApproval,
        }),
      });

      if (res.ok) {
        showToast('success', 'Parâmetros de governança atualizados com sucesso!');
        await loadData();
      } else {
        showToast('error', 'Erro ao atualizar parâmetros.');
      }
    } catch (err) {
      showToast('error', 'Falha na comunicação com o servidor.');
    }
  };

  // Abrir Modal de IA a partir de uma sugestão de usuário
  const handleGenerateFromSuggestion = (sug: UserSuggestion) => {
    setAiTopic(sug.topic);
    setSelectedSuggestionId(sug.id);
    const matchedCat = categories.find((c) => c.name.toLowerCase() === (sug.categoryName || '').toLowerCase());
    if (matchedCat) setAiCategoryId(matchedCat.id);
    setActiveModal('ai_generate');
  };

  // Filtragem na Tabela
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

      {/* Header com Abas Principais */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Centro de Quizzes & Inteligência Artificial</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão curricular, curadoria humana, governança de IA e crowdsourcing da comunidade.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveModal('ai_generate');
              setAiPreviewData(null);
              setSelectedSuggestionId(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-200 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Gerador de IA Livre</span>
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

      {/* Abas de Navegação */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Acervo & Categorias ({safeQuizzes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'suggestions'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Sugestões da Comunidade ({suggestions.length})</span>
          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
            Crowdsourcing
          </span>
        </button>
        <button
          onClick={() => setActiveTab('governance')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'governance'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Governança & Cotas de IA</span>
          {governance && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
              {governance.remainingThisWeek} vagas rest.
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: ACERVO DE QUIZZES & CATEGORIAS */}
      {/* ============================================================== */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
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

          {/* Tabela de Quizzes com Curadoria e Agendamento */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                Acervo Educativo em Produção ({filteredQuizzes.length})
              </h2>
              <span className="text-xs text-slate-400">PostgreSQL Auditado • Modelo A</span>
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
                    <th className="px-5 py-3 font-semibold">Status / Curadoria</th>
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
                    filteredQuizzes.map((q) => {
                      const isPendingCurator = (q.description || '').includes('[PENDENTE DE CURADORIA]');
                      const isScheduled = (q.description || '').includes('[AGENDADO');

                      return (
                        <tr key={q.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5 font-medium text-slate-900 max-w-xs">
                            <p className="truncate font-semibold">{q.title}</p>
                            {isScheduled && (
                              <p className="text-[11px] text-blue-600 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {q.description?.match(/\[AGENDADO.*?\]/)?.[0] || 'Agendado'}
                              </p>
                            )}
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
                            {isPendingCurator ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800">
                                  ⏳ Pendente Curadoria
                                </span>
                                <button
                                  onClick={() => handleApproveQuiz(q.id)}
                                  className="text-[11px] font-bold px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                  title="Aprovar e Liberar no App"
                                >
                                  Aprovar
                                </button>
                              </div>
                            ) : isScheduled ? (
                              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-800">
                                📅 Agendado
                              </span>
                            ) : q.isActive ? (
                              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-700">
                                ✓ Publicado
                              </span>
                            ) : (
                              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-500">
                                Rascunho
                              </span>
                            )}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: SUGESTÕES DA COMUNIDADE (CROWDSOURCING DE QUIZZES) */}
      {/* ============================================================== */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-6 h-6 text-amber-300" />
                <h2 className="text-xl font-bold">Voz da Comunidade: Temas Sugeridos pelos Jogadores</h2>
              </div>
              <p className="text-sm text-purple-200 mt-1 max-w-2xl">
                Os jogadores enviam e votam em temas que gostariam de ver no SabeGanha. 
                Com 1 clique, você pode usar a IA para transformar as sugestões mais populares no <strong>"Quiz Especial da Semana"</strong>.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('new_suggestion')}
              className="px-4 py-2.5 bg-white text-purple-900 font-bold text-xs rounded-xl hover:bg-purple-50 shadow-md transition whitespace-nowrap"
            >
              + Adicionar Sugestão Manual
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-purple-200 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {sug.categoryName || 'Geral'}
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-extrabold text-slate-800">
                      <ThumbsUp className="w-3.5 h-3.5 text-purple-600" />
                      <span>{sug.votesCount} votos</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-3">{sug.topic}</h3>
                  <p className="text-xs text-slate-400 mt-1">Sugerido por: {sug.suggestedBy}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                      sug.status === 'GENERATED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sug.status === 'GENERATED' ? '✓ Já Transformado em Quiz' : 'Pendente de Criação'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVoteSuggestion(sug.id)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-lg text-slate-700 transition"
                    >
                      +1 Voto
                    </button>
                    <button
                      onClick={() => handleGenerateFromSuggestion(sug)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Gerar com IA</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: GOVERNANÇA, COTAS E SEGURANÇA DA IA */}
      {/* ============================================================== */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cartão de Cotas Atuais */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-800">Cotas de Uso de IA</h3>
              </div>
              <p className="text-xs text-slate-500">
                Parâmetros para evitar sobrecarga de custos e manter controle sobre a expansão do catálogo.
              </p>

              {governance && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-1">
                      <span>Cota Semanal de Quizzes:</span>
                      <span>
                        {governance.currentWeekUsage} / {governance.maxGenerationsPerWeek}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-purple-200 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 transition-all"
                        style={{
                          width: `${Math.min(100, (governance.currentWeekUsage / governance.maxGenerationsPerWeek) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-purple-700 mt-2 font-medium">
                      {governance.remainingThisWeek} gerações disponíveis até o próximo ciclo.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Limite Diário de Proteção:</span>
                      <span>
                        {governance.currentDayUsage} / {governance.maxGenerationsPerDay}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all"
                        style={{
                          width: `${Math.min(100, (governance.currentDayUsage / governance.maxGenerationsPerDay) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Reset diário automático em 24h.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Configuração de Parâmetros de Governança */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Ajustar Parâmetros de Governança</h3>
              {governance && (
                <form onSubmit={handleUpdateGovernance} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Máximo de Quizzes de IA por Semana
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={governance.maxGenerationsPerWeek}
                      onChange={(e) =>
                        setGovernance({ ...governance, maxGenerationsPerWeek: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ex: 1 por semana (Quiz Semanal Oficial) ou 5 a 10 por semana.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Limite de Segurança por Dia
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={governance.maxGenerationsPerDay}
                      onChange={(e) =>
                        setGovernance({ ...governance, maxGenerationsPerDay: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Curadoria Obrigatória</p>
                      <p className="text-[11px] text-slate-500">
                        Quizzes gerados por IA entram como Rascunho até aprovação humana.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={governance.requireCuratorApproval}
                      onChange={(e) =>
                        setGovernance({ ...governance, requireCuratorApproval: e.target.checked })
                      }
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    Salvar Parâmetros de Governança
                  </button>
                </form>
              )}
            </div>

            {/* Medidas de Segurança e Boas Práticas do Modelo A */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">Segurança & Boas Práticas</h3>
              </div>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="font-bold text-emerald-900">1. Blindagem Modelo A (Fidelidade Legal)</p>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    Proibição automática de temas ligados a jogos de azar, cassinos ou sorteios aleatórios. O aplicativo recompensa estritamente o mérito cognitivo e conhecimento.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="font-bold text-blue-900">2. Filtro Anti-Prompt-Injection</p>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    Sanitização ativa de comandos que tentem forçar vazamento de regras de sistema ou desvio de foco pedagógico.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="font-bold text-indigo-900">3. Incontestabilidade Factual</p>
                  <p className="text-indigo-800 text-[11px] mt-0.5">
                    Cada questão é obrigada a possuir exatamente 1 resposta correta e 3 distratores comprovadamente falsos com justificativa curricular.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <p className="font-bold text-purple-900">4. Chave Segura em Servidor</p>
                  <p className="text-purple-800 text-[11px] mt-0.5">
                    A chave de IA deve ser mantida nas variáveis de ambiente do Easypanel (<code className="font-mono">GEMINI_API_KEY</code>), protegida contra exposição no front-end.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GERADOR DE QUIZZES COM IA (GEMINI 1.5 FLASH + GOVERNANÇA) */}
      {/* ============================================================== */}
      {activeModal === 'ai_generate' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Gerador de Quizzes de IA (Total Liberdade)</h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Crie avaliações factuais e dinâmicas sobre qualquer tema, com controle de dificuldade e agendamento.
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
                // FORMULÁRIO DE GERAÇÃO
                <div className="space-y-4">
                  {/* Banner de Atrativo Gamificado */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="text-xs text-amber-900">
                      <span className="font-bold">⚡ Atrativo de Engajamento SabeGanha:</span> Quizzes gerados por IA recebem o selo especial da comunidade e concedem <strong>+20% de Quiz Coins</strong> na primeira semana para incentivar o estudo contínuo.
                    </div>
                  </div>

                  {selectedSuggestionId && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900 font-semibold">
                      <span>Gerando a partir de uma sugestão dos jogadores da comunidade!</span>
                      <button
                        onClick={() => setSelectedSuggestionId(null)}
                        className="text-purple-600 hover:text-purple-800 underline"
                      >
                        Desvincular
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tema do Quiz (Liberdade Total — Qualquer Assunto do Mundo) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Mitologia Nórdica, História da Fórmula 1, Física Quântica, Culinária Mineira, IA na Medicina..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      A IA formulará questões factuais, verificáveis e rigorosas sobre os acontecimentos reais deste tema.
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
                        <option value="HARD">Difícil (Avançado/Concurso — 20 QC)</option>
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
                        <option value={3}>3 Questões (Express)</option>
                        <option value={5}>5 Questões (Rápido)</option>
                        <option value={8}>8 Questões</option>
                        <option value={10}>10 Questões (Padrão Semanal)</option>
                        <option value={15}>15 Questões (Desafio Máximo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Diretriz Adicional de Tom (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Focar em curiosidades históricas, nível prova ENEM..."
                        value={aiToneGuideline}
                        onChange={(e) => setAiToneGuideline(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  {/* Agendamento & Publicação */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Fluxo de Publicação e Agendamento
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiPublishMode('immediate')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                          aiPublishMode === 'immediate'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Publicar Imediato
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiPublishMode('schedule')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                          aiPublishMode === 'schedule'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Agendar Data
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiPublishMode('draft')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                          aiPublishMode === 'draft'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Rascunho (Curadoria)
                      </button>
                    </div>

                    {aiPublishMode === 'schedule' && (
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Data e Hora da Publicação Automática:
                        </label>
                        <input
                          type="datetime-local"
                          value={aiScheduledDate}
                          onChange={(e) => setAiScheduledDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Chave de API Opcional */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Chave Google Gemini API (Opcional caso já no Easypanel)
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
                      placeholder="Deixe em branco para usar a chave configurada no servidor Easypanel"
                      value={aiApiKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAiApiKey(val);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('sabeganha_gemini_api_key', val.trim());
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>
              ) : (
                // PRÉ-VISUALIZAÇÃO E EDIÇÃO DAS PERGUNTAS GERADAS
                <div className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Perguntas Geradas com Sucesso!</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Revise os enunciados e alternativas abaixo antes de confirmar o salvamento.
                      </p>
                    </div>
                    <button
                      onClick={() => setAiPreviewData(null)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 rounded-lg hover:bg-emerald-100 transition"
                    >
                      Nova Geração
                    </button>
                  </div>

                  {/* Metadados Básicos */}
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

                  {/* Lista de Questões */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Questões Estruturadas ({aiPreviewData.questions.length})
                    </h4>
                    {aiPreviewData.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                            Questão #{qIdx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {q.pointsReward || 15} Quiz Coins
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
                            Pílula Pedagógica / Explicação:
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
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {aiPublishMode === 'schedule'
                          ? 'Agendar Quiz'
                          : aiPublishMode === 'draft'
                          ? 'Salvar para Curadoria'
                          : 'Publicar no SabeGanha'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADICIONAR SUGESTÃO MANUAL DA COMUNIDADE */}
      {/* ============================================================== */}
      {activeModal === 'new_suggestion' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Nova Sugestão de Tema</h3>
              <button onClick={() => setActiveModal('none')}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tema Sugerido
              </label>
              <input
                type="text"
                placeholder="Ex: História da Conquista Espacial..."
                value={newSugTopic}
                onChange={(e) => setNewSugTopic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Categoria Sugerida
              </label>
              <input
                type="text"
                placeholder="Ex: Ciência e Tecnologia"
                value={newSugCategory}
                onChange={(e) => setNewSugCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Autor da Sugestão
              </label>
              <input
                type="text"
                placeholder="Ex: @usuario_ativo"
                value={newSugUser}
                onChange={(e) => setNewSugUser(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSuggestion}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 shadow-sm"
              >
                Salvar Sugestão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDITOR COMPLETO DE QUIZ */}
      {/* ============================================================== */}
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
                    <option value="false">Rascunho (Oculto / Curadoria)</option>
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
                        statement: 'Nova pergunta factual...',
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
                          Justificativa Pedagógica:
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
