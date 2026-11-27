import { useState, useEffect, useMemo } from 'react';
import { Plus, Wrench, Filter, RotateCcw } from 'lucide-react';
import {
  type Manutencao,
  type CategoriaManutencao,
  type ResponsavelPagamentoManutencao,
  lerManutencoes,
  alternarArquivamentoManutencao,
  excluirManutencao,
} from '../../../storage/manutencoesStorage';
import {
  listarCaminhoes,
  listarMotoristas,
} from '../../../storage/cadastrosStorage';
import { despesaJaFoiPaga } from '../../../storage/recebimentosStorage';
import { Paginacao } from '../../Paginacao';
import { ModalNovaManutencao } from './ModalNovaManutencao';
import { ModalEditarJsonManutencao } from '../../json_editor/ModalEditarJsonManutencao';
import { CardManutencao } from './CardManutencao';

const ITENS_POR_PAGINA = 10;

const CATEGORIAS_OPCOES: CategoriaManutencao[] = [
  'Borracharia',
  'Elétrica',
  'Mecânica',
  'Lavagem',
  'Peça',
  'Outro',
];

type StatusFiltroManutencao = 'todos' | 'pendente' | 'pago';
type ResponsavelFiltroManutencao =
  | 'todos'
  | ResponsavelPagamentoManutencao;

function extrairDataIso(dataHora: string): string {
  if (!dataHora) return '';
  if (dataHora.includes('T')) return dataHora.split('T')[0] || '';
  if (dataHora.includes(' ')) return dataHora.split(' ')[0] || '';
  return dataHora.slice(0, 10);
}

