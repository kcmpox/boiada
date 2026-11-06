export type ResponsavelPagamentoAbastecimento =
  | 'minha_despesa'
  | 'frigorifico_desconta'
  | 'frigorifico_ressarce';

export type ResponsavelPagamentoItem =
  | 'padrao'
  | ResponsavelPagamentoAbastecimento;

export interface ItemAbastecimento {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  valorTotal: number;
  responsavelPagamento: ResponsavelPagamentoItem;
}

export interface Abastecimento {
  id: string;
  dataHora: string;
  caminhaoId: string;
  motoristaId?: string;
  hodometro: number;
  hodometroEstimado?: boolean;
  notaFiscal?: string;
  responsavelPagamento: ResponsavelPagamentoAbastecimento;
  viagemId?: string;
  minutaNumero?: string;
  itens: ItemAbastecimento[];
  valorTotal: number;
  arquivado?: boolean;
  criadoEm: string;
  atualizadoEm?: string;
}

const STORAGE_KEY = 'bacchiega_abastecimentos_v1';

export function lerAbastecimentos(): Abastecimento[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function salvarAbastecimento(
  novo: Omit<Abastecimento, 'id' | 'criadoEm'>
): Abastecimento {
  const lista = lerAbastecimentos();
  const registro: Abastecimento = {
    ...novo,
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    criadoEm: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([registro, ...lista]));
  window.dispatchEvent(new Event('storage'));
  return registro;
}

export function atualizarAbastecimento(
  id: string,
  dados: Omit<Abastecimento, 'id' | 'criadoEm' | 'arquivado'>
): Abastecimento | undefined {
  const lista = lerAbastecimentos();
  let atualizado: Abastecimento | undefined;

  const novaLista = lista.map((item) => {
    if (String(item.id) !== String(id)) return item;
    atualizado = {
      ...item,
      ...dados,
      atualizadoEm: new Date().toISOString(),
    };
    return atualizado;
  });

  if (atualizado) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
    window.dispatchEvent(new Event('storage'));
  }

  return atualizado;
}

export function alternarArquivamentoAbastecimento(
  id: string,
  arquivado: boolean
): void {
  const lista = lerAbastecimentos();
  const novaLista = lista.map((item) =>
    String(item.id) === String(id)
      ? { ...item, arquivado, atualizadoEm: new Date().toISOString() }
      : item
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
  window.dispatchEvent(new Event('storage'));
}

export function obterUltimoHodometroCaminhao(
  caminhaoId: string,
  ignorarAbastecimentoId?: string
): number {
  const doCaminhao = lerAbastecimentos()
    .filter(
      (a) =>
        String(a.caminhaoId) === String(caminhaoId) &&
        a.hodometro > 0 &&
        (!ignorarAbastecimentoId ||
          String(a.id) !== String(ignorarAbastecimentoId))
    )
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora));

  return doCaminhao[0]?.hodometro ?? 0;
}

export function obterViagensJaVinculadas(
  ignorarAbastecimentoId?: string
): Set<string> {
  const ids = new Set<string>();
  for (const ab of lerAbastecimentos()) {
    if (
      ab.viagemId &&
      (!ignorarAbastecimentoId ||
        String(ab.id) !== String(ignorarAbastecimentoId))
    ) {
      ids.add(String(ab.viagemId));
    }
  }
  return ids;
}

export function salvarAbastecimentoJson(
  idOriginal: string,
  objetoEditado: Abastecimento
): Abastecimento {
  const lista = lerAbastecimentos();
  const registroFinal: Abastecimento = {
    ...objetoEditado,
    id: String(objetoEditado.id || idOriginal),
    atualizadoEm: new Date().toISOString(),
  };

  const novaLista = lista.map((item) =>
    String(item.id) === String(idOriginal) ? registroFinal : item
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
  window.dispatchEvent(new Event('storage'));
  return registroFinal;
}