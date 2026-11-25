export type CategoriaManutencao =
  | 'Borracharia'
  | 'Elétrica'
  | 'Mecânica'
  | 'Lavagem'
  | 'Peça'
  | 'Outro';

export type ResponsavelPagamentoManutencao =
  | 'minha_despesa'
  | 'frigorifico_desconta'
  | 'frigorifico_ressarce';

export interface Manutencao {
  id: string;
  dataHora: string; // ISO local: YYYY-MM-DDTHH:mm
  caminhaoId: string;
  motoristaId?: string;
  categoria: CategoriaManutencao;
  descricao: string;
  valor: number;
  responsavelPagamento: ResponsavelPagamentoManutencao;
  arquivada?: boolean;
  criadoEm: string;
  atualizadoEm?: string;
}

export const CATEGORIAS_MANUTENCAO: CategoriaManutencao[] = [
  'Borracharia',
  'Elétrica',
  'Mecânica',
  'Lavagem',
  'Peça',
  'Outro',
];

export const RESPONSAVEIS_PAGAMENTO_MANUTENCAO: {
  valor: ResponsavelPagamentoManutencao;
  label: string;
}[] = [
  { valor: 'minha_despesa', label: 'Minha despesa' },
  { valor: 'frigorifico_desconta', label: 'Frigorífico desconta' },
  { valor: 'frigorifico_ressarce', label: 'Frigorífico ressarce' },
];

const CHAVE_STORAGE = 'bt_despesas_manutencoes';

export function lerManutencoes(): Manutencao[] {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? (parsed as Manutencao[]) : [];
  } catch {
    return [];
  }
}

export function salvarManutencoes(lista: Manutencao[]): void {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));
  window.dispatchEvent(new Event('storage'));
}

export function salvarManutencao(
  dados: Omit<Manutencao, 'id' | 'criadoEm'> & { id?: string }
): Manutencao {
  const atual = lerManutencoes();
  const agora = new Date().toISOString();

  if (dados.id) {
    let atualizado: Manutencao | null = null;
    const novaLista = atual.map((item) => {
      if (item.id !== dados.id) return item;
      atualizado = {
        ...item,
        ...dados,
        id: item.id,
        atualizadoEm: agora,
      };
      return atualizado;
    });

    if (atualizado) {
      salvarManutencoes(novaLista);
      return atualizado;
    }
  }

  const novo: Manutencao = {
    ...dados,
    id: dados.id || crypto.randomUUID(),
    arquivada: Boolean(dados.arquivada),
    criadoEm: agora,
  };

  salvarManutencoes([novo, ...atual]);
  return novo;
}

export function salvarManutencaoJson(
  idOriginal: string,
  registroEditado: Manutencao
): void {
  const atual = lerManutencoes();
  const novaLista = atual.map((item) =>
    item.id === idOriginal
      ? {
          ...registroEditado,
          id: String(registroEditado.id || idOriginal),
          atualizadoEm: new Date().toISOString(),
        }
      : item
  );
  salvarManutencoes(novaLista);
}

export function alternarArquivamentoManutencao(
  id: string,
  arquivada: boolean
): void {
  const atual = lerManutencoes();
  const novaLista = atual.map((item) =>
    item.id === id
      ? { ...item, arquivada, atualizadoEm: new Date().toISOString() }
      : item
  );
  salvarManutencoes(novaLista);
}

export function excluirManutencao(id: string): void {
  const atual = lerManutencoes();
  salvarManutencoes(atual.filter((item) => item.id !== id));
}