export function TodasManutencoes() {
  const [modalAberto, setModalAberto] = useState(false);
  const [manutencaoEmEdicao, setManutencaoEmEdicao] =
    useState<Manutencao | null>(null);
  const [manutencaoJsonEmEdicao, setManutencaoJsonEmEdicao] =
    useState<Manutencao | null>(null);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados dos filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [filtroMotoristaId, setFiltroMotoristaId] = useState<string>('');
  const [filtroResponsavel, setFiltroResponsavel] =
    useState<ResponsavelFiltroManutencao>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroStatus, setFiltroStatus] =
    useState<StatusFiltroManutencao>('todos');

  const carregar = () => {
    const ativas = lerManutencoes()
      .filter((m) => !m.arquivada)
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setManutencoes(ativas);
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

  const { mapaCaminhoes, mapaMotoristas, listaMotoristasOpcoes } =
    useMemo(() => {
      const caminhoesMap = new Map<string, string>();
      for (const c of listarCaminhoes()) {
        caminhoesMap.set(
          String(c.id),
          `${c.nome}${c.placa ? ` (${c.placa})` : ''}`
        );
      }

      const motoristasMap = new Map<string, string>();
      const opcoesMotoristas: { id: string; nome: string }[] = [];
      for (const m of listarMotoristas()) {
        const idStr = String(m.id);
        motoristasMap.set(idStr, m.nome);
        opcoesMotoristas.push({ id: idStr, nome: m.nome });
      }

      return {
        mapaCaminhoes: caminhoesMap,
        mapaMotoristas: motoristasMap,
        listaMotoristasOpcoes: opcoesMotoristas,
      };
    }, [manutencoes]);

  const haFiltrosAtivos = Boolean(
    filtroDataInicio ||
      filtroDataFim ||
      filtroMotoristaId ||
      filtroResponsavel !== 'todos' ||
      filtroCategoria ||
      filtroStatus !== 'todos'
  );

  const limparFiltros = () => {
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroMotoristaId('');
    setFiltroResponsavel('todos');
    setFiltroCategoria('');
    setFiltroStatus('todos');
    setPaginaAtual(1);
  };

  const manutencoesFiltradas = useMemo(() => {
    return manutencoes.filter((m) => {
      const dataItem = extrairDataIso(m.dataHora);

      if (filtroDataInicio && (!dataItem || dataItem < filtroDataInicio)) {
        return false;
      }

      if (filtroDataFim && (!dataItem || dataItem > filtroDataFim)) {
        return false;
      }

      if (filtroMotoristaId) {
        if (filtroMotoristaId === 'sem_motorista') {
          if (m.motoristaId) return false;
        } else if (String(m.motoristaId || '') !== filtroMotoristaId) {
          return false;
        }
      }

      if (
        filtroResponsavel !== 'todos' &&
        m.responsavelPagamento !== filtroResponsavel
      ) {
        return false;
      }

      if (filtroCategoria && m.categoria !== filtroCategoria) {
        return false;
      }

      if (filtroStatus !== 'todos') {
        const paga = despesaJaFoiPaga(m.id);
        if (filtroStatus === 'pago' && !paga) return false;
        if (filtroStatus === 'pendente' && paga) return false;
      }

      return true;
    });
  }, [
    manutencoes,
    filtroDataInicio,
    filtroDataFim,
    filtroMotoristaId,
    filtroResponsavel,
    filtroCategoria,
    filtroStatus,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(manutencoesFiltradas.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const manutencoesPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return manutencoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [manutencoesFiltradas, paginaSegura]);

  const totalGeral = useMemo(
    () => manutencoesFiltradas.reduce((acc, m) => acc + m.valor, 0),
    [manutencoesFiltradas]
  );

  const abrirNova = () => {
    setManutencaoEmEdicao(null);
    setModalAberto(true);
  };

  const abrirEdicao = (m: Manutencao) => {
    setManutencaoEmEdicao(m);
    setModalAberto(true);
  };

  const handleArquivar = (m: Manutencao) => {
    alternarArquivamentoManutencao(m.id, true);
    carregar();
  };

  const handleExcluir = (m: Manutencao) => {
    excluirManutencao(m.id);
    carregar();
  };

  return (
    <div className="space-y-5">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Todas as Manutenções
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {haFiltrosAtivos
              ? `${manutencoesFiltradas.length} de ${manutencoes.length} manutenção(ões) • `
              : `${manutencoes.length} manutenção(ões) • `}
            Total acumulado:{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {totalGeral.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNova}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-brand-contrast text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Manutenção
        </button>
      </div>

      {/* Barra de Filtros */}
      {manutencoes.length > 0 && (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
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
                    e.target.value as ResponsavelFiltroManutencao
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

            {/* Categoria */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Categoria
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Todas as categorias</option>
                {CATEGORIAS_OPCOES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
                  setFiltroStatus(e.target.value as StatusFiltroManutencao);
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
      {manutencoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhuma manutenção registrada
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Clique em &ldquo;Nova Manutenção&rdquo; acima para registrar o primeiro serviço ou peça.
          </p>
        </div>
      ) : manutencoesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[28vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nenhuma manutenção corresponde aos filtros selecionados
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
          {manutencoesPaginadas.map((m) => (
            <CardManutencao
              key={m.id}
              manutencao={m}
              nomeCaminhao={
                mapaCaminhoes.get(String(m.caminhaoId)) ||
                `Caminhão #${m.caminhaoId}`
              }
              nomeMotorista={
                m.motoristaId
                  ? mapaMotoristas.get(String(m.motoristaId))
                  : undefined
              }
              onEditar={abrirEdicao}
              onEditarJson={(item) => setManutencaoJsonEmEdicao(item)}
              onArquivar={handleArquivar}
              onExcluir={handleExcluir}
            />
          ))}

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={manutencoesFiltradas.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      <ModalNovaManutencao
        aberto={modalAberto}
        manutencaoEdicao={manutencaoEmEdicao}
        onFechar={() => {
          setModalAberto(false);
          setManutencaoEmEdicao(null);
        }}
        onSalvo={() => {
          setPaginaAtual(1);
          carregar();
        }}
      />

      <ModalEditarJsonManutencao
        manutencao={manutencaoJsonEmEdicao}
        onFechar={() => setManutencaoJsonEmEdicao(null)}
        onSalvo={carregar}
      />
    </div>
  );
}
