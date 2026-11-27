import type {
  TipoEntidadeTabela,
  BaseQuilometragemTabela,
} from './tabelasPrecoStorage';
import { viagemJaFoiPaga } from './recebimentosStorage';

export type TipoGado = 'boi_gordo' | 'boi_magro';
export type ModoDistanciaViagem = 'manual' | 'hodometro';

export type StatusSaidaChegada = 'pendente' | 'registrado' | 'ignorado';
export type StatusAnimaisPerdidos = 'pendente' | 'concluido';

export interface Viagem {
  id: string;
  tipoGado: TipoGado;
  caminhaoId: string;
  motoristaId: string;
  data: string; // YYYY-MM-DD
  localEmbarque: string;
  pecuarista: string;
  localDesembarque: string;
  frigorificoId: string;
  cte: string;
  minuta: string;

  // Distância informada na viagem
  baseKmInformada: BaseQuilometragemTabela;
  modoDistancia: ModoDistanciaViagem;
  hodometroInicial: number | null;
  hodometroFinal: number | null;
  kmInformado: number;
  kmUmaPernaCalculado: number;

  // Pagador e Snapshot Imutável da Tabela de Preços
  pagadorTipo: TipoEntidadeTabela;
  pagadorId: string;
  tabelaPrecoId: string | null;
  valorViagem: number; // Bruto
  valorManual?: boolean;
  percentualAluguelCarreta: number;
  valorAluguelCarreta: number;
  valorLiquidoViagem: number; // Bruto - Aluguel
  regraPrecoAplicada: string;
  dataPrevistaRecebimento: string | null;
  regraRecebimentoAplicada: string;

  // Etapa 1: Saída & Chegada
  statusSaidaChegada: StatusSaidaChegada;
  dataHoraSaida: string | null; // YYYY-MM-DDTHH:mm
  dataHoraChegada: string | null; // YYYY-MM-DDTHH:mm

  // Etapa 2: Animais Perdidos
  statusAnimaisPerdidos: StatusAnimaisPerdidos;
  houvePerdaAnimais: boolean;
  quantidadeAnimaisPerdidos: number;
  valorUnitarioAnimalPerdido: number;
  valorTotalAnimaisPerdidos: number;

  dataCriacao: string;
  dataArquivamento?: string;
}

const STORAGE_ATIVAS = 'bt_viagens_ativas';
const STORAGE_ARQUIVADAS = 'bt_viagens_arquivadas';

function normalizarLista(raw: unknown): Viagem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v: Partial<Viagem>) => {
    const bruto = Number(v.valorViagem) || 0;
    const aluguel = Number(v.valorAluguelCarreta) || 0;
    const qtdPerdidos = Number(v.quantidadeAnimaisPerdidos) || 0;
    const valUnitPerdido = Number(v.valorUnitarioAnimalPerdido) || 0;

    return {
      ...v,
      valorViagem: bruto,
      valorManual: Boolean(v.valorManual),
      valorAluguelCarreta: aluguel,
      valorLiquidoViagem:
        v.valorLiquidoViagem !== undefined
          ? Number(v.valorLiquidoViagem)
          : Number((bruto - aluguel).toFixed(2)),
      dataPrevistaRecebimento: v.dataPrevistaRecebimento || null,
      regraRecebimentoAplicada: v.regraRecebimentoAplicada || '',

      // Compatibilidade com viagens cadastradas antes dessas etapas
      statusSaidaChegada: v.statusSaidaChegada || 'pendente',
      dataHoraSaida: v.dataHoraSaida || null,
      dataHoraChegada: v.dataHoraChegada || null,

      statusAnimaisPerdidos: v.statusAnimaisPerdidos || 'pendente',
      houvePerdaAnimais: Boolean(v.houvePerdaAnimais),
      quantidadeAnimaisPerdidos: qtdPerdidos,
      valorUnitarioAnimalPerdido: valUnitPerdido,
      valorTotalAnimaisPerdidos:
        v.valorTotalAnimaisPerdidos !== undefined
          ? Number(v.valorTotalAnimaisPerdidos)
          : Number((qtdPerdidos * valUnitPerdido).toFixed(2)),
    } as Viagem;
  });
}

export function listarViagens(): Viagem[] {
  try {
    return normalizarLista(
      JSON.parse(localStorage.getItem(STORAGE_ATIVAS) || '[]')
    );
  } catch {
    return [];
  }
}

export function salvarViagens(lista: Viagem[]): void {
  const atuais = listarViagens();
  const mapaAtuais = new Map(atuais.map((v) => [String(v.id), v]));
  const idsNovos = new Set(lista.map((v) => String(v.id)));

  // Preserva viagens já pagas contra edição ou exclusão acidental
  const protegidas: Viagem[] = [];
  for (const antiga of atuais) {
    if (viagemJaFoiPaga(antiga.id)) {
      protegidas.push(antiga);
    }
  }

  const listaFinal = lista.map((item) => {
    if (viagemJaFoiPaga(item.id) && mapaAtuais.has(String(item.id))) {
      return mapaAtuais.get(String(item.id))!;
    }
    return item;
  });

  for (const p of protegidas) {
    if (!idsNovos.has(String(p.id))) {
      listaFinal.push(p);
    }
  }

  localStorage.setItem(STORAGE_ATIVAS, JSON.stringify(listaFinal));
}

export function listarViagensArquivadas(): Viagem[] {
  try {
    return normalizarLista(
      JSON.parse(localStorage.getItem(STORAGE_ARQUIVADAS) || '[]')
    );
  } catch {
    return [];
  }
}

export function salvarViagensArquivadas(lista: Viagem[]): void {
  localStorage.setItem(STORAGE_ARQUIVADAS, JSON.stringify(lista));
}

export function arquivarViagem(viagemId: string): Viagem[] {
  const ativas = listarViagens();
  if (viagemJaFoiPaga(viagemId)) {
    return ativas;
  }

  const alvo = ativas.find((v) => v.id === viagemId);
  if (!alvo) return ativas;

  const restantes = ativas.filter((v) => v.id !== viagemId);
  localStorage.setItem(STORAGE_ATIVAS, JSON.stringify(restantes));

  const arquivadas = listarViagensArquivadas();
  const registroArquivado: Viagem = {
    ...alvo,
    dataArquivamento: new Date().toISOString(),
  };
  salvarViagensArquivadas([registroArquivado, ...arquivadas]);

  return restantes;
}

export function restaurarViagemArquivada(viagemId: string): Viagem[] {
  const arquivadas = listarViagensArquivadas();
  const alvo = arquivadas.find((v) => v.id === viagemId);
  if (!alvo) return arquivadas;

  const restantesArquivadas = arquivadas.filter((v) => v.id !== viagemId);
  salvarViagensArquivadas(restantesArquivadas);

  const { dataArquivamento: _, ...viagemRestaurada } = alvo;
  const ativas = listarViagens();
  localStorage.setItem(
    STORAGE_ATIVAS,
    JSON.stringify([viagemRestaurada, ...ativas])
  );

  return restantesArquivadas;
}

export function excluirViagem(viagemId: string): Viagem[] {
  const ativas = listarViagens();
  if (viagemJaFoiPaga(viagemId)) {
    return ativas;
  }

  const restantes = ativas.filter((v) => v.id !== viagemId);
  localStorage.setItem(STORAGE_ATIVAS, JSON.stringify(restantes));
  return restantes;
}