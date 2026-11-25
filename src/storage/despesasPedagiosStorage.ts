export type ResponsavelPagamentoPedagio =
  | 'minha_despesa'
  | 'frigorifico_desconta'
  | 'frigorifico_ressarce';

export interface DespesaPedagio {
  id: string;
  dataHora: string; // ISO local: YYYY-MM-DDTHH:mm
  caminhaoId?: string;
  motoristaId?: string;
  viagemId?: string; // ID da viagem vinculada (opcional)
  semViagemConfirmado?: boolean; // Marcado manualmente como passagem avulsa sem viagem
  pedagioId?: string;
  nomePedagio: string;
  rodovia?: string;
  km?: number;
  cidade?: string;
  direcao?: string;
  latitude?: number | null;
  longitude?: number | null;
  valor: number;
  semParar: boolean;
  responsavelPagamento: ResponsavelPagamentoPedagio;
  arquivado?: boolean;
  criadoEm: string;
  atualizadoEm?: string;
}

export const RESPONSAVEIS_PAGAMENTO_PEDAGIO: {
  valor: ResponsavelPagamentoPedagio;
  label: string;
}[] = [
  { valor: 'minha_despesa', label: 'Minha despesa' },
  { valor: 'frigorifico_desconta', label: 'Frigorífico desconta' },
  { valor: 'frigorifico_ressarce', label: 'Frigorífico ressarce' },
];

const CHAVE_STORAGE = 'bt_despesas_pedagios';

export function lerDespesasPedagios(): DespesaPedagio[] {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? (parsed as DespesaPedagio[]) : [];
  } catch {
    return [];
  }
}

export function salvarDespesasPedagios(lista: DespesaPedagio[]): void {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));
  window.dispatchEvent(new Event('storage'));
}

export function salvarDespesaPedagio(
  dados: Omit<DespesaPedagio, 'id' | 'criadoEm'> & { id?: string }
): DespesaPedagio {
  const atual = lerDespesasPedagios();
  const agora = new Date().toISOString();

  if (dados.id) {
    let atualizado: DespesaPedagio | null = null;
    const novaLista = atual.map((item) => {
      if (item.id !== dados.id) return item;
      atualizado = {
        ...item,
        ...dados,
        id: item.id,
        semViagemConfirmado: dados.viagemId
          ? false
          : dados.semViagemConfirmado ?? item.semViagemConfirmado,
        atualizadoEm: agora,
      };
      return atualizado;
    });

    if (atualizado) {
      salvarDespesasPedagios(novaLista);
      return atualizado;
    }
  }

  const novo: DespesaPedagio = {
    ...dados,
    id: dados.id || crypto.randomUUID(),
    arquivado: Boolean(dados.arquivado),
    criadoEm: agora,
  };

  salvarDespesasPedagios([novo, ...atual]);
  return novo;
}

export function vincularViagemDespesaPedagio(
  passagemId: string,
  viagemId: string
): void {
  const atual = lerDespesasPedagios();
  const novaLista = atual.map((item) =>
    item.id === passagemId
      ? {
          ...item,
          viagemId: String(viagemId),
          semViagemConfirmado: false,
          atualizadoEm: new Date().toISOString(),
        }
      : item
  );
  salvarDespesasPedagios(novaLista);
}

export function confirmarPedagioSemViagem(
  passagemId: string,
  confirmado: boolean
): void {
  const atual = lerDespesasPedagios();
  const novaLista = atual.map((item) =>
    item.id === passagemId
      ? {
          ...item,
          semViagemConfirmado: confirmado,
          atualizadoEm: new Date().toISOString(),
        }
      : item
  );
  salvarDespesasPedagios(novaLista);
}

export function salvarDespesaPedagioJson(
  idOriginal: string,
  registroEditado: DespesaPedagio
): void {
  const atual = lerDespesasPedagios();
  const novaLista = atual.map((item) =>
    item.id === idOriginal
      ? {
          ...registroEditado,
          id: String(registroEditado.id || idOriginal),
          atualizadoEm: new Date().toISOString(),
        }
      : item
  );
  salvarDespesasPedagios(novaLista);
}

export function alternarArquivamentoDespesaPedagio(
  id: string,
  arquivado: boolean
): void {
  const atual = lerDespesasPedagios();
  const novaLista = atual.map((item) =>
    item.id === id
      ? { ...item, arquivado, atualizadoEm: new Date().toISOString() }
      : item
  );
  salvarDespesasPedagios(novaLista);
}

export function excluirDespesaPedagio(id: string): void {
  const atual = lerDespesasPedagios();
  salvarDespesasPedagios(atual.filter((item) => item.id !== id));
}