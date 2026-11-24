import { useState, useCallback } from 'react';
import { createRoute } from '@tanstack/react-router';
import {
  Truck,
  ArrowLeftRight,
  AlertTriangle,
  History,
  Archive,
  ChevronRight,
} from 'lucide-react';
import { rootRoute } from './root';
import { listarViagens } from '../storage/viagensStorage';
import { SecaoViagensAtivas } from '../components/viagens/SecaoViagensAtivas';
import { SecaoSaidaChegada } from '../components/viagens/SecaoSaidaChegada';
import { SecaoAnimaisPerdidos } from '../components/viagens/SecaoAnimaisPerdidos';
import { SecaoHistoricoViagens } from '../components/viagens/SecaoHistoricoViagens';
import { SecaoViagensArquivadas } from '../components/viagens/SecaoViagensArquivadas';

type CategoriaViagemId =
  | 'viagens'
  | 'saida_chegada'
  | 'animais_perdidos'
  | 'historico'
  | 'arquivadas';

interface CategoriaViagem {
  id: CategoriaViagemId;
  titulo: string;
  subtitulo: string;
  descricaoArea: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIAS_VIAGEM: CategoriaViagem[] = [
  {
    id: 'viagens',
    titulo: 'Viagens',
    subtitulo: 'Lançamentos e fretes ativos',
    descricaoArea:
      'Registre novas viagens de transporte de gado com cálculo automático pela tabela do pagador.',
    icon: Truck,
  },
  {
    id: 'saida_chegada',
    titulo: 'Saída & Chegada',
    subtitulo: 'Controle de embarque e desembarque',
    descricaoArea:
      'Registre o dia e a hora de saída e chegada das viagens realizadas.',
    icon: ArrowLeftRight,
  },
  {
    id: 'animais_perdidos',
    titulo: 'Animais Perdidos',
    subtitulo: 'Ocorrências e sinistros em rota',
    descricaoArea:
      'Informe se houve perda de animais nas viagens concluídas e registre quantidade e valor.',
    icon: AlertTriangle,
  },
  {
    id: 'historico',
    titulo: 'Histórico',
    subtitulo: 'Extrato cronológico de viagens',
    descricaoArea:
      'Acompanhe a timeline completa com horários de saída e chegada de cada viagem.',
    icon: History,
  },
  {
    id: 'arquivadas',
    titulo: 'Arquivadas',
    subtitulo: 'Registros arquivados',
    descricaoArea:
      'Visualize viagens arquivadas fora da operação ativa.',
    icon: Archive,
  },
];

function lerContadoresPendencias() {
  const ativas = listarViagens();
  const pendentesSaidaChegada = ativas.filter(
    (v) => v.statusSaidaChegada === 'pendente'
  ).length;
  const pendentesAnimaisPerdidos = ativas.filter(
    (v) =>
      v.statusSaidaChegada === 'registrado' &&
      v.statusAnimaisPerdidos === 'pendente'
  ).length;

  return { pendentesSaidaChegada, pendentesAnimaisPerdidos };
}

function ViagensPage() {
  const [categoriaAtiva, setCategoriaAtiva] =
    useState<CategoriaViagemId>('viagens');
  const [contadores, setContadores] = useState(() => lerContadoresPendencias());

  const atualizarContadores = useCallback(() => {
    setContadores(lerContadoresPendencias());
  }, []);

  const handleTrocarCategoria = (id: CategoriaViagemId) => {
    setCategoriaAtiva(id);
    atualizarContadores();
  };

  const itemAtual =
    CATEGORIAS_VIAGEM.find((cat) => cat.id === categoriaAtiva) ||
    CATEGORIAS_VIAGEM[0];
  const IconeAtual = itemAtual.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Viagens
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Controle operacional de fretes, saída e chegada, ocorrências e histórico.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 xl:col-span-3 space-y-2">
          {CATEGORIAS_VIAGEM.map((cat) => {
            const Icon = cat.icon;
            const ativa = categoriaAtiva === cat.id;
            const badgeCount =
              cat.id === 'saida_chegada'
                ? contadores.pendentesSaidaChegada
                : cat.id === 'animais_perdidos'
                  ? contadores.pendentesAnimaisPerdidos
                  : 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleTrocarCategoria(cat.id)}
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
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold truncate ${
                          ativa
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cat.titulo}
                      </span>
                      {badgeCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-brand-500 text-brand-contrast">
                          {badgeCount}
                        </span>
                      )}
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

          {categoriaAtiva === 'viagens' && <SecaoViagensAtivas />}
          {categoriaAtiva === 'saida_chegada' && (
            <SecaoSaidaChegada onAtualizarContadores={atualizarContadores} />
          )}
          {categoriaAtiva === 'animais_perdidos' && (
            <SecaoAnimaisPerdidos
              onAtualizarContadores={atualizarContadores}
            />
          )}
          {categoriaAtiva === 'historico' && <SecaoHistoricoViagens />}
          {categoriaAtiva === 'arquivadas' && <SecaoViagensArquivadas />}
        </section>
      </div>
    </div>
  );
}

export const viagensRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/viagens',
  component: ViagensPage,
});