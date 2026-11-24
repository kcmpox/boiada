import { useState } from 'react';
import { Check, Save } from 'lucide-react';

export function SecaoAnotacoes() {
  const [texto, setTexto] = useState<string>(() => {
    return localStorage.getItem('bt_config_anotacoes') || '';
  });
  const [salvoRecentemente, setSalvoRecentemente] = useState(false);

  const handleSalvar = () => {
    localStorage.setItem('bt_config_anotacoes', texto);
    setSalvoRecentemente(true);
    setTimeout(() => setSalvoRecentemente(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
      <div>
        <label
          htmlFor="bloco-anotacoes"
          className="block text-sm font-semibold text-slate-900 dark:text-white mb-1"
        >
          Bloco de Anotações Gerais
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Anote informações importantes da operação, observações sobre caminhões ou lembretes.
        </p>
      </div>

      <textarea
        id="bloco-anotacoes"
        rows={8}
        placeholder="Escreva suas anotações aqui..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="w-full p-3.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-y leading-relaxed"
      />

      <div className="flex items-center justify-end gap-3">
        {salvoRecentemente && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            Anotações salvas
          </span>
        )}
        <button
          type="button"
          onClick={handleSalvar}
          className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Salvar Anotações
        </button>
      </div>
    </div>
  );
}