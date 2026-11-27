import { useEffect } from 'react';
import { X, ArrowRight, Check, Trash2, Code2 } from 'lucide-react';

export interface DadosConfirmacaoAntesDepois {
  tipoAcao: 'editar' | 'excluir';
  titulo: string;
  descricao: string;
  jsonAntes: string;
  jsonDepois: string;
  onConfirmar: () => void;
}

interface ModalConfirmacaoAntesDepoisProps {
  dados: DadosConfirmacaoAntesDepois | null;
  onCancelar: () => void;
}

export function ModalConfirmacaoAntesDepois({
  dados,
  onCancelar,
}: ModalConfirmacaoAntesDepoisProps) {
  useEffect(() => {
    if (!dados) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dados, onCancelar]);

  if (!dados) return null;

  const ehExclusao = dados.tipoAcao === 'excluir';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmacao-antes-depois"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                ehExclusao
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-brand-50 dark:bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400'
              }`}
            >
              {ehExclusao ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <Code2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3
                id="titulo-confirmacao-antes-depois"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white"
              >
                {dados.titulo}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {dados.descricao}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancelar}
            aria-label="Fechar confirmação"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
            <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Antes
              </div>
              <pre className="p-3.5 text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-auto max-h-[55vh] whitespace-pre-wrap break-all">
                {dados.jsonAntes}
              </pre>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>

            <div
              className={`flex flex-col rounded-xl border overflow-hidden ${
                ehExclusao
                  ? 'border-rose-500/30 bg-rose-500/5'
                  : 'border-emerald-500/30 bg-emerald-500/5'
              }`}
            >
              <div
                className={`px-3.5 py-2 border-b text-[11px] font-bold uppercase tracking-wider ${
                  ehExclusao
                    ? 'border-rose-500/20 text-rose-600 dark:text-rose-400'
                    : 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                Depois
              </div>
              <pre className="p-3.5 text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-auto max-h-[55vh] whitespace-pre-wrap break-all">
                {dados.jsonDepois}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
          <button
            type="button"
            onClick={onCancelar}
            className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={dados.onConfirmar}
            className={`h-9 px-4 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              ehExclusao
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-brand-500 hover:bg-brand-600 text-brand-contrast'
            }`}
          >
            {ehExclusao ? (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Confirmar Exclusão
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Confirmar Alteração
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}