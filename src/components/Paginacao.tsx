import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginacaoProps {
  paginaAtual: number;
  totalItens: number;
  itensPorPagina?: number;
  onMudarPagina: (novaPagina: number) => void;
}

export function Paginacao({
  paginaAtual,
  totalItens,
  itensPorPagina = 10,
  onMudarPagina,
}: PaginacaoProps) {
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));

  if (totalPaginas <= 1) return null;

  const paginaSegura = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaSegura - 1) * itensPorPagina + 1;
  const fim = Math.min(paginaSegura * itensPorPagina, totalItens);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Exibindo{' '}
        <strong className="text-slate-700 dark:text-slate-200">
          {inicio}–{fim}
        </strong>{' '}
        de{' '}
        <strong className="text-slate-700 dark:text-slate-200">
          {totalItens}
        </strong>{' '}
        registros
      </span>

      <div className="inline-flex items-center gap-1.5 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => onMudarPagina(paginaSegura - 1)}
          disabled={paginaSegura <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Anterior
        </button>

        <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200">
          Página {paginaSegura} de {totalPaginas}
        </span>

        <button
          type="button"
          onClick={() => onMudarPagina(paginaSegura + 1)}
          disabled={paginaSegura >= totalPaginas}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          Próxima
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}