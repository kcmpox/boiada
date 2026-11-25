import { useState, useEffect, useMemo } from 'react';
import { Archive } from 'lucide-react';
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

export function AbastecimentosArquivados() {
  const [arquivados, setArquivados] = useState<Abastecimento[]>([]);
  const [abastecimentoEmEdicao, setAbastecimentoEmEdicao] =
    useState<Abastecimento | null>(null);
  const [abastecimentoJsonEmEdicao, setAbastecimentoJsonEmEdicao] =
    useState<Abastecimento | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const carregar = () => {
    const lista = lerAbastecimentos()
      .filter((a) => Boolean(a.arquivado))
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setArquivados(lista);
  };

  useEffect(() => {
    carregar();
    window.addEventListener('storage', carregar);
    return () => window.removeEventListener('storage', carregar);
  }, []);

  const { mapaCaminhoes, mapaMotoristas, mapaViagens } = useMemo(() => {
    const caminhoesMap = new Map<string, string>();
    const motoristasMap = new Map<string, string>();
    const viagensMap = new Map<string, string>();

    const listaCaminhoes = extrairColecao(
      cadastrosStorage as Record<string, unknown>,
      ['caminhoes'],
      (x) => typeof x === 'object' && x !== null && 'placa' in x
    );
    for (const item of listaCaminhoes) {
      const c = item as {
        id: string | number;
        nome?: string;
        apelido?: string;
        placa?: string;
      };
      const nome = c.nome || c.apelido || 'Caminhão';
      caminhoesMap.set(
        String(c.id),
        `${nome}${c.placa ? ` (${c.placa})` : ''}`
      );
    }

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
      mapaCaminhoes: caminhoesMap,
      mapaMotoristas: motoristasMap,
      mapaViagens: viagensMap,
    };
  }, [arquivados]);

  const gruposCards = useMemo(
    () => agruparAbastecimentosPorResponsavel(arquivados),
    [arquivados]
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

  const handleRestaurar = (ab: Abastecimento) => {
    alternarArquivamentoAbastecimento(ab.id, false);
    carregar();
  };

  const handleExcluir = (itens: Abastecimento[]) => {
    excluirAbastecimentosPorIds(itens.map((item) => item.id));
    carregar();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Abastecimentos Arquivados
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {arquivados.length} abastecimento(s) arquivado(s)
        </p>
      </div>

      {gruposCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Archive className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum abastecimento arquivado
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Quando você arquivar um abastecimento, ele ficará disponível aqui para consulta ou restauração.
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
                nomeCaminhao={
                  mapaCaminhoes.get(String(ab.caminhaoId)) ||
                  `Caminhão #${ab.caminhaoId}`
                }
                nomeMotorista={
                  ab.motoristaId
                    ? mapaMotoristas.get(String(ab.motoristaId))
                    : undefined
                }
                rotuloViagem={
                  ab.viagemId ? mapaViagens.get(String(ab.viagemId)) : undefined
                }
                onEditar={(item) => setAbastecimentoEmEdicao(item)}
                onEditarJson={(item) => setAbastecimentoJsonEmEdicao(item)}
                onRestaurar={handleRestaurar}
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
        aberto={Boolean(abastecimentoEmEdicao)}
        abastecimentoEdicao={abastecimentoEmEdicao}
        onFechar={() => setAbastecimentoEmEdicao(null)}
        onSalvo={carregar}
      />

      <ModalEditarJsonAbastecimento
        abastecimento={abastecimentoJsonEmEdicao}
        onFechar={() => setAbastecimentoJsonEmEdicao(null)}
        onSalvo={carregar}
      />
    </div>
  );
}