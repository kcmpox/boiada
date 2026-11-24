import { HardHat } from 'lucide-react';

interface EmConstrucaoProps {
  titulo: string;
  subtitulo: string;
  descricao: string;
  modulo: string;
}

export function EmConstrucao({
  titulo,
  subtitulo,
  descricao,
  modulo,
}: EmConstrucaoProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
          <span>{modulo}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {titulo}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitulo}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-8 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-5">
          <HardHat className="w-7 h-7" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-500/20 text-brand-800 dark:text-brand-400 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Módulo em Construção
        </span>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{titulo}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-md">
          {descricao}
        </p>
      </div>
    </div>
  );
}