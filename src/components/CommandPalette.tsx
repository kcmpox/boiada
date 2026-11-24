import { useEffect, useRef, useState } from 'react';
import { Terminal, Sun, Moon, X, Code2 } from 'lucide-react';

interface CommandPaletteProps {
  onChangeTheme: (isDark: boolean) => void;
  onChangeDevMode: (enabled: boolean) => void;
}

const COMANDOS_DISPONIVEIS = [
  {
    comando: '/theme dark',
    descricao: 'Ativar tema escuro',
    icon: Moon,
  },
  {
    comando: '/theme light',
    descricao: 'Ativar tema claro',
    icon: Sun,
  },
  {
    comando: '/devmode enable',
    descricao: 'Ativar edição direta de JSON nos cadastros',
    icon: Code2,
  },
  {
    comando: '/devmode disable',
    descricao: 'Desativar modo desenvolvedor',
    icon: Code2,
  },
];

// Encontra o maior prefixo comum entre strings (ex: "/theme dark" e "/theme light" -> "/theme ")
function encontrarPrefixoComum(lista: string[]): string {
  if (lista.length === 0) return '';
  if (lista.length === 1) return lista[0];

  let prefixo = lista[0];
  for (let i = 1; i < lista.length; i++) {
    while (!lista[i].startsWith(prefixo) && prefixo.length > 0) {
      prefixo = prefixo.slice(0, -1);
    }
  }
  return prefixo;
}

export function CommandPalette({
  onChangeTheme,
  onChangeDevMode,
}: CommandPaletteProps) {
  const [aberto, setAberto] = useState(false);
  const [input, setInput] = useState('');
  const [erro, setErro] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aberto) {
        setAberto(false);
        return;
      }

      if (e.key === ';' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName.toLowerCase();
        const isEditable =
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          target?.isContentEditable;

        if (!isEditable) {
          e.preventDefault();
          setInput('');
          setErro('');
          setAberto(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aberto]);

  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [aberto]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const digitado = input.toLowerCase();
      if (!digitado) return;

      const correspondencias = COMANDOS_DISPONIVEIS.map((c) => c.comando).filter(
        (cmd) => cmd.startsWith(digitado)
      );

      if (correspondencias.length === 1) {
        setInput(correspondencias[0]);
      } else if (correspondencias.length > 1) {
        const comum = encontrarPrefixoComum(correspondencias);
        if (comum.length > digitado.length) {
          setInput(comum);
        }
      }
    }
  };

  const executarComando = (cmdBruto: string) => {
    const cmd = cmdBruto.trim().toLowerCase();

    if (cmd === '/theme dark') {
      onChangeTheme(true);
      setAberto(false);
      return;
    }

    if (cmd === '/theme light') {
      onChangeTheme(false);
      setAberto(false);
      return;
    }

    if (cmd === '/devmode enable') {
      onChangeDevMode(true);
      setAberto(false);
      return;
    }

    if (cmd === '/devmode disable') {
      onChangeDevMode(false);
      setAberto(false);
      return;
    }

    setErro(`Comando não reconhecido: "${cmdBruto.trim()}"`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executarComando(input);
  };

  if (!aberto) return null;

  const sugestoesFiltradas = COMANDOS_DISPONIVEIS.filter((item) =>
    item.comando.toLowerCase().includes(input.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={() => setAberto(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800"
        >
          <Terminal className="w-5 h-5 text-brand-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onKeyDown={handleInputKeyDown}
            onChange={(e) => {
              setInput(e.target.value);
              if (erro) setErro('');
            }}
            placeholder="Digite um comando (use TAB para completar)..."
            className="flex-1 bg-transparent text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {erro && (
          <div className="px-4 py-2 text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-b border-red-200/60 dark:border-red-500/20">
            {erro}
          </div>
        )}

        <div className="p-2 space-y-1">
          <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Comandos Disponíveis
          </div>
          {sugestoesFiltradas.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.comando}
                type="button"
                onClick={() => executarComando(item.comando)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                  <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                    {item.comando}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {item.descricao}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              Tab
            </kbd>{' '}
            completar •{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              Enter
            </kbd>{' '}
            executar
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              Esc
            </kbd>{' '}
            fechar
          </span>
        </div>
      </div>
    </div>
  );
}