import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import {
  Receipt,
  Fuel,
  Wrench,
  Milestone,
  AlertTriangle,
} from 'lucide-react';
import { rootRoute } from './root';
import { SecaoAbastecimento } from '../components/despesas/SecaoAbastecimento';
import { SecaoManutencao } from '../components/despesas/SecaoManutencao';
import { SecaoDespesasPedagios } from '../components/despesas/SecaoDespesasPedagios';
import { SecaoDespesasAnimaisPerdidos } from '../components/despesas/SecaoDespesasAnimaisPerdidos';

type GuiaDespesaId =
  | 'abastecimento'
  | 'manutencao'
  | 'pedagios'
  | 'animais_perdidos';

interface GuiaDespesa {
  id: GuiaDespesaId;
  titulo: string;
  descricaoArea: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GUIAS_DESPESAS: GuiaDespesa[] = [
  {
    id: 'abastecimento',
    titulo: 'Abastecimento',
    descricaoArea:
      'Controle de diesel, Arla 32, litragem e consumo médio por caminhão.',
    icon: Fuel,
  },
  {
    id: 'manutencao',
    titulo: 'Manutenção',
    descricaoArea:
      'Lançamentos de oficina, peças, pneus e revisões preventivas da frota.',
    icon: Wrench,
  },
  {
    id: 'pedagios',
    titulo: 'Pedágios',
    descricaoArea:
      'Despesas com praças de pedágio e passagens vinculadas às rotas.',
    icon: Milestone,
  },
  {
    id: 'animais_perdidos',
    titulo: 'Animais Perdidos',
    descricaoArea:
      'Consolidado financeiro das perdas de animais registradas nas viagens.',
    icon: AlertTriangle,
  },
];

function DespesasPage() {
  const [guiaAtiva, setGuiaAtiva] = useState<GuiaDespesaId>('abastecimento');

  const itemAtual =
    GUIAS_DESPESAS.find((g) => g.id === guiaAtiva) || GUIAS_DESPESAS[0];
  const IconeAtual = itemAtual.icon;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex items-start gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Despesas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Controle de custos operacionais da frota: abastecimentos, manutenções, pedágios e sinistros.
          </p>
        </div>
      </div>

      {/* Barra de Guias Horizontais no Topo */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav
          aria-label="Guias de Despesas"
          className="flex flex-wrap gap-2 -mb-px"
        >
          {GUIAS_DESPESAS.map((guia) => {
            const Icon = guia.icon;
            const ativa = guiaAtiva === guia.id;

            return (
              <button
                key={guia.id}
                type="button"
                onClick={() => setGuiaAtiva(guia.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer rounded-t-lg ${
                  ativa
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-500/10'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    ativa
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{guia.titulo}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Cabeçalho da Guia Selecionada + Conteúdo */}
      <section className="space-y-5">
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

        {guiaAtiva === 'abastecimento' && <SecaoAbastecimento />}
        {guiaAtiva === 'manutencao' && <SecaoManutencao />}
        {guiaAtiva === 'pedagios' && <SecaoDespesasPedagios />}
        {guiaAtiva === 'animais_perdidos' && <SecaoDespesasAnimaisPerdidos />}
      </section>
    </div>
  );
}

export const despesasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/despesas',
  component: DespesasPage,
});