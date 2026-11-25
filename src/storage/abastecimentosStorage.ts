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
const VIAGENS_CONFIRMADAS_SEM_ABASTECIMENTO_KEY =
  'bacchiega_viagens_sem_abastecimento_confirmadas_v1';

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

export function lerViagensConfirmadasSemAbastecimento(): Set<string> {
  try {
    const raw = localStorage.getItem(VIAGENS_CONFIRMADAS_SEM_ABASTECIMENTO_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

export function confirmarViagemSemAbastecimento(viagemId: string): void {
  const atuais = lerViagensConfirmadasSemAbastecimento();
  atuais.add(String(viagemId));
  localStorage.setItem(
    VIAGENS_CONFIRMADAS_SEM_ABASTECIMENTO_KEY,
    JSON.stringify(Array.from(atuais))
  );
  window.dispatchEvent(new Event('storage'));
}

export function desconfirmarViagemSemAbastecimento(viagemId: string): void {
  const atuais = lerViagensConfirmadasSemAbastecimento();
  atuais.delete(String(viagemId));
  localStorage.setItem(
    VIAGENS_CONFIRMADAS_SEM_ABASTECIMENTO_KEY,
    JSON.stringify(Array.from(atuais))
  );
  window.dispatchEvent(new Event('storage'));
}

export function excluirAbastecimentosPorIds(ids: string[]): void {
  const conjunto = new Set(ids);
  const atual = lerAbastecimentos();
  const restante = atual.filter((item) => !conjunto.has(item.id));
  // Use aqui a mesma chave/função de gravação do seu abastecimentosStorage.ts
  localStorage.setItem('bt_despesas_abastecimentos', JSON.stringify(restante));
  window.dispatchEvent(new Event('storage'));
}