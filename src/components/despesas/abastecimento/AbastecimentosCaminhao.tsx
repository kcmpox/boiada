import { useState, useEffect, useMemo } from 'react';
import { Plus, Truck } from 'lucide-react';
import {
  type Abastecimento,
  lerAbastecimentos,
  alternarArquivamentoAbastecimento,
  excluirAbastecimentosPorIds,
} from '../../../storage/abastecimentosStorage';
import * as cadastrosStorage from '../../../storage/cadastrosStorage';
import * as viagensStorage from '../../../storage/viagensStorage';
import { Paginacao } from '../../Paginacao';
import { ModalNovoAbastecimento } from './ModalNovoAbastecimento';
import { ModalEditarJsonAbastecimento } from '../../json_editor/ModalEditarJsonAbastecimento';
import {
  CardAbastecimento,
  agruparAbastecimentosPorResponsavel,
} from './CardAbastecimento';

const ITENS_POR_PAGINA = 10;

interface AbastecimentosCaminhaoProps {
  caminhaoId: string;
  nome?: string;
  placa?: string;
}

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

export function AbastecimentosCaminhao({
  caminhaoId,
  nome,
  placa,
}: AbastecimentosCaminhaoProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [abastecimentoEmEdicao, setAbastecimentoEmEdicao] =
    useState<Abastecimento | null>(null);
  const [abastecimentoJsonEmEdicao, setAbastecimentoJsonEmEdicao] =
    useState<Abastecimento | null>(null);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const tituloCaminhao = nome
    ? `${nome}${placa ? ` (${placa})` : ''}`
    : `Caminhão #${caminhaoId}`;

  const carregar = () => {
    const doCaminhao = lerAbastecimentos()
      .filter(
        (a) => !a.arquivado && String(a.caminhaoId) === String(caminhaoId)
      )
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setAbastecimentos(doCaminhao);
  };

  useEffect(() => {
    setPaginaAtual(1);
    carregar();
    window.addEventListener('storage', carregar);
    return () => window.removeEventListener('storage', carregar);
  }, [caminhaoId]);

  const { mapaMotoristas, mapaViagens } = useMemo(() => {
    const motoristasMap = new Map<string, string>();
    const viagensMap = new Map<string, string>();

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
    for (const item of listaMotoristas) {
      const m = item as { id: string | number; nome: string };
      motoristasMap.set(String(m.id), m.nome);
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
      mapaMotoristas: motoristasMap,
      mapaViagens: viagensMap,
    };
  }, [abastecimentos]);

  const gruposCards = useMemo(
    () => agruparAbastecimentosPorResponsavel(abastecimentos),
    [abastecimentos]
  );

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

  const totalGeralCaminhao = useMemo(
    () => gruposCards.reduce((acc, g) => acc + g.subtotalLiquido, 0),
    [gruposCards]
  );

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

  const handleExcluir = (itens: Abastecimento[]) => {
    excluirAbastecimentosPorIds(itens.map((item) => item.id));
    carregar();
  };

  return (
    <div className="space-y-5">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Abastecimentos — {tituloCaminhao}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {abastecimentos.length} abastecimento(s) • Total acumulado:{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {totalGeralCaminhao.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
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

      {/* Lista de cards ou estado vazio */}
      {gruposCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum abastecimento para {tituloCaminhao}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Clique em &ldquo;Novo Abastecimento&rdquo; acima para registrar o primeiro lançamento deste veículo.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {gruposPaginados.map((grupo) => {
            const ab = grupo.abastecimento;
            return (
              <CardAbastecimento
                key={grupo.chave}
                grupo={grupo}
                nomeCaminhao={tituloCaminhao}
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
                onExcluir={() => handleExcluir(grupo.itens)}
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
        caminhaoInicialId={caminhaoId}
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