import { useState, useEffect, useMemo } from 'react';
import { Plus, TrendingDown, Archive, Filter, RotateCcw } from 'lucide-react';
import {
  lerDadosWallet,
  alternarArquivamentoDescontoWallet,
  excluirDescontoWallet,
  type DescontoWallet,
} from '../../storage/walletStorage';
import {
  listarFrigorificos,
  listarIntermediarios,
  listarCaminhoes,
} from '../../storage/cadastrosStorage';
import { Paginacao } from '../Paginacao';
import { ModalNovoDesconto } from './descontos/ModalNovoDesconto';
import { ModalEditarLancamentoWallet } from './ModalEditarLancamentoWallet';
import { ModalEditarJsonWalletItem } from '../json_editor/ModalEditarJsonWalletItem';
import { CardLancamentoWallet } from './CardLancamentoWallet';

const ITENS_POR_PAGINA = 10;

const CATEGORIAS_WALLET_OPCOES = [
  { value: 'abastecimento', label: 'Abastecimento' },
  { value: 'animais_perdidos', label: 'Animais Perdidos' },
  { value: 'pedagio', label: 'Pedágio' },
  { value: 'frete', label: 'Frete' },
  { value: 'outro', label: 'Outro' },
];

export function SecaoDescontosWallet() {
  const [aba, setAba] = useState<'ativos' | 'arquivados'>('ativos');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [descontoEdicao, setDescontoEdicao] = useState<DescontoWallet | null>(
    null
  );
  const [descontoJsonEdicao, setDescontoJsonEdicao] =
    useState<DescontoWallet | null>(null);
  const [todosDescontos, setTodosDescontos] = useState<DescontoWallet[]>(
    () => lerDadosWallet().descontos
  );
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [filtroPagadorChave, setFiltroPagadorChave] = useState<string>('');
  const [filtroCaminhaoId, setFiltroCaminhaoId] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');

  const carregar = () => {
    setTodosDescontos(lerDadosWallet().descontos);
  };

  useEffect(() => {
    carregar();
    window.addEventListener('storage', carregar);
    window.addEventListener('bt-wallet-updated', carregar);
    return () => {
      window.removeEventListener('storage', carregar);
      window.removeEventListener('bt-wallet-updated', carregar);
    };
  }, []);

  const {
    mapaPagadores,
    opcoesPagadores,
    mapaCaminhoes,
    opcoesCaminhoes,
  } = useMemo(() => {
    const pMap = new Map<string, string>();
    const pOpcoes: { chave: string; nome: string }[] = [];

    for (const f of listarFrigorificos()) {
      const chave = `frigorifico:${f.id}`;
      const label = `${f.nome} (Frigorífico)`;
      pMap.set(chave, f.nome);
      pOpcoes.push({ chave, nome: label });
    }
    for (const i of listarIntermediarios()) {
      const chave = `intermediario:${i.id}`;
      const label = `${i.nome} (Intermediário)`;
      pMap.set(chave, i.nome);
      pOpcoes.push({ chave, nome: label });
    }

    const cMap = new Map<string, string>();
    const cOpcoes: { id: string; nome: string }[] = [];
    for (const c of listarCaminhoes()) {
      const idStr = String(c.id);
      const label = `${c.nome}${c.placa ? ` (${c.placa})` : ''}`;
      cMap.set(idStr, label);
      cOpcoes.push({ id: idStr, nome: label });
    }

    return {
      mapaPagadores: pMap,
      opcoesPagadores: pOpcoes,
      mapaCaminhoes: cMap,
      opcoesCaminhoes: cOpcoes,
    };
  }, [todosDescontos]);

  const haFiltrosAtivos = Boolean(
    filtroDataInicio ||
      filtroDataFim ||
      filtroPagadorChave ||
      filtroCaminhaoId ||
      filtroCategoria
  );

  const limparFiltros = () => {
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroPagadorChave('');
    setFiltroCaminhaoId('');
    setFiltroCategoria('');
    setPaginaAtual(1);
  };

  const descontosDaAba = useMemo(() => {
    return todosDescontos.filter((d) =>
      aba === 'arquivados' ? Boolean(d.arquivado) : !d.arquivado
    );
  }, [todosDescontos, aba]);

  const descontosFiltrados = useMemo(() => {
    return descontosDaAba
      .filter((d) => {
        const dataItem = (d.data || '').slice(0, 10);

        if (filtroDataInicio && (!dataItem || dataItem < filtroDataInicio)) {
          return false;
        }

        if (filtroDataFim && (!dataItem || dataItem > filtroDataFim)) {
          return false;
        }

        if (filtroPagadorChave) {
          const chaveItem = `${d.pagadorTipo}:${d.pagadorId}`;
          if (chaveItem !== filtroPagadorChave) {
            return false;
          }
        }

        if (filtroCaminhaoId && String(d.caminhaoId) !== filtroCaminhaoId) {
          return false;
        }

        if (filtroCategoria) {
          const catItem = d.tipo || 'outro';
          if (catItem !== filtroCategoria) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [
    descontosDaAba,
    filtroDataInicio,
    filtroDataFim,
    filtroPagadorChave,
    filtroCaminhaoId,
    filtroCategoria,
  ]);

  const qtdArquivados = useMemo(
    () => todosDescontos.filter((d) => Boolean(d.arquivado)).length,
    [todosDescontos]
  );

  const totalAcumulado = useMemo(
    () => descontosFiltrados.reduce((acc, d) => acc + d.valor, 0),
    [descontosFiltrados]
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(descontosFiltrados.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const itensPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return descontosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [descontosFiltrados, paginaSegura]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Descontos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {haFiltrosAtivos
              ? `${descontosFiltrados.length} de ${descontosDaAba.length} registro(s) • `
              : `${descontosFiltrados.length} registro(s) • `}
            Total:{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {totalAcumulado.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => {
                setAba('ativos');
                setPaginaAtual(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                aba === 'ativos'
                  ? 'bg-brand-500 text-brand-contrast'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => {
                setAba('arquivados');
                setPaginaAtual(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                aba === 'arquivados'
                  ? 'bg-brand-500 text-brand-contrast'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              Arquivados ({qtdArquivados})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setModalNovoAberto(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-brand-contrast text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Desconto
          </button>
        </div>
      </div>

      {descontosDaAba.length > 0 && (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
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
                {opcoesPagadores.map((p) => (
                  <option key={p.chave} value={p.chave}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

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
                {opcoesCaminhoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

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
                {CATEGORIAS_WALLET_OPCOES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {descontosDaAba.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            {aba === 'arquivados' ? (
              <Archive className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {aba === 'arquivados'
              ? 'Nenhum desconto arquivado'
              : 'Nenhum desconto registrado'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            {aba === 'arquivados'
              ? 'Os descontos arquivados aparecerão aqui para consulta ou restauração.'
              : 'Clique em "Novo Desconto" acima para escolher o tipo e lançar um registro.'}
          </p>
        </div>
      ) : descontosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[28vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nenhum desconto corresponde aos filtros selecionados
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
          {itensPaginados.map((d) => (
            <CardLancamentoWallet
              key={d.id}
              variante="desconto"
              item={d}
              nomePagador={
                mapaPagadores.get(`${d.pagadorTipo}:${d.pagadorId}`) ||
                d.pagadorId
              }
              nomeCaminhao={
                mapaCaminhoes.get(String(d.caminhaoId)) ||
                `Caminhão #${d.caminhaoId}`
              }
              onEditar={
                !d.pagoEmRecebimentoId
                  ? () => setDescontoEdicao(d)
                  : undefined
              }
              onEditarJson={
                !d.pagoEmRecebimentoId
                  ? () => setDescontoJsonEdicao(d)
                  : undefined
              }
              onArquivar={
                !d.arquivado && !d.pagoEmRecebimentoId
                  ? () => {
                      alternarArquivamentoDescontoWallet(d.id, true);
                      carregar();
                    }
                  : undefined
              }
              onRestaurar={
                d.arquivado && !d.pagoEmRecebimentoId
                  ? () => {
                      alternarArquivamentoDescontoWallet(d.id, false);
                      carregar();
                    }
                  : undefined
              }
              onExcluir={
                !d.pagoEmRecebimentoId
                  ? () => {
                      excluirDescontoWallet(d.id);
                      carregar();
                    }
                  : undefined
              }
            />
          ))}

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={descontosFiltrados.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      <ModalNovoDesconto
        aberto={modalNovoAberto}
        onFechar={() => setModalNovoAberto(false)}
        onSalvo={() => {
          setAba('ativos');
          setPaginaAtual(1);
          carregar();
        }}
      />

      <ModalEditarLancamentoWallet
        tipoRegistro="desconto"
        registro={descontoEdicao}
        onFechar={() => setDescontoEdicao(null)}
        onSalvo={carregar}
      />

      <ModalEditarJsonWalletItem
        tipoRegistro="desconto"
        registro={descontoJsonEdicao}
        onFechar={() => setDescontoJsonEdicao(null)}
        onSalvo={carregar}
      />
    </div>
  );
}