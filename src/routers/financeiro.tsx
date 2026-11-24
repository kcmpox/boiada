import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import {
  Landmark,
  ArrowDownCircle,
  Clock,
  BadgePercent,
} from 'lucide-react';
import { rootRoute } from './root';
import { SecaoRecebimentos } from '../components/financeiro/SecaoRecebimentos';
import { SecaoAtrasadas } from '../components/financeiro/SecaoAtrasadas';
import { SecaoComissoes } from '../components/financeiro/SecaoComissoes';

type GuiaFinanceiroId = 'recebimentos' | 'atrasadas' | 'comissoes';

interface GuiaFinanceiro {
  id: GuiaFinanceiroId;
  titulo: string;
  descricaoArea: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GUIAS_FINANCEIRO: GuiaFinanceiro[] = [
  {
    id: 'recebimentos',
    titulo: 'Recebimentos',
    descricaoArea:
      'Previsão de entradas por ciclo de pagamento, valores brutos, repasses de carreta e valores líquidos.',
    icon: ArrowDownCircle,
  },
  {
    id: 'atrasadas',
    titulo: 'Atrasadas',
    descricaoArea:
      'Controle de fretes vencidos que ainda não tiveram o pagamento confirmado.',
    icon: Clock,
  },
  {
    id: 'comissoes',
    titulo: 'Comissões',
    descricaoArea:
      'Apuração de comissões sobre viagens e ajuda de custo mensal dos motoristas.',
    icon: BadgePercent,
  },
];

function FinanceiroPage() {
  const [guiaAtiva, setGuiaAtiva] = useState<GuiaFinanceiroId>('recebimentos');

  const itemAtual =
    GUIAS_FINANCEIRO.find((g) => g.id === guiaAtiva) || GUIAS_FINANCEIRO[0];
  const IconeAtual = itemAtual.icon;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex items-start gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financeiro
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de recebimentos de fretes, cobranças em atraso e fechamento de comissões.
          </p>
        </div>
      </div>

      {/* Barra de Guias Horizontais no Topo */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav
          aria-label="Guias do Financeiro"
          className="flex flex-wrap gap-2 -mb-px"
        >
          {GUIAS_FINANCEIRO.map((guia) => {
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

        {guiaAtiva === 'recebimentos' && <SecaoRecebimentos />}
        {guiaAtiva === 'atrasadas' && <SecaoAtrasadas />}
        {guiaAtiva === 'comissoes' && <SecaoComissoes />}
      </section>
    </div>
  );
}

export const financeiroRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financeiro',
  component: FinanceiroPage,
});