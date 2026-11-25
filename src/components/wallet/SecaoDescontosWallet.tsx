import { useState, useEffect, useMemo } from 'react';
import { Plus, TrendingDown, Archive } from 'lucide-react';
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

  const { mapaPagadores, mapaCaminhoes } = useMemo(() => {
    const pMap = new Map<string, string>();
    for (const f of listarFrigorificos()) {
      pMap.set(`frigorifico:${f.id}`, f.nome);
    }
    for (const i of listarIntermediarios()) {
      pMap.set(`intermediario:${i.id}`, i.nome);
    }

    const cMap = new Map<string, string>();
    for (const c of listarCaminhoes()) {
      cMap.set(
        String(c.id),
        `${c.nome}${c.placa ? ` (${c.placa})` : ''}`
      );
    }

    return { mapaPagadores: pMap, mapaCaminhoes: cMap };
  }, [todosDescontos]);

  const descontosFiltrados = useMemo(() => {
    return todosDescontos
      .filter((d) =>
        aba === 'arquivados' ? Boolean(d.arquivado) : !d.arquivado
      )
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [todosDescontos, aba]);

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
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Descontos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {descontosFiltrados.length} registro(s) • Total:{' '}
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

      {/* Lista de cards ou estado vazio */}
      {descontosFiltrados.length === 0 ? (
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
                d.caminhaoId
                  ? mapaCaminhoes.get(String(d.caminhaoId))
                  : undefined
              }
              onEditar={() => setDescontoEdicao(d)}
              onEditarJson={() => setDescontoJsonEdicao(d)}
              onArquivar={
                !d.arquivado
                  ? () => {
                      alternarArquivamentoDescontoWallet(d.id, true);
                      carregar();
                    }
                  : undefined
              }
              onRestaurar={
                d.arquivado
                  ? () => {
                      alternarArquivamentoDescontoWallet(d.id, false);
                      carregar();
                    }
                  : undefined
              }
              onExcluir={() => {
                excluirDescontoWallet(d.id);
                carregar();
              }}
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