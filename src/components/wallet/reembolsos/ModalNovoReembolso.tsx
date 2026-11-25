import { useState, useEffect, useMemo } from 'react';
import {
  X,
  TrendingUp,
  Milestone,
  Fuel,
  Truck,
  HelpCircle,
} from 'lucide-react';
import { type TipoReembolsoWallet } from '../../../storage/walletStorage';
import {
  listarFrigorificos,
  listarIntermediarios,
} from '../../../storage/cadastrosStorage';
import type { OpcaoPagadorForm } from '../descontos/formularios/FormDescontoAbastecimento';
import { FormReembolsoPedagio } from './formularios/FormReembolsoPedagio';
import { FormReembolsoAbastecimento } from './formularios/FormReembolsoAbastecimento';
import { FormReembolsoFrete } from './formularios/FormReembolsoFrete';
import { FormReembolsoOutro } from './formularios/FormReembolsoOutro';

interface ModalNovoReembolsoProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
}

const TIPOS_REEMBOLSO: {
  id: TipoReembolsoWallet;
  titulo: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'pedagio',
    titulo: 'Pedágio',
    descricao: 'Reembolso de tarifas de pedágio pagas pela frota.',
    icon: Milestone,
  },
  {
    id: 'abastecimento',
    titulo: 'Abastecimento',
    descricao: 'Reembolso de combustível ou abastecimentos ressarcíveis.',
    icon: Fuel,
  },
  {
    id: 'frete',
    titulo: 'Frete',
    descricao: 'Reembolso ou acerto de valores ligados ao frete.',
    icon: Truck,
  },
  {
    id: 'outro',
    titulo: 'Outro',
    descricao: 'Outros tipos de reembolso ou ressarcimento.',
    icon: HelpCircle,
  },
];

export function ModalNovoReembolso({
  aberto,
  onFechar,
  onSalvo,
}: ModalNovoReembolsoProps) {
  const [tipoSelecionado, setTipoSelecionado] =
    useState<TipoReembolsoWallet | null>(null);

  useEffect(() => {
    if (!aberto) {
      setTipoSelecionado(null);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, onFechar]);

  const pagadores = useMemo<OpcaoPagadorForm[]>(() => {
    if (!aberto) return [];
    const inters = listarIntermediarios().map((i) => ({
      chave: `intermediario:${i.id}`,
      tipo: 'intermediario' as const,
      id: String(i.id),
      nome: `${i.nome} (Intermediário)`,
    }));
    const frigs = listarFrigorificos().map((f) => ({
      chave: `frigorifico:${f.id}`,
      tipo: 'frigorifico' as const,
      id: String(f.id),
      nome: `${f.nome} (Frigorífico)`,
    }));
    return [...inters, ...frigs];
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Novo Reembolso
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tipoSelecionado
                  ? 'Preencha os dados do reembolso selecionado'
                  : 'Escolha qual tipo de reembolso deseja lançar'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {!tipoSelecionado ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIPOS_REEMBOLSO.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTipoSelecionado(item.id)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 bg-slate-50/60 dark:bg-slate-950/50 hover:bg-brand-50/40 dark:hover:bg-brand-500/10 text-left space-y-1.5 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-brand-500 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.titulo}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      {item.descricao}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : tipoSelecionado === 'pedagio' ? (
            <FormReembolsoPedagio
              pagadores={pagadores}
              onSalvo={() => {
                onSalvo();
                onFechar();
              }}
              onVoltarTipo={() => setTipoSelecionado(null)}
            />
          ) : tipoSelecionado === 'abastecimento' ? (
            <FormReembolsoAbastecimento
              pagadores={pagadores}
              onSalvo={() => {
                onSalvo();
                onFechar();
              }}
              onVoltarTipo={() => setTipoSelecionado(null)}
            />
          ) : tipoSelecionado === 'frete' ? (
            <FormReembolsoFrete
              pagadores={pagadores}
              onSalvo={() => {
                onSalvo();
                onFechar();
              }}
              onVoltarTipo={() => setTipoSelecionado(null)}
            />
          ) : (
            <FormReembolsoOutro
              pagadores={pagadores}
              onSalvo={() => {
                onSalvo();
                onFechar();
              }}
              onVoltarTipo={() => setTipoSelecionado(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}