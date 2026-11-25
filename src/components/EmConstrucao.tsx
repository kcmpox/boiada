import { Construction } from "lucide-react";

export interface EmConstrucaoProps {
  modulo?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
}

export function EmConstrucao({
  modulo,
  titulo = "Página em construção",
  subtitulo,
  descricao,
}: EmConstrucaoProps) {
  const textoApoio = descricao || subtitulo;

  return (
    <div className="flex flex-col items-center justify-center min-h-[45vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
        <Construction className="w-6 h-6" />
      </div>

      {modulo && (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          {modulo}
        </span>
      )}

      <span className="mb-2 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
        Em Construção
      </span>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        {titulo}
      </h2>

      {textoApoio && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
          {textoApoio}
        </p>
      )}
    </div>
  );
}
