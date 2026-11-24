import { HardHat } from 'lucide-react';

export function SecaoComissoes() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
        <HardHat className="w-6 h-6" />
      </div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-500/20 text-brand-800 dark:text-brand-400 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
        Em Construção
      </span>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        Seção de Comissões em desenvolvimento
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
        Calcule o fechamento mensal de comissões e ajuda de custo por motorista.
      </p>
    </div>
  );
}