import {
  listarFrigorificos,
  listarIntermediarios,
} from './cadastrosStorage';

export type TipoPagadorWallet = 'frigorifico' | 'intermediario';

export type TipoDescontoWallet =
  | 'abastecimento'
  | 'animais_perdidos'
  | 'frete'
  | 'outro';

export type TipoReembolsoWallet =
  | 'pedagio'
  | 'abastecimento'
  | 'frete'
  | 'outro';

export interface SaldoPagadorWallet {
  pagadorTipo: TipoPagadorWallet;
  pagadorId: string;
  saldo: number;
  atualizadoEm?: string;
}

export interface DescontoWallet {
  id: string;
  tipo: TipoDescontoWallet;
  pagadorTipo: TipoPagadorWallet;
  pagadorId: string;
  caminhaoId?: string;
  data: string;
  descricao: string;
  valor: number;
  arquivado?: boolean;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface ReembolsoWallet {
  id: string;
  tipo?: TipoReembolsoWallet;
  pagadorTipo: TipoPagadorWallet;
  pagadorId: string;
  caminhaoId?: string;
  data: string;
  descricao: string;
  valor: number;
  arquivado?: boolean;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface DadosWallet {
  saldosPorPagador: Record<string, SaldoPagadorWallet>;
  descontos: DescontoWallet[];
  reembolsos: ReembolsoWallet[];
}

export interface PagadorConsolidadoWallet {
  chave: string;
  pagadorTipo: TipoPagadorWallet;
  pagadorId: string;
  nome: string;
  subtitulo?: string;
  saldo: number;
  atualizadoEm?: string;
}

const CHAVE_WALLET = 'bt_wallet';

function normalizarWallet(raw: unknown): DadosWallet {
  if (!raw || typeof raw !== 'object') {
    return { saldosPorPagador: {}, descontos: [], reembolsos: [] };
  }

  const obj = raw as Partial<DadosWallet>;
  return {
    saldosPorPagador:
      obj.saldosPorPagador &&
      typeof obj.saldosPorPagador === 'object' &&
      !Array.isArray(obj.saldosPorPagador)
        ? obj.saldosPorPagador
        : {},
    descontos: Array.isArray(obj.descontos) ? obj.descontos : [],
    reembolsos: Array.isArray(obj.reembolsos) ? obj.reembolsos : [],
  };
}

export function lerDadosWallet(): DadosWallet {
  try {
    const bruto = localStorage.getItem(CHAVE_WALLET);
    if (!bruto) {
      return { saldosPorPagador: {}, descontos: [], reembolsos: [] };
    }
    return normalizarWallet(JSON.parse(bruto));
  } catch {
    return { saldosPorPagador: {}, descontos: [], reembolsos: [] };
  }
}

export function salvarDadosWallet(dados: DadosWallet): void {
  localStorage.setItem(CHAVE_WALLET, JSON.stringify(dados));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('bt-wallet-updated'));
}

// --- DESCONTOS (não alteram saldosPorPagador) ---

export function adicionarDescontoWallet(
  dados: Omit<DescontoWallet, 'id' | 'criadoEm'>
): DescontoWallet {
  const wallet = lerDadosWallet();
  const novo: DescontoWallet = {
    ...dados,
    id: crypto.randomUUID(),
    arquivado: Boolean(dados.arquivado),
    criadoEm: new Date().toISOString(),
  };

  salvarDadosWallet({
    ...wallet,
    descontos: [novo, ...wallet.descontos],
  });

  return novo;
}

export function atualizarDescontoWallet(
  id: string,
  dados: Partial<Omit<DescontoWallet, 'id' | 'criadoEm'>>
): void {
  const wallet = lerDadosWallet();
  const agora = new Date().toISOString();

  salvarDadosWallet({
    ...wallet,
    descontos: wallet.descontos.map((item) =>
      item.id === id
        ? { ...item, ...dados, id: item.id, atualizadoEm: agora }
        : item
    ),
  });
}

export function salvarDescontoWalletJson(
  idOriginal: string,
  registroEditado: DescontoWallet
): void {
  const wallet = lerDadosWallet();
  const agora = new Date().toISOString();

  salvarDadosWallet({
    ...wallet,
    descontos: wallet.descontos.map((item) =>
      item.id === idOriginal
        ? {
            ...registroEditado,
            id: String(registroEditado.id || idOriginal),
            atualizadoEm: agora,
          }
        : item
    ),
  });
}

export function alternarArquivamentoDescontoWallet(
  id: string,
  arquivado: boolean
): void {
  atualizarDescontoWallet(id, { arquivado });
}

export function excluirDescontoWallet(id: string): void {
  const wallet = lerDadosWallet();
  salvarDadosWallet({
    ...wallet,
    descontos: wallet.descontos.filter((item) => item.id !== id),
  });
}

// --- REEMBOLSOS (não alteram saldosPorPagador) ---

export function adicionarReembolsoWallet(
  dados: Omit<ReembolsoWallet, 'id' | 'criadoEm'>
): ReembolsoWallet {
  const wallet = lerDadosWallet();
  const novo: ReembolsoWallet = {
    ...dados,
    id: crypto.randomUUID(),
    arquivado: Boolean(dados.arquivado),
    criadoEm: new Date().toISOString(),
  };

  salvarDadosWallet({
    ...wallet,
    reembolsos: [novo, ...wallet.reembolsos],
  });

  return novo;
}

export function atualizarReembolsoWallet(
  id: string,
  dados: Partial<Omit<ReembolsoWallet, 'id' | 'criadoEm'>>
): void {
  const wallet = lerDadosWallet();
  const agora = new Date().toISOString();

  salvarDadosWallet({
    ...wallet,
    reembolsos: wallet.reembolsos.map((item) =>
      item.id === id
        ? { ...item, ...dados, id: item.id, atualizadoEm: agora }
        : item
    ),
  });
}

export function salvarReembolsoWalletJson(
  idOriginal: string,
  registroEditado: ReembolsoWallet
): void {
  const wallet = lerDadosWallet();
  const agora = new Date().toISOString();

  salvarDadosWallet({
    ...wallet,
    reembolsos: wallet.reembolsos.map((item) =>
      item.id === idOriginal
        ? {
            ...registroEditado,
            id: String(registroEditado.id || idOriginal),
            atualizadoEm: agora,
          }
        : item
    ),
  });
}

export function alternarArquivamentoReembolsoWallet(
  id: string,
  arquivado: boolean
): void {
  atualizarReembolsoWallet(id, { arquivado });
}

export function excluirReembolsoWallet(id: string): void {
  const wallet = lerDadosWallet();
  salvarDadosWallet({
    ...wallet,
    reembolsos: wallet.reembolsos.filter((item) => item.id !== id),
  });
}

// --- SALDOS POR PAGADOR ---

export function listarSaldosPagadoresWallet(): PagadorConsolidadoWallet[] {
  const wallet = lerDadosWallet();
  const frigorificos = listarFrigorificos();
  const intermediarios = listarIntermediarios();

  const lista: PagadorConsolidadoWallet[] = [];

  for (const i of intermediarios) {
    const chave = `intermediario:${i.id}`;
    const reg = wallet.saldosPorPagador[chave];
    lista.push({
      chave,
      pagadorTipo: 'intermediario',
      pagadorId: String(i.id),
      nome: i.nome,
      subtitulo: i.cidade ? `${i.cidade}${i.uf ? `/${i.uf}` : ''}` : undefined,
      saldo: typeof reg?.saldo === 'number' ? reg.saldo : 0,
      atualizadoEm: reg?.atualizadoEm,
    });
  }

  for (const f of frigorificos) {
    const chave = `frigorifico:${f.id}`;
    const reg = wallet.saldosPorPagador[chave];
    lista.push({
      chave,
      pagadorTipo: 'frigorifico',
      pagadorId: String(f.id),
      nome: f.nome,
      subtitulo: f.cidade ? `${f.cidade}${f.uf ? `/${f.uf}` : ''}` : undefined,
      saldo: typeof reg?.saldo === 'number' ? reg.saldo : 0,
      atualizadoEm: reg?.atualizadoEm,
    });
  }

  return lista;
}

export function definirSaldoPagadorWallet(
  pagadorTipo: TipoPagadorWallet,
  pagadorId: string,
  novoSaldo: number
): void {
  const wallet = lerDadosWallet();
  const chave = `${pagadorTipo}:${pagadorId}`;
  const valorLimpo = Number.isFinite(novoSaldo)
    ? Number(novoSaldo.toFixed(2))
    : 0;

  salvarDadosWallet({
    ...wallet,
    saldosPorPagador: {
      ...wallet.saldosPorPagador,
      [chave]: {
        pagadorTipo,
        pagadorId: String(pagadorId),
        saldo: valorLimpo,
        atualizadoEm: new Date().toISOString(),
      },
    },
  });
}

export function lerWallet(): { saldo: number } {
  const pagadores = listarSaldosPagadoresWallet();
  const total = pagadores.reduce((acc, item) => acc + item.saldo, 0);
  return { saldo: Number(total.toFixed(2)) };
}