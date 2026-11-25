import { useState, useEffect, useMemo } from 'react';
import { Archive } from 'lucide-react';
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

export function PedagiosArquivados() {
  const [arquivados, setArquivados] = useState<DespesaPedagio[]>([]);
  const [passagemEmEdicao, setPassagemEmEdicao] =
    useState<DespesaPedagio | null>(null);
  const [passagemJsonEmEdicao, setPassagemJsonEmEdicao] =
    useState<DespesaPedagio | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const carregar = () => {
    const lista = lerDespesasPedagios()
      .filter((p) => Boolean(p.arquivado))
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setArquivados(lista);
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
  }, [arquivados]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(arquivados.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const arquivadosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return arquivados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [arquivados, paginaSegura]);

  const handleRestaurar = (p: DespesaPedagio) => {
    alternarArquivamentoDespesaPedagio(p.id, false);
    carregar();
  };

  const handleExcluir = (p: DespesaPedagio) => {
    excluirDespesaPedagio(p.id);
    carregar();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Pedágios Arquivados
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {arquivados.length} passagem(ns) arquivada(s)
        </p>
      </div>

      {arquivados.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Archive className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum pedágio arquivado
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Quando você arquivar uma passagem de pedágio, ela ficará disponível aqui para consulta ou restauração.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {arquivadosPaginados.map((p) => (
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
              onEditar={(item) => setPassagemEmEdicao(item)}
              onEditarJson={(item) => setPassagemJsonEmEdicao(item)}
              onRestaurar={handleRestaurar}
              onExcluir={handleExcluir}
            />
          ))}

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={arquivados.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      <ModalNovoPedagio
        aberto={Boolean(passagemEmEdicao)}
        passagemEdicao={passagemEmEdicao}
        onFechar={() => setPassagemEmEdicao(null)}
        onSalvo={carregar}
      />

      <ModalEditarJsonDespesaPedagio
        passagem={passagemJsonEmEdicao}
        onFechar={() => setPassagemJsonEmEdicao(null)}
        onSalvo={carregar}
      />
    </div>
  );
}