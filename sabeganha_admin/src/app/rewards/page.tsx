import React from 'react';

export default function RewardsPage() {
  const rewards = [
    {
      id: '27b24aae-e734-40a4-8141-e7ed8931c7d4',
      name: 'Cupom de 20% OFF em Livros e Cursos',
      partner: 'Livraria & Conhecimento Parceira',
      coinCost: 100,
      stock: 50,
      claimed: 3,
      category: 'Educação & Leitura',
      status: 'Disponível',
    },
    {
      id: '494bbc18-1766-48fc-9d1f-5e7978639bc7',
      name: 'Vale-Presente Digital R$ 10,00',
      partner: 'Distribuidor Corporativo Homologado',
      coinCost: 500,
      stock: 20,
      claimed: 1,
      category: 'Vale-Presente Parceiro',
      status: 'Disponível',
    },
    {
      id: 'b8192314-9981-4fe1-968b-57f6b92a40e1',
      name: 'Vale R$ 15 em Cursos e Formação',
      partner: 'Plataforma EduPro Brasil',
      coinCost: 200,
      stock: 35,
      claimed: 0,
      category: 'Cursos Online',
      status: 'Disponível',
    },
    {
      id: 'c9018471-1234-4902-8a12-887192384a55',
      name: 'Assinatura 1 Mês Audiobooks & Podcasts',
      partner: 'AudioBooks Brasil',
      coinCost: 250,
      stock: 40,
      claimed: 2,
      category: 'Cultura & Mídia',
      status: 'Disponível',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Vouchers & Prêmios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Conformidade estrita com o <strong>Modelo A</strong>: benefícios tangíveis e vouchers de parceiros cadastrados.
          </p>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 shadow-sm transition">
          + Cadastrar Novo Voucher
        </button>
      </div>

      {/* Métricas do Catálogo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total de Itens Ativos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{rewards.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Estoque Disponível</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {rewards.reduce((acc, r) => acc + r.stock, 0)} vouchers
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Resgates Realizados</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {rewards.reduce((acc, r) => acc + r.claimed, 0)} resgates
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Parceiros Homologados</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">4 Empresas</p>
        </div>
      </div>

      {/* Tabela de Vouchers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Vouchers Ativos no App Mobile</h2>
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
            ● Catálogo Sincronizado
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">Benefício / Voucher</th>
                <th className="px-5 py-3 font-semibold">Parceiro Homologado</th>
                <th className="px-5 py-3 font-semibold">Categoria</th>
                <th className="px-5 py-3 font-semibold">Custo (Quiz Coins)</th>
                <th className="px-5 py-3 font-semibold">Estoque</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rewards.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{r.name}</td>
                  <td className="px-5 py-3.5">{r.partner}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {r.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-purple-700">{r.coinCost} QC</td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{r.stock} un.</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      {r.status}
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

