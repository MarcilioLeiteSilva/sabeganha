import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SabeGanha — Painel Administrativo',
  description: 'Gestão de Conteúdo, Quizzes, Auditoria e Catálogo de Recompensas do SabeGanha',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between hidden md:flex">
          <div>
            <div className="p-6 border-b border-slate-800">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                SabeGanha Admin
              </h1>
              <p className="text-xs text-slate-400 mt-1">Aprenda. Jogue. Conquiste.</p>
            </div>
            <nav className="p-4 space-y-1 text-sm font-medium">
              <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-600 text-white">
                📊 Visão Geral
              </a>
              <a href="/quizzes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800">
                📚 Quizzes & Categorias
              </a>
              <a href="/rewards" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800">
                🎁 Catálogo de Prêmios
              </a>
              <a href="/ledger" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800">
                📒 Ledger & Finanças
              </a>
              <a href="/fraud" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800">
                🛡️ Alertas Antifraude
              </a>
            </nav>
          </div>
          <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
            Ambiente: <span className="text-emerald-400 font-semibold">EasyPanel Staging</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Painel de Operações</h2>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2.5 py-1 rounded-full">
                SuperAdmin
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                SG
              </div>
            </div>
          </header>
          <main className="p-6 flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}

