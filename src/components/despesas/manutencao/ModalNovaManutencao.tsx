import { useState, useEffect, useMemo } from 'react';
import { X, Wrench, Check, AlertCircle } from 'lucide-react';
import {
  type Manutencao,
  type CategoriaManutencao,
  type ResponsavelPagamentoManutencao,
  CATEGORIAS_MANUTENCAO,
  RESPONSAVEIS_PAGAMENTO_MANUTENCAO,
  salvarManutencao,
} from '../../../storage/manutencoesStorage';
import {
  listarCaminhoes,
  listarMotoristas,
} from '../../../storage/cadastrosStorage';

interface ModalNovaManutencaoProps {
  aberto: boolean;
  manutencaoEdicao?: Manutencao | null;
  caminhaoInicialId?: string;
  onFechar: () => void;
  onSalvo: () => void;
}

function obterDataHoraAtualLocal(): string {
  const agora = new Date();
  const offsetMs = agora.getTimezoneOffset() * 60_000;
  return new Date(agora.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function ModalNovaManutencao({
  aberto,
  manutencaoEdicao,
  caminhaoInicialId,
  onFechar,
  onSalvo,
}: ModalNovaManutencaoProps) {
  const caminhoes = useMemo(() => listarCaminhoes(), [aberto]);
  const motoristas = useMemo(() => listarMotoristas(), [aberto]);

  const [dataHora, setDataHora] = useState('');
  const [caminhaoId, setCaminhaoId] = useState('');
  const [motoristaId, setMotoristaId] = useState('');
  const [categoria, setCategoria] = useState<CategoriaManutencao>('Mecânica');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [responsavelPagamento, setResponsavelPagamento] =
    useState<ResponsavelPagamentoManutencao>('minha_despesa');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!aberto) return;
    setErro('');

    if (manutencaoEdicao) {
      setDataHora(manutencaoEdicao.dataHora || obterDataHoraAtualLocal());
      setCaminhaoId(manutencaoEdicao.caminhaoId || '');
      setMotoristaId(manutencaoEdicao.motoristaId || '');
      setCategoria(manutencaoEdicao.categoria || 'Mecânica');
      setDescricao(manutencaoEdicao.descricao || '');
      setValor(
        manutencaoEdicao.valor !== undefined
          ? String(manutencaoEdicao.valor)
          : ''
      );
      setResponsavelPagamento(
        manutencaoEdicao.responsavelPagamento || 'minha_despesa'
      );
      return;
    }

    const caminhaoPadraoId = caminhaoInicialId || '';
    const caminhaoObj = caminhaoPadraoId
      ? caminhoes.find((c) => c.id === caminhaoPadraoId)
      : undefined;

    setDataHora(obterDataHoraAtualLocal());
    setCaminhaoId(caminhaoPadraoId);
    setMotoristaId(caminhaoObj?.motoristaId || '');
    setCategoria('Mecânica');
    setDescricao('');
    setValor('');
    setResponsavelPagamento('minha_despesa');
  }, [aberto, manutencaoEdicao, caminhaoInicialId, caminhoes]);

  useEffect(() => {
    if (!aberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const handleTrocarCaminhao = (novoId: string) => {
    setCaminhaoId(novoId);
    if (!novoId) {
      setMotoristaId('');
      return;
    }
    const encontrado = caminhoes.find((c) => c.id === novoId);
    setMotoristaId(encontrado?.motoristaId || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dataHora) {
      setErro('Informe a data e hora da manutenção.');
      return;
    }
    if (!caminhaoId) {
      setErro('Selecione um caminhão.');
      return;
    }
    if (!descricao.trim()) {
      setErro('Informe a descrição do serviço ou peça.');
      return;
    }

    const valorNumerico = Number(valor.trim().replace(',', '.'));
    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor válido maior que zero.');
      return;
    }

    salvarManutencao({
      id: manutencaoEdicao?.id,
      dataHora,
      caminhaoId,
      motoristaId: motoristaId || undefined,
      categoria,
      descricao: descricao.trim(),
      valor: Number(valorNumerico.toFixed(2)),
      responsavelPagamento,
      arquivada: manutencaoEdicao?.arquivada ?? false,
    });

    onSalvo();
    onFechar();
  };

  const caminhoesDisponiveis = caminhoes.filter(
    (c) => c.ativo || c.id === caminhaoId
  );
  const motoristasDisponiveis = motoristas.filter(
    (m) => m.ativo || m.id === motoristaId
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {manutencaoEdicao ? 'Editar Manutenção' : 'Nova Manutenção'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registre serviços, peças, lavagens ou reparos da frota
              </p>
            </div>
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Data e Hora *
              </label>
              <input
                type="datetime-local"
                required
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Categoria *
              </label>
              <select
                value={categoria}
                onChange={(e) =>
                  setCategoria(e.target.value as CategoriaManutencao)
                }
                className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {CATEGORIAS_MANUTENCAO.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Caminhão *
              </label>
              <select
                required
                value={caminhaoId}
                onChange={(e) => handleTrocarCaminhao(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Selecione um caminhão..</option>
                {caminhoesDisponiveis.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.placa})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Motorista
              </label>
              <select
                value={motoristaId}
                onChange={(e) => setMotoristaId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Sem motorista</option>
                {motoristasDisponiveis.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrição *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ex: Troca de 2 pneus dianteiros, alinhamento, conserto de lona de freio..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full p-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="any"
                min={0.01}
                required
                placeholder="Ex: 450.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Responsável pelo Pagamento *
              </label>
              <select
                value={responsavelPagamento}
                onChange={(e) =>
                  setResponsavelPagamento(
                    e.target.value as ResponsavelPagamentoManutencao
                  )
                }
                className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {RESPONSAVEIS_PAGAMENTO_MANUTENCAO.map((resp) => (
                  <option key={resp.valor} value={resp.valor}>
                    {resp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {manutencaoEdicao ? 'Salvar Alterações' : 'Salvar Manutenção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}