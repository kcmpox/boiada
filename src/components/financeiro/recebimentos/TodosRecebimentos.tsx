import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Wallet,
  FileDown,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  listarRecebimentos,
  type RegistroRecebimento,
} from '../../../storage/recebimentosStorage';
import {
  listarCaminhoes,
  listarFrigorificos,
  listarIntermediarios,
} from '../../../storage/cadastrosStorage';
import { Paginacao } from '../../Paginacao';
import { ModalNovoRecebimento } from './ModalNovoRecebimento';
import { CardRecebimento } from './CardRecebimento';
import {
  ModalRecebimentosPDF,
  type FiltroInicialRecebimentosPDF,
} from './ModalRecebimentosPDF';

const ITENS_POR_PAGINA = 10;

function formatarMoeda(valor: number): string {
  const limpo = Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
  return limpo.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function obterRecebimentosOrdenados(): RegistroRecebimento[] {
  return listarRecebimentos()
    .filter((r) => !r.arquivado)
    .sort((a, b) => {
      const cmpData = (b.dataPagamento || '').localeCompare(
        a.dataPagamento || ''
      );
      if (cmpData !== 0) return cmpData;
      return (b.criadoEm || '').localeCompare(a.criadoEm || '');
    });
}

export function TodosRecebimentos() {
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalPdfAberto, setModalPdfAberto] = useState(false);
  const [filtroParaPdf, setFiltroParaPdf] =
    useState<FiltroInicialRecebimentosPDF | null>(null);
  const [recebimentos, setRecebimentos] = useState<RegistroRecebimento[]>(() =>
    obterRecebimentosOrdenados()
  );
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [filtroCaminhaoId, setFiltroCaminhaoId] = useState<string>('');
  const [filtroPagadorChave, setFiltroPagadorChave] = useState<string>('');

  const carregar = useCallback(() => {
    setRecebimentos(obterRecebimentosOrdenados());
  }, []);

  useEffect(() => {
    carregar();
    window.addEventListener('storage', carregar);
    window.addEventListener('bt-recebimentos-updated', carregar);
    return () => {
      window.removeEventListener('storage', carregar);
      window.removeEventListener('bt-recebimentos-updated', carregar);
    };
  }, [carregar]);

  const { opcoesCaminhoes, opcoesPagadores } = useMemo(() => {
    const cMap = new Map<string, string>();
    const pMap = new Map<string, string>();

    for (const c of listarCaminhoes()) {
      cMap.set(
        String(c.id),
        `${c.nome}${c.placa ? ` (${c.placa})` : ''}`
      );
    }

    for (const f of listarFrigorificos()) {
      pMap.set(`frigorifico:${f.id}`, `${f.nome} (Frigorífico)`);
    }

    for (const i of listarIntermediarios()) {
      pMap.set(`intermediario:${i.id}`, `${i.nome} (Intermediário)`);
    }

    for (const r of recebimentos) {
      if (r.caminhaoId && !cMap.has(String(r.caminhaoId))) {
        cMap.set(
          String(r.caminhaoId),
          r.caminhaoNome || `Caminhão #${r.caminhaoId}`
        );
      }
      if (r.pagadorTipo && r.pagadorId) {
        const chave = `${r.pagadorTipo}:${r.pagadorId}`;
        if (!pMap.has(chave)) {
          pMap.set(chave, r.pagadorNome || r.pagadorId);
        }
      }
    }

    return {
      opcoesCaminhoes: Array.from(cMap.entries()).map(([id, nome]) => ({
        id,
        nome,
      })),
      opcoesPagadores: Array.from(pMap.entries()).map(([chave, nome]) => ({
        chave,
        nome,
      })),
    };
  }, [recebimentos]);

  const haFiltrosAtivos = Boolean(
    filtroDataInicio || filtroDataFim || filtroCaminhaoId || filtroPagadorChave
  );

  const limparFiltros = () => {
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroCaminhaoId('');
    setFiltroPagadorChave('');
    setPaginaAtual(1);
  };

  const recebimentosFiltrados = useMemo(() => {
    return recebimentos.filter((r) => {
      const dataPgto = (r.dataPagamento || '').slice(0, 10);

      if (filtroDataInicio && (!dataPgto || dataPgto < filtroDataInicio)) {
        return false;
      }

      if (filtroDataFim && (!dataPgto || dataPgto > filtroDataFim)) {
        return false;
      }

      if (
        filtroCaminhaoId &&
        String(r.caminhaoId || '') !== String(filtroCaminhaoId)
      ) {
        return false;
      }

      if (filtroPagadorChave) {
        const chaveItem = `${r.pagadorTipo}:${r.pagadorId}`;
        if (chaveItem !== filtroPagadorChave) {
          return false;
        }
      }

      return true;
    });
  }, [
    recebimentos,
    filtroDataInicio,
    filtroDataFim,
    filtroCaminhaoId,
    filtroPagadorChave,
  ]);

  const { totalApurado, totalRecebido } = useMemo(() => {
    let apurado = 0;
    let recebido = 0;

    for (const r of recebimentosFiltrados) {
      const apuItem =
        typeof r.liquidoCalculado === 'number'
          ? r.liquidoCalculado
          : r.valorEfetivamentePago || 0;
      const recItem =
        typeof r.valorEfetivamentePago === 'number'
          ? r.valorEfetivamentePago
          : 0;

      apurado = Number((apurado + apuItem).toFixed(2));
      recebido = Number((recebido + recItem).toFixed(2));
    }

    return { totalApurado: apurado, totalRecebido: recebido };
  }, [recebimentosFiltrados]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(recebimentosFiltrados.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const recebimentosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return recebimentosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [recebimentosFiltrados, paginaSegura]);

  const abrirModalPDF = () => {
    setFiltroParaPdf({
      dataInicio: filtroDataInicio,
      dataFim: filtroDataFim,
      caminhaoId: filtroCaminhaoId,
      pagadorChave: filtroPagadorChave,
    });
    setModalPdfAberto(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Todos Recebimentos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {haFiltrosAtivos
              ? `${recebimentosFiltrados.length} de ${recebimentos.length} fechamento(s) • `
              : `${recebimentos.length} fechamento(s) • `}
            Recebido:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
              {formatarMoeda(totalRecebido)}
            </strong>{' '}
            • Líquido apurado:{' '}
            <strong className="text-slate-700 dark:text-slate-200 font-mono">
              {formatarMoeda(totalApurado)}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={abrirModalPDF}
            title="Relatórios e Impressões PDF"
            aria-label="Relatórios e Impressões PDF"
            className="h-10 w-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-brand-500" />
          </button>

          <button
            type="button"
            onClick={() => setModalNovoAberto(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-brand-contrast text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Recebimento
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      {recebimentos.length > 0 && (
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
          </div>
        </div>
      )}

      {recebimentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum recebimento registrado
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Clique em &ldquo;Novo Recebimento&rdquo; acima para registrar um fechamento e gerar o primeiro card.
          </p>
        </div>
      ) : recebimentosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[28vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nenhum recebimento corresponde aos filtros selecionados
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
          {recebimentosPaginados.map((rec) => (
            <CardRecebimento
              key={rec.id}
              recebimento={rec}
              onExcluido={carregar}
            />
          ))}

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={recebimentosFiltrados.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      <ModalNovoRecebimento
        aberto={modalNovoAberto}
        onFechar={() => setModalNovoAberto(false)}
        onSalvo={() => {
          setPaginaAtual(1);
          carregar();
        }}
      />

      <ModalRecebimentosPDF
        aberto={modalPdfAberto}
        filtroInicial={filtroParaPdf}
        onFechar={() => setModalPdfAberto(false)}
      />
    </div>
  );
}