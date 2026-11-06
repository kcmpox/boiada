import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { EmConstrucao } from '../../EmConstrucao';
import {
  type Abastecimento,
  lerAbastecimentos,
  alternarArquivamentoAbastecimento,
} from '../../../storage/abastecimentosStorage';
import * as cadastrosStorage from '../../../storage/cadastrosStorage';
import * as viagensStorage from '../../../storage/viagensStorage';
import { ModalNovoAbastecimento } from './ModalNovoAbastecimento';
import { ModalEditarJsonAbastecimento } from './ModalEditarJsonAbastecimento';
import {
  CardAbastecimento,
  agruparAbastecimentosPorResponsavel,
} from './CardAbastecimento';

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

export function TodosAbastecimentos() {
  const [modalAberto, setModalAberto] = useState(false);
  const [abastecimentoEmEdicao, setAbastecimentoEmEdicao] =
    useState<Abastecimento | null>(null);
  const [abastecimentoJsonEmEdicao, setAbastecimentoJsonEmEdicao] =
    useState<Abastecimento | null>(null);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);

  const carregar = () => {
    const ativos = lerAbastecimentos()
      .filter((a) => !a.arquivado)
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    setAbastecimentos(ativos);
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
  }, [abastecimentos]);

  const gruposCards = useMemo(
    () => agruparAbastecimentosPorResponsavel(abastecimentos),
    [abastecimentos]
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

  return (
    <div className="space-y-5">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Todos os Abastecimentos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {abastecimentos.length} abastecimento(s) • {gruposCards.length}{' '}
            lançamento(s) por responsável
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
        <EmConstrucao
          titulo="Nenhum abastecimento lançado ainda"
          descricao="Clique em 'Novo Abastecimento' acima para registrar notas de combustível, descontos e vínculos com viagens."
        />
      ) : (
        <div className="space-y-3.5">
          {gruposCards.map((grupo) => {
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
                onEditar={abrirEdicao}
                onEditarJson={(item) => setAbastecimentoJsonEmEdicao(item)}
                onArquivar={handleArquivar}
              />
            );
          })}
        </div>
      )}

      <ModalNovoAbastecimento
        aberto={modalAberto}
        abastecimentoEdicao={abastecimentoEmEdicao}
        onFechar={() => {
          setModalAberto(false);
          setAbastecimentoEmEdicao(null);
        }}
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