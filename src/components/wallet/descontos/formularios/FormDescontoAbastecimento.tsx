import { useState } from 'react';
import { Check, Fuel } from 'lucide-react';
import {
  type TipoPagadorWallet,
  adicionarDescontoWallet,
} from '../../../../storage/walletStorage';

export interface OpcaoPagadorForm {
  chave: string;
  tipo: TipoPagadorWallet;
  id: string;
  nome: string;
}

interface FormDescontoAbastecimentoProps {
  pagadores: OpcaoPagadorForm[];
  onSalvo: () => void;
  onVoltarTipo: () => void;
}

export function FormDescontoAbastecimento({
  pagadores,
  onSalvo,
  onVoltarTipo,
}: FormDescontoAbastecimentoProps) {
  const [pagadorChave, setPagadorChave] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pagador = pagadores.find((p) => p.chave === pagadorChave);
    const num = Number(valor.trim().replace(',', '.'));

    if (!pagador) {
      setErro('Selecione quem vai pagar.');
      return;
    }
    if (!descricao.trim() || Number.isNaN(num) || num <= 0) {
      setErro('Informe a descrição e um valor maior que zero.');
      return;
    }

    adicionarDescontoWallet({
      tipo: 'abastecimento',
      pagadorTipo: pagador.tipo,
      pagadorId: pagador.id,
      data,
      descricao: descricao.trim(),
      valor: Number(num.toFixed(2)),
    });

    onSalvo();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          <Fuel className="w-4 h-4" />
          Desconto de Abastecimento
        </span>
        <button
          type="button"
          onClick={onVoltarTipo}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          Trocar tipo
        </button>
      </div>

      {erro && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Pagador *
          </label>
          <select
            value={pagadorChave}
            onChange={(e) => setPagadorChave(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
          >
            <option value="">Selecione quem vai pagar...</option>
            {pagadores.map((p) => (
              <option key={p.chave} value={p.chave}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Data *
          </label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Descrição / Cupom / Posto *
        </label>
        <input
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          placeholder="Ex.: Desconto diesel S10 - Nota / Minuta"
          className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Valor do Desconto (R$) *
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          placeholder="0,00"
          className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
        />
      </div>

      <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="submit"
          className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Salvar Desconto
        </button>
      </div>
    </form>
  );
}