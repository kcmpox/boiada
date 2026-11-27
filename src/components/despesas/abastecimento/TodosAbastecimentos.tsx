import { useState, useEffect, useMemo } from 'react';
import { Plus, Fuel, Filter, RotateCcw } from 'lucide-react';
import {
  type Abastecimento,
  type ResponsavelPagamentoAbastecimento,
  lerAbastecimentos,
  alternarArquivamentoAbastecimento,
  excluirAbastecimentosPorIds,
} from '../../../storage/abastecimentosStorage';
import * as cadastrosStorage from '../../../storage/cadastrosStorage';
import * as viagensStorage from '../../../storage/viagensStorage';
import { despesaJaFoiPaga } from '../../../storage/recebimentosStorage';
import { Paginacao } from '../../Paginacao';
import { ModalNovoAbastecimento } from './ModalNovoAbastecimento';
import { ModalEditarJsonAbastecimento } from '../../json_editor/ModalEditarJsonAbastecimento';
import {
  CardAbastecimento,
  agruparAbastecimentosPorResponsavel,
} from './CardAbastecimento';

const ITENS_POR_PAGINA = 10;

type StatusFiltroAbastecimento = 'todos' | 'pendente' | 'pago';
type ResponsavelFiltroAbastecimento =
  | 'todos'
  | ResponsavelPagamentoAbastecimento;

function extrairColecao(
  modulo: Record<string, unknown>,
  chaves: string[],
  validador: (x: unknown) => boolean
): unknown[] {
  for (const fn of Object.values(modulo)) {
    if (typeof fn === 'function' && fn.length === 0) {
      try {
        const res = fn();
        if (Array.isArray(res) && res.length > 0 && validador(res[0])) return res;
        if (res && typeof res === 'object') {
          for (const k of chaves) {
            const lista = (res as Record<string, unknown>)[k];
            if (Array.isArray(lista)) return lista;
          }
        }
      } catch {
        // Ignora
      }
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '');
      if (Array.isArray(parsed) && parsed.length > 0 && validador(parsed[0])) {
        return parsed;
      }
      if (parsed && typeof parsed === 'object') {
        for (const k of chaves) {
          const lista = (parsed as Record<string, unknown>)[k];
          if (Array.isArray(lista)) return lista;
        }
      }
    } catch {
      // Ignora
    }
  }

  return [];
}

function extrairDataIso(dataHora: string): string {
  if (!dataHora) return '';
  if (dataHora.includes('T')) return dataHora.split('T')[0] || '';
  if (dataHora.includes(' ')) return dataHora.split(' ')[0] || '';
  return dataHora.slice(0, 10);
}

function abastecimentoEstaPago(ab: Abastecimento): boolean {
  if (despesaJaFoiPaga(ab.id)) return true;
  return (ab.itens || []).some(
    (it) => despesaJaFoiPaga(`${ab.id}::${it.id}`) || despesaJaFoiPaga(it.id)
  );
}

