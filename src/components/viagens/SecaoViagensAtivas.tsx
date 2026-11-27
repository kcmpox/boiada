import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Truck,
  Calendar,
  MapPin,
  User,
  Wallet,
  Route,
  FileText,
  Trash2,
  Factory,
  Code2,
  Pencil,
  CalendarCheck,
  DollarSign,
  Archive,
  Lock,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  listarViagens,
  salvarViagens,
  arquivarViagem,
  type Viagem,
} from '../../storage/viagensStorage';
import {
  listarCaminhoes,
  listarMotoristas,
  listarFrigorificos,
  listarIntermediarios,
} from '../../storage/cadastrosStorage';
import { viagemJaFoiPaga } from '../../storage/recebimentosStorage';
import { Paginacao } from '../Paginacao';
import { ModalNovaViagem } from './ModalNovaViagem';
import { ModalEditarValorBrutoViagem } from './ModalEditarValorBrutoViagem';
import { ModalEditarJsonViagem } from '../json_editor/ModalEditarJsonViagem';
import { useDevMode } from '../../context/DevModeContext';

const ITENS_POR_PAGINA = 10;

type StatusFiltroViagem = 'todos' | 'pendente' | 'paga';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarDataBr(isoDate: string): string {
  if (!isoDate) return '—';
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

function ordenarViagensMaisRecentes(lista: Viagem[]): Viagem[] {
  return [...lista].sort((a, b) => {
    const cmpData = (b.data || '').localeCompare(a.data || '');
    if (cmpData !== 0) return cmpData;
    return (b.dataCriacao || '').localeCompare(a.dataCriacao || '');
  });
}

export function SecaoViagensAtivas() {
  const { devMode } = useDevMode();
  const [viagens, setViagens] = useState<Viagem[]>(() =>
    ordenarViagensMaisRecentes(listarViagens())
  );
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalNovaAberta, setModalNovaAberta] = useState(false);
  const [viagemEmEdicao, setViagemEmEdicao] = useState<Viagem | null>(null);
  const [viagemValorBrutoEmEdicao, setViagemValorBrutoEmEdicao] =
    useState<Viagem | null>(null);
  const [viagemJsonEmEdicao, setViagemJsonEmEdicao] = useState<Viagem | null>(
    null
  );

  // Estados dos filtros (período de datas: de / até)
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [filtroCaminhaoId, setFiltroCaminhaoId] = useState<string>('');
  const [filtroMotoristaId, setFiltroMotoristaId] = useState<string>('');
  const [filtroPagadorChave, setFiltroPagadorChave] = useState<string>('');
  const [filtroFrigorificoId, setFiltroFrigorificoId] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltroViagem>('todos');

  useEffect(() => {
    const atualizar = () =>
      setViagens(ordenarViagensMaisRecentes(listarViagens()));
    window.addEventListener('storage', atualizar);
    window.addEventListener('bt-recebimentos-updated', atualizar);
    return () => {
      window.removeEventListener('storage', atualizar);
      window.removeEventListener('bt-recebimentos-updated', atualizar);
    };
  }, []);

  const caminhoes = useMemo(() => listarCaminhoes(), []);
  const motoristas = useMemo(() => listarMotoristas(), []);
  const frigorificos = useMemo(() => listarFrigorificos(), []);
  const intermediarios = useMemo(() => listarIntermediarios(), []);

  const pagadoresOpcoes = useMemo(() => {
    const opcoes: { chave: string; nome: string }[] = [];
    for (const f of frigorificos) {
      opcoes.push({
        chave: `frigorifico:${f.id}`,
        nome: `${f.nome} (Frigorífico)`,
      });
    }
    for (const i of intermediarios) {
      opcoes.push({
        chave: `intermediario:${i.id}`,
        nome: `${i.nome} (Intermediário)`,
      });
    }
    return opcoes;
  }, [frigorificos, intermediarios]);

  const haFiltrosAtivos = Boolean(
    filtroDataInicio ||
      filtroDataFim ||
      filtroCaminhaoId ||
      filtroMotoristaId ||
      filtroPagadorChave ||
      filtroFrigorificoId ||
      filtroStatus !== 'todos'
  );

  const limparFiltros = () => {
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroCaminhaoId('');
    setFiltroMotoristaId('');
    setFiltroPagadorChave('');
    setFiltroFrigorificoId('');
    setFiltroStatus('todos');
    setPaginaAtual(1);
  };

  const viagensFiltradas = useMemo(() => {
    return ordenarViagensMaisRecentes(viagens).filter((v) => {
      if (filtroDataInicio && (!v.data || v.data < filtroDataInicio)) {
        return false;
      }

      if (filtroDataFim && (!v.data || v.data > filtroDataFim)) {
        return false;
      }

      if (filtroCaminhaoId && String(v.caminhaoId) !== String(filtroCaminhaoId)) {
        return false;
      }

      if (
        filtroMotoristaId &&
        String(v.motoristaId) !== String(filtroMotoristaId)
      ) {
        return false;
      }

      if (filtroPagadorChave) {
        const sepIdx = filtroPagadorChave.indexOf(':');
        if (sepIdx !== -1) {
          const tipo = filtroPagadorChave.slice(0, sepIdx);
          const id = filtroPagadorChave.slice(sepIdx + 1);
          if (v.pagadorTipo !== tipo || String(v.pagadorId) !== String(id)) {
            return false;
          }
        }
      }

      if (
        filtroFrigorificoId &&
        String(v.frigorificoId) !== String(filtroFrigorificoId)
      ) {
        return false;
      }

      if (filtroStatus !== 'todos') {
        const paga = viagemJaFoiPaga(v.id);
        if (filtroStatus === 'paga' && !paga) return false;
        if (filtroStatus === 'pendente' && paga) return false;
      }

      return true;
    });
  }, [
    viagens,
    filtroDataInicio,
    filtroDataFim,
    filtroCaminhaoId,
    filtroMotoristaId,
    filtroPagadorChave,
    filtroFrigorificoId,
    filtroStatus,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(viagensFiltradas.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const viagensPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return viagensFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [viagensFiltradas, paginaSegura]);

  const handleAdicionarViagem = (nova: Viagem) => {
    const atualizada = ordenarViagensMaisRecentes([nova, ...viagens]);
    setViagens(atualizada);
    salvarViagens(atualizada);
    setPaginaAtual(1);
    setModalNovaAberta(false);
  };

  const handleSalvarEdicaoViagem = (editada: Viagem) => {
    if (viagemJaFoiPaga(editada.id)) {
      setViagemEmEdicao(null);
      setViagemValorBrutoEmEdicao(null);
      setViagemJsonEmEdicao(null);
      return;
    }

    const atualizada = ordenarViagensMaisRecentes(
      viagens.map((v) => (v.id === editada.id ? editada : v))
    );
    setViagens(atualizada);
    salvarViagens(atualizada);
    setViagemEmEdicao(null);
    setViagemValorBrutoEmEdicao(null);
    setViagemJsonEmEdicao(null);
  };

  const handleArquivar = (id: string) => {
    if (viagemJaFoiPaga(id)) return;
    const restantes = ordenarViagensMaisRecentes(arquivarViagem(id));
    setViagens(restantes);
  };

  const excluirViagem = (id: string) => {
    if (viagemJaFoiPaga(id)) return;
    const atualizada = ordenarViagensMaisRecentes(
      viagens.filter((v) => v.id !== id)
    );
    setViagens(atualizada);
    salvarViagens(atualizada);
  };

  const obterCaminhao = (id: string) =>
    caminhoes.find((c) => c.id === id);

  const obterNomeMotorista = (id: string) =>
    motoristas.find((m) => m.id === id)?.nome || 'Sem motorista';

  const obterNomeFrigorifico = (id: string) =>
    frigorificos.find((f) => f.id === id)?.nome || '';

  const obterNomePagador = (v: Viagem) => {
    if (v.pagadorTipo === 'frigorifico') {
      return (
        frigorificos.find((f) => f.id === v.pagadorId)?.nome ||
        'Frigorífico removido'
      );
    }
    return (
      intermediarios.find((i) => i.id === v.pagadorId)?.nome ||
      'Intermediário removido'
    );
  };

  return (
    <div className="space-y-5">
      {/* Barra Superior com Botão Nova Viagem */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {viagens.length === 0
            ? 'Nenhuma viagem registrada.'
            : haFiltrosAtivos
              ? `${viagensFiltradas.length} de ${viagens.length} ${
                  viagens.length === 1
                    ? 'viagem exibida'
                    : 'viagens exibidas'
                }`
              : `${viagens.length} ${
                  viagens.length === 1
                    ? 'viagem registrada'
                    : 'viagens registradas'
                }`}
        </div>

        <button
          type="button"
          onClick={() => setModalNovaAberta(true)}
          className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Viagem
        </button>
      </div>

      {/* Barra de Filtros */}
      {viagens.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5 text-brand-500" />
              Filtros
            </span>

            {haFiltrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Período: Data Inicial */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Data (De)
              </label>
              <input
                type="date"
                value={filtroDataInicio}
                max={filtroDataFim || undefined}
                onChange={(e) => {
                  setFiltroDataInicio(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Período: Data Final */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Data (Até)
              </label>
              <input
                type="date"
                value={filtroDataFim}
                min={filtroDataInicio || undefined}
                onChange={(e) => {
                  setFiltroDataFim(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Caminhão */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Caminhão
              </label>
              <select
                value={filtroCaminhaoId}
                onChange={(e) => {
                  setFiltroCaminhaoId(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Todos os caminhões</option>
                {caminhoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.placa ? `(${c.placa})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Motorista */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Motorista
              </label>
              <select
                value={filtroMotoristaId}
                onChange={(e) => {
                  setFiltroMotoristaId(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Todos os motoristas</option>
                {motoristas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Pagador */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Pagador
              </label>
              <select
                value={filtroPagadorChave}
                onChange={(e) => {
                  setFiltroPagadorChave(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Todos os pagadores</option>
                {pagadoresOpcoes.map((p) => (
                  <option key={p.chave} value={p.chave}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Frigorífico */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Frigorífico
              </label>
              <select
                value={filtroFrigorificoId}
                onChange={(e) => {
                  setFiltroFrigorificoId(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Todos os frigoríficos</option>
                {frigorificos.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value as StatusFiltroViagem);
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="paga">Paga</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Listagem dos Cards de Viagens */}
      {viagens.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Truck className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nenhuma viagem cadastrada ainda
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Clique em <strong>Nova Viagem</strong> acima para lançar o transporte e calcular automaticamente o frete.
          </p>
        </div>
      ) : viagensFiltradas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nenhuma viagem corresponde aos filtros selecionados
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {viagensPaginadas.map((v) => {
              const caminhao = obterCaminhao(v.caminhaoId);
              const frigResponsavel = obterNomeFrigorifico(v.frigorificoId);
              const bloqueadoPorPagamento = viagemJaFoiPaga(v.id);
              const liquido =
                v.valorLiquidoViagem !== undefined
                  ? v.valorLiquidoViagem
                  : v.valorViagem - v.valorAluguelCarreta;

              return (
                <div
                  key={v.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4"
                >
                  {/* Linha Superior: Badges + Data + Rota + Ações */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                            v.tipoGado === 'boi_gordo'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300'
                          }`}
                        >
                          {v.tipoGado === 'boi_gordo' ? 'Boi Gordo' : 'Boi Magro'}
                        </span>

                        {bloqueadoPorPagamento && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
                            title="Esta viagem já foi incluída num recebimento e não pode ser alterada"
                          >
                            <Lock className="w-3 h-3" />
                            Paga
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatarDataBr(v.data)}
                        </span>

                        <span className="text-xs text-slate-300 dark:text-slate-700">
                          •
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <Truck className="w-3.5 h-3.5 text-brand-500" />
                          {caminhao
                            ? `${caminhao.nome} (${caminhao.placa})`
                            : 'Caminhão removido'}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <User className="w-3.5 h-3.5" />
                          {obterNomeMotorista(v.motoristaId)}
                        </span>
                      </div>

                      {/* Embarque -> Desembarque */}
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white pt-0.5">
                        <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                        <span>{v.localEmbarque}</span>
                        {v.localDesembarque && (
                          <>
                            <span className="text-slate-400">→</span>
                            <span>{v.localDesembarque}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    {!bloqueadoPorPagamento && (
                      <div className="flex items-center gap-1 ml-auto">
                        {v.tipoGado === 'boi_magro' && (
                          <button
                            type="button"
                            onClick={() => setViagemValorBrutoEmEdicao(v)}
                            title="Editar valor bruto (Boi Magro)"
                            aria-label="Editar valor bruto"
                            className="p-2 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}

                        {devMode && (
                          <button
                            type="button"
                            onClick={() => setViagemJsonEmEdicao(v)}
                            title="Editar JSON (DevMode)"
                            className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
                          >
                            <Code2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setViagemEmEdicao(v)}
                          title="Editar viagem"
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleArquivar(v.id)}
                          title="Arquivar viagem"
                          aria-label="Arquivar viagem"
                          className="p-2 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                          <Archive className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirViagem(v.id)}
                          title="Excluir viagem"
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bloco Financeiro do Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        Valor Bruto
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {formatarMoeda(v.valorViagem)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        Aluguel Carreta ({v.percentualAluguelCarreta}%)
                      </div>
                      <div className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                        {v.valorAluguelCarreta > 0
                          ? `- ${formatarMoeda(v.valorAluguelCarreta)}`
                          : formatarMoeda(0)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        Valor Líquido
                      </div>
                      <div className="text-sm font-mono font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                        {formatarMoeda(liquido)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3 text-emerald-500" />
                        Prev. Recebimento
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {v.dataPrevistaRecebimento
                          ? formatarDataBr(v.dataPrevistaRecebimento)
                          : 'Não definida'}
                      </div>
                    </div>
                  </div>

                  {/* Linha Inferior: Pagador, KM, Frigorífico e Documentos */}
                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Wallet className="w-3.5 h-3.5 text-brand-500" />
                        Pagador: <strong>{obterNomePagador(v)}</strong>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <Route className="w-3.5 h-3.5 text-slate-400" />
                        {v.kmInformado} km (
                        {v.baseKmInformada === 'ida_volta'
                          ? 'Ida e Volta'
                          : 'Só Ida'}
                        )
                      </span>

                      {frigResponsavel && (
                        <span className="inline-flex items-center gap-1.5">
                          <Factory className="w-3.5 h-3.5 text-slate-400" />
                          Frig.: {frigResponsavel}
                        </span>
                      )}

                      {v.pecuarista && <span>Pecuarista: {v.pecuarista}</span>}
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      {v.cte && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <FileText className="w-3 h-3" />
                          CTe: {v.cte}
                        </span>
                      )}
                      {v.minuta && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <FileText className="w-3 h-3" />
                          Minuta: {v.minuta}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={viagensFiltradas.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      {/* Popup Nova Viagem */}
      {modalNovaAberta && (
        <ModalNovaViagem
          onSalvar={handleAdicionarViagem}
          onFechar={() => setModalNovaAberta(false)}
        />
      )}

      {/* Popup Editar Viagem Completa */}
      {viagemEmEdicao && (
        <ModalNovaViagem
          viagemParaEditar={viagemEmEdicao}
          onSalvar={handleSalvarEdicaoViagem}
          onFechar={() => setViagemEmEdicao(null)}
        />
      )}

      {/* Popup Editar Valor Bruto (Boi Magro) */}
      {viagemValorBrutoEmEdicao && (
        <ModalEditarValorBrutoViagem
          viagem={viagemValorBrutoEmEdicao}
          onSalvar={handleSalvarEdicaoViagem}
          onFechar={() => setViagemValorBrutoEmEdicao(null)}
        />
      )}

      {/* Popup JSON DevMode */}
      <ModalEditarJsonViagem
        viagem={viagemJsonEmEdicao}
        onSalvar={handleSalvarEdicaoViagem}
        onFechar={() => setViagemJsonEmEdicao(null)}
      />
    </div>
  );
}