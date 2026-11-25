import { useState, useEffect, useMemo } from 'react';
import { Plus, Wrench } from 'lucide-react';
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

export function TodasManutencoes() {
  const [modalAberto, setModalAberto] = useState(false);
  const [manutencaoEmEdicao, setManutencaoEmEdicao] =
    useState<Manutencao | null>(null);
  const [manutencaoJsonEmEdicao, setManutencaoJsonEmEdicao] =
    useState<Manutencao | null>(null);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const carregar = () => {
    const ativas = lerManutencoes()
      .filter((m) => !m.arquivada)
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setManutencoes(ativas);
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
  }, [manutencoes]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(manutencoes.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const manutencoesPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return manutencoes.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [manutencoes, paginaSegura]);

  const totalGeral = useMemo(
    () => manutencoes.reduce((acc, m) => acc + m.valor, 0),
    [manutencoes]
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
            {manutencoes.length} manutenção(ões) • Total acumulado:{' '}
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
            totalItens={manutencoes.length}
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