import { useState, useEffect, useMemo } from 'react';
import { X, Pencil, Check, AlertCircle } from 'lucide-react';
import {
  type DescontoWallet,
  type ReembolsoWallet,
  type TipoDescontoWallet,
  type TipoReembolsoWallet,
  type TipoPagadorWallet,
  atualizarDescontoWallet,
  atualizarReembolsoWallet,
} from '../../storage/walletStorage';
import {
  listarFrigorificos,
  listarIntermediarios,
  listarCaminhoes,
} from '../../storage/cadastrosStorage';

interface ModalEditarLancamentoWalletProps {
  tipoRegistro: 'desconto' | 'reembolso';
  registro: DescontoWallet | ReembolsoWallet | null;
  onFechar: () => void;
  onSalvo: () => void;
}

const OPCOES_TIPO_DESCONTO: { valor: TipoDescontoWallet; label: string }[] = [
  { valor: 'abastecimento', label: 'Abastecimento' },
  { valor: 'animais_perdidos', label: 'Animais Perdidos' },
  { valor: 'frete', label: 'Frete' },
  { valor: 'outro', label: 'Outro' },
];

const OPCOES_TIPO_REEMBOLSO: { valor: TipoReembolsoWallet; label: string }[] = [
  { valor: 'pedagio', label: 'Pedágio' },
  { valor: 'abastecimento', label: 'Abastecimento' },
  { valor: 'frete', label: 'Frete' },
  { valor: 'outro', label: 'Outro' },
];

export function ModalEditarLancamentoWallet({
  tipoRegistro,
  registro,
  onFechar,
  onSalvo,
}: ModalEditarLancamentoWalletProps) {
  const pagadores = useMemo(() => {
    const inters = listarIntermediarios().map((i) => ({
      chave: `intermediario:${i.id}`,
      tipo: 'intermediario' as TipoPagadorWallet,
      id: String(i.id),
      nome: `${i.nome} (Intermediário)`,
    }));
    const frigs = listarFrigorificos().map((f) => ({
      chave: `frigorifico:${f.id}`,
      tipo: 'frigorifico' as TipoPagadorWallet,
      id: String(f.id),
      nome: `${f.nome} (Frigorífico)`,
    }));
    return [...inters, ...frigs];
  }, [registro]);

  const caminhoes = useMemo(
    () => listarCaminhoes().filter((c) => c.ativo !== false),
    [registro]
  );

  const [tipo, setTipo] = useState<string>('outro');
  const [pagadorChave, setPagadorChave] = useState('');
  const [caminhaoId, setCaminhaoId] = useState('');
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!registro) return;
    setErro('');
    setTipo(registro.tipo || 'outro');
    setPagadorChave(`${registro.pagadorTipo}:${registro.pagadorId}`);
    setCaminhaoId(registro.caminhaoId ? String(registro.caminhaoId) : '');
    setData(registro.data || '');
    setDescricao(registro.descricao || '');
    setValor(registro.valor !== undefined ? String(registro.valor) : '');
  }, [registro]);

  useEffect(() => {
    if (!registro) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [registro, onFechar]);

  if (!registro) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pagador = pagadores.find((p) => p.chave === pagadorChave);
    const num = Number(valor.trim().replace(',', '.'));

    if (!pagador) {
      setErro('Selecione um pagador.');
      return;
    }
    if (!caminhaoId) {
      setErro('Selecione um caminhão.');
      return;
    }
    if (!data) {
      setErro('Informe a data.');
      return;
    }
    if (!descricao.trim() || Number.isNaN(num) || num <= 0) {
      setErro('Informe uma descrição e um valor maior que zero.');
      return;
    }

    if (tipoRegistro === 'desconto') {
      atualizarDescontoWallet(registro.id, {
        tipo: tipo as TipoDescontoWallet,
        pagadorTipo: pagador.tipo,
        pagadorId: pagador.id,
        caminhaoId,
        data,
        descricao: descricao.trim(),
        valor: Number(num.toFixed(2)),
      });
    } else {
      atualizarReembolsoWallet(registro.id, {
        tipo: tipo as TipoReembolsoWallet,
        pagadorTipo: pagador.tipo,
        pagadorId: pagador.id,
        caminhaoId,
        data,
        descricao: descricao.trim(),
        valor: Number(num.toFixed(2)),
      });
    }

    onSalvo();
    onFechar();
  };

  const opcoesTipo =
    tipoRegistro === 'desconto'
      ? OPCOES_TIPO_DESCONTO
      : OPCOES_TIPO_REEMBOLSO;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {tipoRegistro === 'desconto'
                ? 'Editar Desconto'
                : 'Editar Reembolso'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                {opcoesTipo.map((op) => (
                  <option key={op.valor} value={op.valor}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Caminhão *
              </label>
              <select
                value={caminhaoId}
                onChange={(e) => setCaminhaoId(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                <option value="">Selecione um caminhão...</option>
                {caminhoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.placa ? `(${c.placa})` : ''}
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
              Descrição *
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}