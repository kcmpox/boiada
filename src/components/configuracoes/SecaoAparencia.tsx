import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  PALETAS_CORES,
  aplicarCorSistema,
  carregarCorSalva,
  type BrandColorId,
} from '../../theme';

export function SecaoAparencia() {
  const [corAtual, setCorAtual] = useState<BrandColorId>(() => carregarCorSalva());

  const handleSelecionarCor = (id: BrandColorId) => {
    setCorAtual(id);
    aplicarCorSistema(id);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
        Cor Principal da Aplicação
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        A cor escolhida é salva automaticamente no navegador e aplicada em todas as telas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {PALETAS_CORES.map((paleta) => {
          const selecionada = corAtual === paleta.id;
          return (
            <button
              key={paleta.id}
              type="button"
              onClick={() => handleSelecionarCor(paleta.id)}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                selecionada
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 ring-2 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full shrink-0 shadow-xs border border-black/10"
                  style={{ backgroundColor: paleta.preview }}
                />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {paleta.nome}
                </span>
              </div>
              {selecionada && (
                <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}