import { Construction } from 'lucide-react';

interface EmConstrucaoProps {
  titulo: string;
  subtitulo?: string;
}

export function EmConstrucao({ titulo, subtitulo }: EmConstrucaoProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center">
      <Construction className="w-12 h-12 text-amber-500 mb-4" />
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        {titulo}
      </h1>
      {subtitulo && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {subtitulo}
        </p>
      )}
      <span className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
        Página em construção
      </span>
    </div>
  );
}