import { useState, useEffect, useMemo } from 'react';
import { Plus, Milestone, Filter, RotateCcw } from 'lucide-react';
import {
  type DespesaPedagio,
  type ResponsavelPagamentoPedagio,
  lerDespesasPedagios,
  alternarArquivamentoDespesaPedagio,
  excluirDespesaPedagio,
} from '../../../storage/despesasPedagiosStorage';
import {
  listarCaminhoes,
  listarMotoristas,
} from '../../../storage/cadastrosStorage';
import { despesaJaFoiPaga } from '../../../storage/recebimentosStorage';
import { Paginacao } from '../../Paginacao';
import { ModalNovoPedagio } from './ModalNovoPedagio';
import { ModalEditarJsonDespesaPedagio } from '../../json_editor/ModalEditarJsonDespesaPedagio';
import { CardDespesaPedagio } from './CardDespesaPedagio';

const ITENS_POR_PAGINA = 10;

type StatusFiltroPedagio = 'todos' | 'pendente' | 'pago';
type ResponsavelFiltroPedagio = 'todos' | ResponsavelPagamentoPedagio;

function extrairDataIso(dataHora: string): string {
  if (!dataHora) return '';
  if (dataHora.includes('T')) return dataHora.split('T')[0] || '';
  if (dataHora.includes(' ')) return dataHora.split(' ')[0] || '';
  return dataHora.slice(0, 10);
}

export function TodosPedagios() {
  const [modalAberto, setModalAberto] = useState(false);
  const [passagemEmEdicao, setPassagemEmEdicao] =
    useState<DespesaPedagio | null>(null);
  const [passagemJsonEmEdicao, setPassagemJsonEmEdicao] =
    useState<DespesaPedagio | null>(null);
  const [passagens, setPassagens] = useState<DespesaPedagio[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados dos filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [filtroResponsavel, setFiltroResponsavel] =
    useState<ResponsavelFiltroPedagio>('todos');
  const [filtroStatus, setFiltroStatus] =
    useState<StatusFiltroPedagio>('todos');

  const carregar = () => {
    const ativas = lerDespesasPedagios()
      .filter((p) => !p.arquivado)
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setPassagens(ativas);
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

  const { mapaCaminhoes, mapaMotoristas } = useMemo(() => {
    const caminhoesMap = new Map<string, string>();
    for (const c of listarCaminhoes()) {
      caminhoesMap.set(
        String(c.id),
        `${c.nome}${c.placa ? ` (${c.placa})` : ''}`
      );
    }

    const motoristasMap = new Map<string, string>();
    for (const m of listarMotoristas()) {
      motoristasMap.set(String(m.id), m.nome);
    }

    return { mapaCaminhoes: caminhoesMap, mapaMotoristas: motoristasMap };
  }, [passagens]);

  const haFiltrosAtivos = Boolean(
    filtroDataInicio ||
      filtroDataFim ||
      filtroResponsavel !== 'todos' ||
      filtroStatus !== 'todos'
  );

  const limparFiltros = () => {
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroResponsavel('todos');
    setFiltroStatus('todos');
    setPaginaAtual(1);
  };

  const passagensFiltradas = useMemo(() => {
    return passagens.filter((p) => {
      const dataItem = extrairDataIso(p.dataHora);

      if (filtroDataInicio && (!dataItem || dataItem < filtroDataInicio)) {
        return false;
      }

      if (filtroDataFim && (!dataItem || dataItem > filtroDataFim)) {
        return false;
      }

      if (
        filtroResponsavel !== 'todos' &&
        p.responsavelPagamento !== filtroResponsavel
      ) {
        return false;
      }

      if (filtroStatus !== 'todos') {
        const paga = despesaJaFoiPaga(p.id);
        if (filtroStatus === 'pago' && !paga) return false;
        if (filtroStatus === 'pendente' && paga) return false;
      }

      return true;
    });
  }, [passagens, filtroDataInicio, filtroDataFim, filtroResponsavel, filtroStatus]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(passagensFiltradas.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const passagensPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return passagensFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [passagensFiltradas, paginaSegura]);

  const totalGeral = useMemo(
    () => passagensFiltradas.reduce((acc, p) => acc + p.valor, 0),
    [passagensFiltradas]
  );

  const abrirNova = () => {
    setPassagemEmEdicao(null);
    setModalAberto(true);
  };

  const abrirEdicao = (p: DespesaPedagio) => {
    setPassagemEmEdicao(p);
    setModalAberto(true);
  };

  const handleArquivar = (p: DespesaPedagio) => {
    alternarArquivamentoDespesaPedagio(p.id, true);
    carregar();
  };

  const handleExcluir = (p: DespesaPedagio) => {
    excluirDespesaPedagio(p.id);
    carregar();
  };

  return (
    <div className="space-y-5">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Todos os Pedágios
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {haFiltrosAtivos
              ? `${passagensFiltradas.length} de ${passagens.length} passagem(ns) • `
              : `${passagens.length} passagem(ns) • `}
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
          Nova Passagem
        </button>
      </div>

      {/* Barra de Filtros */}
      {passagens.length > 0 && (
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

            {/* Responsável pelo Pagamento */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Responsável pelo Pagamento
              </label>
              <select
                value={filtroResponsavel}
                onChange={(e) => {
                  setFiltroResponsavel(
                    e.target.value as ResponsavelFiltroPedagio
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
                  setFiltroStatus(e.target.value as StatusFiltroPedagio);
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
      {passagens.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Milestone className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhuma passagem de pedágio registrada
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Clique em &ldquo;Nova Passagem&rdquo; acima para lançar a primeira cobrança de pedágio.
          </p>
        </div>
      ) : passagensFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[28vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nenhuma passagem de pedágio corresponde aos filtros selecionados
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
          {passagensPaginadas.map((p) => (
            <CardDespesaPedagio
              key={p.id}
              passagem={p}
              nomeCaminhao={
                p.caminhaoId
                  ? mapaCaminhoes.get(String(p.caminhaoId)) ||
                    `Caminhão #${p.caminhaoId}`
                  : undefined
              }
              nomeMotorista={
                p.motoristaId
                  ? mapaMotoristas.get(String(p.motoristaId))
                  : undefined
              }
              onEditar={abrirEdicao}
              onEditarJson={(item) => setPassagemJsonEmEdicao(item)}
              onArquivar={handleArquivar}
              onExcluir={handleExcluir}
            />
          ))}

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={passagensFiltradas.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      <ModalNovoPedagio
        aberto={modalAberto}
        passagemEdicao={passagemEmEdicao}
        onFechar={() => {
          setModalAberto(false);
          setPassagemEmEdicao(null);
        }}
        onSalvo={() => {
          setPaginaAtual(1);
          carregar();
        }}
      />

      <ModalEditarJsonDespesaPedagio
        passagem={passagemJsonEmEdicao}
        onFechar={() => setPassagemJsonEmEdicao(null)}
        onSalvo={carregar}
      />
    </div>
  );
}