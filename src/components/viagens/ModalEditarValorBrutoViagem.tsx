import { useState } from 'react';
import { DollarSign, X, Check } from 'lucide-react';
import type { Viagem } from '../../storage/viagensStorage';

interface ModalEditarValorBrutoViagemProps {
  viagem: Viagem;
  onSalvar: (viagemAtualizada: Viagem) => void;
  onFechar: () => void;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function ModalEditarValorBrutoViagem({
  viagem,
  onSalvar,
  onFechar,
}: ModalEditarValorBrutoViagemProps) {
  const [valorBrutoInput, setValorBrutoInput] = useState<string>(
    viagem.valorViagem > 0 ? String(viagem.valorViagem) : ''
  );

  const brutoNum = Number(valorBrutoInput.trim().replace(',', '.'));
  const brutoValido = !isNaN(brutoNum) && brutoNum >= 0 ? brutoNum : 0;

  const percAluguel = viagem.percentualAluguelCarreta || 0;
  const novoAluguel =
    percAluguel > 0
      ? Number(((brutoValido * percAluguel) / 100).toFixed(2))
      : 0;
  const novoLiquido = Number((brutoValido - novoAluguel).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(brutoNum) || brutoNum < 0) return;

    onSalvar({
      ...viagem,
      valorViagem: Number(brutoNum.toFixed(2)),
      valorManual: true,
      valorAluguelCarreta: novoAluguel,
      valorLiquidoViagem: novoLiquido,
      regraPrecoAplicada: 'Valor bruto ajustado manualmente (Boi Magro)',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Editar Valor Bruto
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Viagem de Boi Magro • {viagem.localEmbarque}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Novo Valor Bruto da Viagem (R$) *
            </label>
            <input
              type="number"
              step="any"
              min={0}
              required
              autoFocus
              placeholder="Ex: 1450.00"
              value={valorBrutoInput}
              onChange={(e) => setValorBrutoInput(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                Aluguel Carreta ({percAluguel}%):
              </span>
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                {novoAluguel > 0
                  ? `- ${formatarMoeda(novoAluguel)}`
                  : formatarMoeda(0)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Valor Líquido Recalculado:
              </span>
              <span className="font-mono font-extrabold text-brand-600 dark:text-brand-400">
                {formatarMoeda(novoLiquido)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Valor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}