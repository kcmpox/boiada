import { useState, useEffect, useMemo } from 'react';
import { EmConstrucao } from '../../EmConstrucao';
import {
  type Abastecimento,
  lerAbastecimentos,
  alternarArquivamentoAbastecimento,
} from '../../../storage/abastecimentosStorage';
import * as cadastrosStorage from '../../../storage/cadastrosStorage';
import { ModalNovoAbastecimento } from './ModalNovoAbastecimento';
import {
  CardAbastecimento,
  agruparAbastecimentosPorResponsavel,
} from './CardAbastecimento';

export function AbastecimentosArquivados() {
  const [arquivados, setArquivados] = useState<Abastecimento[]>([]);
  const [abastecimentoEmEdicao, setAbastecimentoEmEdicao] =
    useState<Abastecimento | null>(null);

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

  const mapaCaminhoes = useMemo(() => {
    const map = new Map<string, string>();
    const storage = cadastrosStorage as Record<string, unknown>;
    for (const fn of Object.values(storage)) {
      if (typeof fn === 'function' && fn.length === 0) {
        try {
          const res = fn();
          const lista = Array.isArray(res)
            ? res
            : (res as { caminhoes?: unknown[] })?.caminhoes;
          if (Array.isArray(lista)) {
            for (const item of lista) {
              if (
                item &&
                typeof item === 'object' &&
                'id' in item &&
                'placa' in item
              ) {
                const c = item as {
                  id: string | number;
                  nome?: string;
                  apelido?: string;
                  placa?: string;
                };
                const nome = c.nome || c.apelido || 'Caminhão';
                map.set(
                  String(c.id),
                  `${nome}${c.placa ? ` (${c.placa})` : ''}`
                );
              }
            }
          }
        } catch {
          // Ignora
        }
      }
    }
    return map;
  }, [arquivados]);

  const gruposCards = useMemo(
    () => agruparAbastecimentosPorResponsavel(arquivados),
    [arquivados]
  );

  const handleRestaurar = (ab: Abastecimento) => {
    alternarArquivamentoAbastecimento(ab.id, false);
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
        <EmConstrucao
          titulo="Nenhum abastecimento arquivado"
          descricao="Abastecimentos arquivados na tela principal aparecerão aqui para consulta ou restauração."
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
                onEditar={(item) => setAbastecimentoEmEdicao(item)}
                onRestaurar={handleRestaurar}
              />
            );
          })}
        </div>
      )}

      <ModalNovoAbastecimento
        aberto={Boolean(abastecimentoEmEdicao)}
        abastecimentoEdicao={abastecimentoEmEdicao}
        onFechar={() => setAbastecimentoEmEdicao(null)}
        onSalvo={carregar}
      />
    </div>
  );
}