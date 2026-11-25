import { useState, useEffect, useMemo } from 'react';
import { Archive } from 'lucide-react';
import {
  type Manutencao,
  lerManutencoes,
  alternarArquivamentoManutencao,
  excluirManutencao,
} from '../../../storage/manutencoesStorage';
import {
  listarCaminhoes,
  listarMotoristas,
} from '../../../storage/cadastrosStorage';
import { Paginacao } from '../../Paginacao';
import { ModalNovaManutencao } from './ModalNovaManutencao';
import { ModalEditarJsonManutencao } from '../../json_editor/ModalEditarJsonManutencao';
import { CardManutencao } from './CardManutencao';

const ITENS_POR_PAGINA = 10;

export function ManutencoesArquivadas() {
  const [arquivadas, setArquivadas] = useState<Manutencao[]>([]);
  const [manutencaoEmEdicao, setManutencaoEmEdicao] =
    useState<Manutencao | null>(null);
  const [manutencaoJsonEmEdicao, setManutencaoJsonEmEdicao] =
    useState<Manutencao | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const carregar = () => {
    const lista = lerManutencoes()
      .filter((m) => Boolean(m.arquivada))
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setArquivadas(lista);
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
  }, [arquivadas]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(arquivadas.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const arquivadasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return arquivadas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [arquivadas, paginaSegura]);

  const handleRestaurar = (m: Manutencao) => {
    alternarArquivamentoManutencao(m.id, false);
    carregar();
  };

  const handleExcluir = (m: Manutencao) => {
    excluirManutencao(m.id);
    carregar();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Manutenções Arquivadas
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {arquivadas.length} manutenção(ões) arquivada(s)
        </p>
      </div>

      {arquivadas.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Archive className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhuma manutenção arquivada
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Quando você arquivar uma manutenção, ela ficará disponível aqui para consulta ou restauração.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {arquivadasPaginadas.map((m) => (
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
              onEditar={(item) => setManutencaoEmEdicao(item)}
              onEditarJson={(item) => setManutencaoJsonEmEdicao(item)}
              onRestaurar={handleRestaurar}
              onExcluir={handleExcluir}
            />
          ))}

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={arquivadas.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      <ModalNovaManutencao
        aberto={Boolean(manutencaoEmEdicao)}
        manutencaoEdicao={manutencaoEmEdicao}
        onFechar={() => setManutencaoEmEdicao(null)}
        onSalvo={carregar}
      />

      <ModalEditarJsonManutencao
        manutencao={manutencaoJsonEmEdicao}
        onFechar={() => setManutencaoJsonEmEdicao(null)}
        onSalvo={carregar}
      />
    </div>
  );
}