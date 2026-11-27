import { despesaJaFoiPaga } from './recebimentosStorage';

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
  const atuais = lerDespesasPedagios();
  const mapaAtuais = new Map(atuais.map((item) => [String(item.id), item]));
  const idsNovos = new Set(lista.map((item) => String(item.id)));

  const listaFinal = lista.map((item) => {
    if (despesaJaFoiPaga(item.id) && mapaAtuais.has(String(item.id))) {
      return mapaAtuais.get(String(item.id))!;
    }
    return item;
  });

  for (const antigo of atuais) {
    if (despesaJaFoiPaga(antigo.id) && !idsNovos.has(String(antigo.id))) {
      listaFinal.push(antigo);
    }
  }

  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaFinal));
  window.dispatchEvent(new Event('storage'));
}

export function salvarDespesaPedagio(
  dados: Omit<DespesaPedagio, 'id' | 'criadoEm'> & { id?: string }
): DespesaPedagio | undefined {
  const atual = lerDespesasPedagios();
  const agora = new Date().toISOString();

  if (dados.id) {
    if (despesaJaFoiPaga(dados.id)) return undefined;

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
  if (despesaJaFoiPaga(passagemId)) return;

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
  if (despesaJaFoiPaga(passagemId)) return;

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
  if (despesaJaFoiPaga(idOriginal)) return;

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
  if (despesaJaFoiPaga(id)) return;

  const atual = lerDespesasPedagios();
  const novaLista = atual.map((item) =>
    item.id === id
      ? { ...item, arquivado, atualizadoEm: new Date().toISOString() }
      : item
  );
  salvarDespesasPedagios(novaLista);
}

export function excluirDespesaPedagio(id: string): void {
  if (despesaJaFoiPaga(id)) return;

  const atual = lerDespesasPedagios();
  salvarDespesasPedagios(atual.filter((item) => item.id !== id));
}
