import {
  Calendar,
  Truck,
  Building2,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  Code2,
  Fuel,
  AlertTriangle,
  Milestone,
  HelpCircle,
} from 'lucide-react';
import { useDevMode } from '../../context/DevModeContext';
import type {
  DescontoWallet,
  ReembolsoWallet,
} from '../../storage/walletStorage';

interface CardLancamentoWalletProps {
  variante: 'desconto' | 'reembolso';
  item: DescontoWallet | ReembolsoWallet;
  nomePagador: string;
  nomeCaminhao?: string;
  onEditar: () => void;
  onEditarJson: () => void;
  onArquivar?: () => void;
  onRestaurar?: () => void;
  onExcluir: () => void;
}

const BADGE_TIPO: Record<
  string,
  {
    label: string;
    classe: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  abastecimento: {
    label: 'Abastecimento',
    classe:
      'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25',
    icon: Fuel,
  },
  animais_perdidos: {
    label: 'Animais Perdidos',
    classe:
      'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
    icon: AlertTriangle,
  },
  pedagio: {
    label: 'Pedágio',
    classe:
      'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25',
    icon: Milestone,
  },
  frete: {
    label: 'Frete',
    classe:
      'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
    icon: Truck,
  },
  outro: {
    label: 'Outro',
    classe:
      'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/25',
    icon: HelpCircle,
  },
};

function formatarDataBr(isoDate: string): string {
  if (!isoDate) return '—';
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

export function CardLancamentoWallet({
  variante,
  item,
  nomePagador,
  nomeCaminhao,
  onEditar,
  onEditarJson,
  onArquivar,
  onRestaurar,
  onExcluir,
}: CardLancamentoWalletProps) {
  const { devMode } = useDevMode();
  const tipoInfo = BADGE_TIPO[item.tipo || 'outro'] || BADGE_TIPO.outro;
  const IconeTipo = tipoInfo.icon;

  const isDesconto = variante === 'desconto';

  return (
    <article
      className={`rounded-xl border border-slate-200/90 dark:border-slate-800 border-l-4 ${
        isDesconto ? 'border-l-amber-500' : 'border-l-emerald-500'
      } bg-white dark:bg-slate-900/75 p-4 sm:p-5 shadow-2xs transition-colors hover:border-slate-300 dark:hover:border-slate-700 ${
        item.arquivado ? 'opacity-85' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Coluna Esquerda: Metadados e Descrição */}
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tipoInfo.classe}`}
            >
              <IconeTipo className="w-3 h-3" />
              {tipoInfo.label}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Building2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              {nomePagador}
            </span>

            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatarDataBr(item.data)}
            </span>

            {nomeCaminhao && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <Truck className="w-3 h-3 text-slate-400" />
                {nomeCaminhao}
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug break-words">
            {item.descricao}
          </p>
        </div>

        {/* Coluna Direita: Valor + Ações */}
        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
          <div className="sm:text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {isDesconto ? 'Desconto' : 'Reembolso'}
            </span>
            <strong
              className={`text-base sm:text-lg font-mono font-extrabold ${
                isDesconto
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {item.valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>

          <div className="flex items-center gap-1">
            {devMode && (
              <button
                type="button"
                onClick={onEditarJson}
                title="Editar JSON (DevMode)"
                className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
              >
                <Code2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onEditar}
              title="Editar registro"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {item.arquivado && onRestaurar ? (
              <button
                type="button"
                onClick={onRestaurar}
                title="Restaurar registro"
                className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              onArquivar && (
                <button
                  type="button"
                  onClick={onArquivar}
                  title="Arquivar registro"
                  className="p-2 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )
            )}

            <button
              type="button"
              onClick={onExcluir}
              title="Excluir registro"
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}