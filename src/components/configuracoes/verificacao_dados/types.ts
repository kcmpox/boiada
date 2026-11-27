export interface FonteArmazenamentoVerificacao {
  chave: string;
  rotulo: string;
  caminhoArray?: 'descontos' | 'reembolsos';
}

export interface OcorrenciaDuplicada {
  indiceNoArray: number;
  registro: Record<string, unknown>;
  jsonFormatado: string;
}

export interface GrupoIdDuplicado {
  grupoKey: string;
  fonte: FonteArmazenamentoVerificacao;
  idDuplicado: string;
  ocorrencias: OcorrenciaDuplicada[];
}

export const FONTES_VERIFICACAO_DUPLICADOS: FonteArmazenamentoVerificacao[] = [
  { chave: 'bt_viagens_ativas', rotulo: 'Viagens Ativas (bt_viagens_ativas)' },
  {
    chave: 'bt_despesas_abastecimentos',
    rotulo: 'Abastecimentos (bt_despesas_abastecimentos)',
  },
  {
    chave: 'bt_despesas_manutencoes',
    rotulo: 'Manutenções (bt_despesas_manutencoes)',
  },
  {
    chave: 'bt_despesas_pedagios',
    rotulo: 'Pedágios (bt_despesas_pedagios)',
  },
  { chave: 'bt_recebimentos', rotulo: 'Recebimentos (bt_recebimentos)' },
  {
    chave: 'bt_wallet',
    rotulo: 'Carteira • Descontos (bt_wallet.descontos)',
    caminhoArray: 'descontos',
  },
  {
    chave: 'bt_wallet',
    rotulo: 'Carteira • Reembolsos (bt_wallet.reembolsos)',
    caminhoArray: 'reembolsos',
  },
  { chave: 'bt_cad_caminhoes', rotulo: 'Caminhões (bt_cad_caminhoes)' },
  { chave: 'bt_cad_motoristas', rotulo: 'Motoristas (bt_cad_motoristas)' },
  {
    chave: 'bt_cad_frigorificos',
    rotulo: 'Frigoríficos (bt_cad_frigorificos)',
  },
  {
    chave: 'bt_cad_intermediarios',
    rotulo: 'Intermediários (bt_cad_intermediarios)',
  },
  {
    chave: 'bt_cad_pedagios',
    rotulo: 'Praças de Pedágio (bt_cad_pedagios)',
  },
];

function lerListaFonte(
  fonte: FonteArmazenamentoVerificacao
): Record<string, unknown>[] {
  try {
    const bruto = localStorage.getItem(fonte.chave);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);

    if (fonte.caminhoArray) {
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const sub = (parsed as Record<string, unknown>)[fonte.caminhoArray];
        return Array.isArray(sub) ? (sub as Record<string, unknown>[]) : [];
      }
      return [];
    }

    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function salvarListaFonte(
  fonte: FonteArmazenamentoVerificacao,
  novaLista: Record<string, unknown>[]
): void {
  if (fonte.caminhoArray) {
    let raiz: Record<string, unknown> = {};
    try {
      const bruto = localStorage.getItem(fonte.chave);
      if (bruto) {
        const parsed = JSON.parse(bruto);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          raiz = parsed as Record<string, unknown>;
        }
      }
    } catch {
      raiz = {};
    }
    localStorage.setItem(
      fonte.chave,
      JSON.stringify({ ...raiz, [fonte.caminhoArray]: novaLista })
    );
  } else {
    localStorage.setItem(fonte.chave, JSON.stringify(novaLista));
  }

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('bt-wallet-updated'));
  window.dispatchEvent(new Event('bt-recebimentos-updated'));
  window.dispatchEvent(new Event('bt-cadastros-updated'));
}

export function buscarRegistrosDuplicados(): GrupoIdDuplicado[] {
  const grupos: GrupoIdDuplicado[] = [];

  for (const fonte of FONTES_VERIFICACAO_DUPLICADOS) {
    const lista = lerListaFonte(fonte);
    const porId = new Map<string, OcorrenciaDuplicada[]>();

    lista.forEach((item, idx) => {
      if (!item || typeof item !== 'object') return;
      const rawId = item.id;
      if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
        return;
      }
      const idStr = String(rawId);
      const ocorrencias = porId.get(idStr) || [];
      ocorrencias.push({
        indiceNoArray: idx,
        registro: item,
        jsonFormatado: JSON.stringify(item, null, 2),
      });
      porId.set(idStr, ocorrencias);
    });

    for (const [idDuplicado, ocorrencias] of porId.entries()) {
      if (ocorrencias.length >= 2) {
        grupos.push({
          grupoKey: `${fonte.chave}:${fonte.caminhoArray || 'root'}::${idDuplicado}`,
          fonte,
          idDuplicado,
          ocorrencias,
        });
      }
    }
  }

  return grupos;
}

export function atualizarRegistroPorIndice(
  fonte: FonteArmazenamentoVerificacao,
  indiceNoArray: number,
  novoObjeto: Record<string, unknown>
): void {
  const lista = lerListaFonte(fonte);
  if (indiceNoArray < 0 || indiceNoArray >= lista.length) return;

  const atualizada = lista.map((item, idx) =>
    idx === indiceNoArray ? novoObjeto : item
  );
  salvarListaFonte(fonte, atualizada);
}

export function removerRegistroPorIndice(
  fonte: FonteArmazenamentoVerificacao,
  indiceNoArray: number
): boolean {
  const lista = lerListaFonte(fonte);
  if (indiceNoArray < 0 || indiceNoArray >= lista.length) return false;

  const alvo = lista[indiceNoArray];
  const alvoId = alvo?.id !== undefined ? String(alvo.id) : '';
  if (!alvoId) return false;

  const totalComMesmoId = lista.filter(
    (item) => item && String(item.id) === alvoId
  ).length;
  if (totalComMesmoId <= 1) {
    return false;
  }

  const atualizada = lista.filter((_, idx) => idx !== indiceNoArray);
  salvarListaFonte(fonte, atualizada);
  return true;
}

export function formatarDataResumo(iso?: unknown): string {
  if (typeof iso !== 'string' || !iso) return '—';
  const limpo = iso.slice(0, 10);
  const [ano, mes, dia] = limpo.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

export function formatarMoedaResumo(valor: unknown): string {
  const num = Number(valor);
  if (!Number.isFinite(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}