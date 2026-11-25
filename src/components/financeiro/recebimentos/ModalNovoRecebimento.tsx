import { useEffect } from 'react';
import { X, Wallet } from 'lucide-react';

interface ModalNovoRecebimentoProps {
  aberto: boolean;
  onFechar: () => void;
}

export function ModalNovoRecebimento({
  aberto,
  onFechar,
}: ModalNovoRecebimentoProps) {
  useEffect(() => {
    if (!aberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-novo-recebimento"
      onClick={onFechar}
    >
      <style>{`
        @keyframes giroHorario {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes giroAntiHorario {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes flutuarSuave {
          0%, 100% { transform: translateY(0px) rotate(-6deg); }
          50% { transform: translateY(-6px) rotate(4deg); }
        }
        .anim-engrenagem-dir {
          transform-box: fill-box;
          transform-origin: center;
          animation: giroHorario 9s linear infinite;
        }
        .anim-engrenagem-esq {
          transform-box: fill-box;
          transform-origin: center;
          animation: giroAntiHorario 6s linear infinite;
        }
        .anim-chave {
          transform-box: fill-box;
          transform-origin: center;
          animation: flutuarSuave 2.8s ease-in-out infinite;
        }
      `}</style>

      <div
        className="w-[95vw] h-[92vh] max-w-6xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="titulo-modal-novo-recebimento"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                Novo Recebimento
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lançamento e baixa de recebimentos por pagador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar janela"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Central: Em Construção com Desenho Animado */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center overflow-y-auto">
          <div className="w-44 h-44 sm:w-52 sm:h-52 mb-4 flex items-center justify-center">
            <svg
              viewBox="0 0 220 220"
              className="w-full h-full overflow-visible"
              aria-hidden="true"
            >
              {/* Engrenagem grande */}
              <g className="anim-engrenagem-dir text-brand-500">
                <circle
                  cx="122"
                  cy="118"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="12 10"
                />
                <circle
                  cx="122"
                  cy="118"
                  r="22"
                  className="fill-brand-500/15"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <circle cx="122" cy="118" r="8" fill="currentColor" />
              </g>

              {/* Engrenagem menor */}
              <g className="anim-engrenagem-esq text-amber-500">
                <circle
                  cx="72"
                  cy="74"
                  r="21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeDasharray="8 8"
                />
                <circle
                  cx="72"
                  cy="74"
                  r="12"
                  className="fill-amber-500/15"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <circle cx="72" cy="74" r="4.5" fill="currentColor" />
              </g>

              {/* Chave fixa flutuando */}
              <g className="anim-chave text-emerald-500">
                <path
                  d="M152 52 L176 76 M168 50 a11 11 0 1 0 12 12 l-6 -6 l-4 4 z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* Linha de base do canteiro */}
              <line
                x1="34"
                y1="172"
                x2="186"
                y2="172"
                className="stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
            </svg>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Em Construção
          </span>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Novo Recebimento em desenvolvimento
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 leading-relaxed">
            Estamos preparando o formulário completo para lançar recebimentos, vincular viagens e registrar baixas dos pagadores.
          </p>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="h-10 px-5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}