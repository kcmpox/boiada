import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import {
  Settings,
  DatabaseBackup,
  Palette,
  StickyNote,
  ChevronRight,
} from 'lucide-react';
import { rootRoute } from './root';
import { SecaoControleDados } from '../components/configuracoes/SecaoControleDados';
import { SecaoAparencia } from '../components/configuracoes/SecaoAparencia';
import { SecaoAnotacoes } from '../components/configuracoes/SecaoAnotacoes';

type CategoriaConfigId = 'dados' | 'aparencia' | 'anotacoes';

interface CategoriaConfig {
  id: CategoriaConfigId;
  titulo: string;
  subtitulo: string;
  descricaoArea: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIAS_CONFIG: CategoriaConfig[] = [
  {
    id: 'dados',
    titulo: 'Controle de Dados',
    subtitulo: 'Pasta de fotos e backups',
    descricaoArea:
      'Gerencie o vínculo com a pasta local do computador para armazenar fotos e faça cópias de segurança dos seus dados.',
    icon: DatabaseBackup,
  },
  {
    id: 'aparencia',
    titulo: 'Aparência',
    subtitulo: 'Cores e personalização visual',
    descricaoArea:
      'Personalize a cor de destaque dos menus, botões e indicadores do sistema.',
    icon: Palette,
  },
  {
    id: 'anotacoes',
    titulo: 'Anotações',
    subtitulo: 'Bloco de notas rápido',
    descricaoArea:
      'Espaço livre para guardar lembretes, observações de rotas, contatos ou regras gerais da empresa.',
    icon: StickyNote,
  },
];

function ConfiguracoesPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaConfigId>('dados');

  const itemAtual =
    CATEGORIAS_CONFIG.find((cat) => cat.id === categoriaAtiva) || CATEGORIAS_CONFIG[0];
  const IconeAtual = itemAtual.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Configurações
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Controle de dados, aparência do sistema e anotações gerais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 xl:col-span-3 space-y-2">
          {CATEGORIAS_CONFIG.map((cat) => {
            const Icon = cat.icon;
            const ativa = categoriaAtiva === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  ativa
                    ? 'bg-white dark:bg-slate-900 border-brand-500 ring-1 ring-brand-500/30 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      ativa
                        ? 'bg-brand-500 text-brand-contrast shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-semibold truncate ${
                        ativa
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cat.titulo}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {cat.subtitulo}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    ativa
                      ? 'text-brand-600 dark:text-brand-400 translate-x-0.5'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              </button>
            );
          })}
        </aside>

        <section className="lg:col-span-8 xl:col-span-9 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <IconeAtual className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {itemAtual.titulo}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {itemAtual.descricaoArea}
              </p>
            </div>
          </div>

          {categoriaAtiva === 'dados' && <SecaoControleDados />}
          {categoriaAtiva === 'aparencia' && <SecaoAparencia />}
          {categoriaAtiva === 'anotacoes' && <SecaoAnotacoes />}
        </section>
      </div>
    </div>
  );
}

export const configuracoesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/configuracoes',
  component: ConfiguracoesPage,
});