import { useState, useEffect, useMemo } from 'react';
import { Plus, Milestone } from 'lucide-react';
import {
  type DespesaPedagio,
  lerDespesasPedagios,
  alternarArquivamentoDespesaPedagio,
  excluirDespesaPedagio,
} from '../../../storage/despesasPedagiosStorage';
import {
  listarCaminhoes,
  listarMotoristas,
} from '../../../storage/cadastrosStorage';
import { Paginacao } from '../../Paginacao';
import { ModalNovoPedagio } from './ModalNovoPedagio';
import { ModalEditarJsonDespesaPedagio } from '../../json_editor/ModalEditarJsonDespesaPedagio';
import { CardDespesaPedagio } from './CardDespesaPedagio';

const ITENS_POR_PAGINA = 10;

export function TodosPedagios() {
  const [modalAberto, setModalAberto] = useState(false);
  const [passagemEmEdicao, setPassagemEmEdicao] =
    useState<DespesaPedagio | null>(null);
  const [passagemJsonEmEdicao, setPassagemJsonEmEdicao] =
    useState<DespesaPedagio | null>(null);
  const [passagens, setPassagens] = useState<DespesaPedagio[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const carregar = () => {
    const ativas = lerDespesasPedagios()
      .filter((p) => !p.arquivado)
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setPassagens(ativas);
  };

  useEffect(() => {
    carregar();
    window.addEventListener('storage', carregar);
    return () => window.removeEventListener('storage', carregar);
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

  const totalPaginas = Math.max(
    1,
    Math.ceil(passagens.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const passagensPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return passagens.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [passagens, paginaSegura]);

  const totalGeral = useMemo(
    () => passagens.reduce((acc, p) => acc + p.valor, 0),
    [passagens]
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
            {passagens.length} passagem(ns) • Total acumulado:{' '}
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
            totalItens={passagens.length}
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