import { useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import {
  type TipoPagadorWallet,
  adicionarDescontoWallet,
} from '../../../../storage/walletStorage';
import type { OpcaoPagadorForm } from './FormDescontoAbastecimento';

interface FormDescontoAnimaisPerdidosProps {
  pagadores: OpcaoPagadorForm[];
  onSalvo: () => void;
  onVoltarTipo: () => void;
}

export function FormDescontoAnimaisPerdidos({
  pagadores,
  onSalvo,
  onVoltarTipo,
}: FormDescontoAnimaisPerdidosProps) {
  const [pagadorChave, setPagadorChave] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [quantidade, setQuantidade] = useState('1');
  const [valorUnitario, setValorUnitario] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  const qtdNum = Math.max(0, parseInt(quantidade, 10) || 0);
  const unitNum = Math.max(0, Number(valorUnitario.replace(',', '.')) || 0);
  const totalCalculado = Number((qtdNum * unitNum).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pagador = pagadores.find((p) => p.chave === pagadorChave);

    if (!pagador) {
      setErro('Selecione quem vai pagar.');
      return;
    }
    if (qtdNum <= 0 || totalCalculado <= 0) {
      setErro('Informe a quantidade e o valor unitário do animal.');
      return;
    }

    const textoResumo = [
      `${qtdNum} animal(is) perdido(s)`,
      observacao.trim() || null,
    ]
      .filter(Boolean)
      .join(' — ');

    adicionarDescontoWallet({
      tipo: 'animais_perdidos',
      pagadorTipo: pagador.tipo as TipoPagadorWallet,
      pagadorId: pagador.id,
      data,
      descricao: textoResumo,
      valor: totalCalculado,
    });

    onSalvo();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          Desconto de Animais Perdidos
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Quantidade de Animais *
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Valor Unitário (R$) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={valorUnitario}
            onChange={(e) => setValorUnitario(e.target.value)}
            required
            placeholder="0,00"
            className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Observação / Viagem
        </label>
        <input
          type="text"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex.: Minuta 402 - Embarque Fazenda Santa Maria"
          className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
        />
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          Total do desconto:
        </span>
        <strong className="text-sm font-mono font-bold text-slate-900 dark:text-white">
          {totalCalculado.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </strong>
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