export function TodosAbastecimentos() {
  const [modalAberto, setModalAberto] = useState(false);
  const [abastecimentoEmEdicao, setAbastecimentoEmEdicao] =
    useState<Abastecimento | null>(null);
  const [abastecimentoJsonEmEdicao, setAbastecimentoJsonEmEdicao] =
    useState<Abastecimento | null>(null);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados dos filtros (período de datas: de / até)
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [filtroMotoristaId, setFiltroMotoristaId] = useState<string>('');
  const [filtroResponsavel, setFiltroResponsavel] =
    useState<ResponsavelFiltroAbastecimento>('todos');
  const [filtroStatus, setFiltroStatus] =
    useState<StatusFiltroAbastecimento>('todos');

  const carregar = () => {
    const ativos = lerAbastecimentos()
      .filter((a) => !a.arquivado)
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setAbastecimentos(ativos);
  };

  useEffect(() => {
    carregar();
    window.addEventListener('storage', carregar);
    window.addEventListener('bt-recebimentos-updated', carregar);
    return () => {
      window.removeEventListener('storage', carregar);
      window.removeEventListener('bt-recebimentos-updated', carregar);
    };
  }, []);

  const { mapaCaminhoes, mapaMotoristas, listaMotoristasOpcoes, mapaViagens } =
    useMemo(() => {
      const caminhoesMap = new Map<string, string>();
      const motoristasMap = new Map<string, string>();
      const viagensMap = new Map<string, string>();

      const listaCaminhoes = extrairColecao(
        cadastrosStorage as Record<string, unknown>,
        ['caminhoes'],
        (x) => typeof x === 'object' && x !== null && 'placa' in x
      );
      for (const item of listaCaminhoes) {
        const c = item as {
          id: string | number;
          nome?: string;
          apelido?: string;
          placa?: string;
        };
        const nome = c.nome || c.apelido || 'Caminhão';
        caminhoesMap.set(
          String(c.id),
          `${nome}${c.placa ? ` (${c.placa})` : ''}`
        );
      }

      const listaMotoristas = extrairColecao(
        cadastrosStorage as Record<string, unknown>,
        ['motoristas'],
        (x) =>
          typeof x === 'object' &&
          x !== null &&
          'nome' in x &&
          !('placa' in x) &&
          !('rodovia' in x) &&
          !('uf' in x)
      );
      const opcoesMotoristas: { id: string; nome: string }[] = [];
      for (const item of listaMotoristas) {
        const m = item as { id: string | number; nome: string };
        const idStr = String(m.id);
        motoristasMap.set(idStr, m.nome);
        opcoesMotoristas.push({ id: idStr, nome: m.nome });
      }

      const listaViagens = extrairColecao(
        viagensStorage as Record<string, unknown>,
        ['viagens'],
        (x) =>
          typeof x === 'object' &&
          x !== null &&
          'id' in x &&
          ('localEmbarque' in x || 'embarque' in x || 'tipoGado' in x)
      );
      for (const item of listaViagens) {
        const v = item as {
          id: string | number;
          data?: string;
          localEmbarque?: string;
          embarque?: string;
          pecuarista?: string;
          minuta?: string;
          numeroMinuta?: string;
        };
        const dataFmt = v.data
          ? new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')
          : '';
        const local = (v.localEmbarque || v.embarque || '').trim();
        const pecuarista = (v.pecuarista || '').trim();
        const minuta = (v.minuta || v.numeroMinuta || '').trim();
        const rotulo = [
          dataFmt,
          [local, pecuarista].filter(Boolean).join(' '),
          minuta ? `Minuta ${minuta}` : null,
        ]
          .filter(Boolean)
          .join(' - ');

        if (rotulo) viagensMap.set(String(v.id), rotulo);
      }

      return {
        mapaCaminhoes: caminhoesMap,
        mapaMotoristas: motoristasMap,
        listaMotoristasOpcoes: opcoesMotoristas,
        mapaViagens: viagensMap,
      };
    }, [abastecimentos]);

  const haFiltrosAtivos = Boolean(
    filtroDataInicio ||
      filtroDataFim ||
      filtroMotoristaId ||
      filtroResponsavel !== 'todos' ||
      filtroStatus !== 'todos'
  );

  const limparFiltros = () => {
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroMotoristaId('');
    setFiltroResponsavel('todos');
    setFiltroStatus('todos');
    setPaginaAtual(1);
  };

  const abastecimentosFiltrados = useMemo(() => {
    return abastecimentos.filter((ab) => {
      const dataItem = extrairDataIso(ab.dataHora);

      if (filtroDataInicio && (!dataItem || dataItem < filtroDataInicio)) {
        return false;
      }

      if (filtroDataFim && (!dataItem || dataItem > filtroDataFim)) {
        return false;
      }

      if (filtroMotoristaId) {
        if (filtroMotoristaId === 'sem_motorista') {
          if (ab.motoristaId) return false;
        } else if (String(ab.motoristaId || '') !== filtroMotoristaId) {
          return false;
        }
      }

      if (filtroStatus !== 'todos') {
        const pago = abastecimentoEstaPago(ab);
        if (filtroStatus === 'pago' && !pago) return false;
        if (filtroStatus === 'pendente' && pago) return false;
      }

      return true;
    });
  }, [
    abastecimentos,
    filtroDataInicio,
    filtroDataFim,
    filtroMotoristaId,
    filtroStatus,
  ]);

  const gruposCards = useMemo(() => {
    const agrupados = agruparAbastecimentosPorResponsavel(
      abastecimentosFiltrados
    );
    if (filtroResponsavel === 'todos') return agrupados;
    return agrupados.filter((g) => g.responsavelEfetivo === filtroResponsavel);
  }, [abastecimentosFiltrados, filtroResponsavel]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(gruposCards.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const gruposPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return gruposCards.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [gruposCards, paginaSegura]);

  const abrirNovo = () => {
    setAbastecimentoEmEdicao(null);
    setModalAberto(true);
  };

  const abrirEdicao = (ab: Abastecimento) => {
    setAbastecimentoEmEdicao(ab);
    setModalAberto(true);
  };

  const handleArquivar = (ab: Abastecimento) => {
    alternarArquivamentoAbastecimento(ab.id, true);
    carregar();
  };

  const handleExcluir = (ids: string[]) => {
    excluirAbastecimentosPorIds(ids);
    carregar();
  };

  return (
    <div className="space-y-5">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Todos os Abastecimentos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {haFiltrosAtivos
              ? `${abastecimentosFiltrados.length} de ${abastecimentos.length} abastecimento(s) • ${gruposCards.length} lançamento(s) exibido(s)`
              : `${abastecimentos.length} abastecimento(s) • ${gruposCards.length} lançamento(s) por responsável`}
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNovo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Abastecimento
        </button>
      </div>

      {/* Barra de Filtros */}
      {abastecimentos.length > 0 && (
        <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                {listaMotoristasOpcoes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
                <option value="sem_motorista">Sem motorista</option>
              </select>
            </div>

            {/* Responsável pelo Pagamento */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Responsável pelo Pagamento
              </label>
              <select
                value={filtroResponsavel}
                onChange={(e) => {
                  setFiltroResponsavel(
                    e.target.value as ResponsavelFiltroAbastecimento
                  );
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="todos">Todos os responsáveis</option>
                <option value="minha_despesa">Minha despesa</option>
                <option value="frigorifico_desconta">
                  Frigorífico desconta
                </option>
                <option value="frigorifico_ressarce">
                  Frigorífico ressarce
                </option>
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
                  setFiltroStatus(e.target.value as StatusFiltroAbastecimento);
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista de cards ou estado vazio */}
      {abastecimentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Fuel className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum abastecimento registrado
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Clique em &ldquo;Novo Abastecimento&rdquo; acima para lançar a primeira nota de combustível.
          </p>
        </div>
      ) : gruposCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[28vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nenhum abastecimento corresponde aos filtros selecionados
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
        <div className="space-y-3.5">
          {gruposPaginados.map((grupo) => {
            const ab = grupo.abastecimento;
            return (
              <CardAbastecimento
                key={grupo.chave}
                grupo={grupo}
                nomeCaminhao={
                  mapaCaminhoes.get(String(ab.caminhaoId)) ||
                  `Caminhão #${ab.caminhaoId}`
                }
                nomeMotorista={
                  ab.motoristaId
                    ? mapaMotoristas.get(String(ab.motoristaId))
                    : undefined
                }
                rotuloViagem={
                  ab.viagemId ? mapaViagens.get(String(ab.viagemId)) : undefined
                }
                onEditar={abrirEdicao}
                onEditarJson={(item) => setAbastecimentoJsonEmEdicao(item)}
                onArquivar={handleArquivar}
                onExcluir={() => handleExcluir([ab.id])}
              />
            );
          })}

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={gruposCards.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      <ModalNovoAbastecimento
        aberto={modalAberto}
        abastecimentoEdicao={abastecimentoEmEdicao}
        onFechar={() => {
          setModalAberto(false);
          setAbastecimentoEmEdicao(null);
        }}
        onSalvo={() => {
          setPaginaAtual(1);
          carregar();
        }}
      />

      <ModalEditarJsonAbastecimento
        abastecimento={abastecimentoJsonEmEdicao}
        onFechar={() => setAbastecimentoJsonEmEdicao(null)}
        onSalvo={carregar}
      />
    </div>
  );
}