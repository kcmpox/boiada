import {
  listarCaminhoes,
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

export interface SaldoCaminhaoPagadorWallet {
  caminhaoId: string;
  pagadorTipo: TipoPagadorWallet;
  pagadorId: string;
  saldo: number;
  atualizadoEm?: string;
}

export interface DescontoWallet {
  id: string;
  tipo: TipoDescontoWallet;
  caminhaoId: string;
  pagadorTipo: TipoPagadorWallet;
  pagadorId: string;
  data: string;
  descricao: string;
  valor: number;
  arquivado?: boolean;
  pagoEmRecebimentoId?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface ReembolsoWallet {
  id: string;
  tipo?: TipoReembolsoWallet;
  caminhaoId: string;
  pagadorTipo: TipoPagadorWallet;
  pagadorId: string;
  data: string;
  descricao: string;
  valor: number;
  arquivado?: boolean;
  pagoEmRecebimentoId?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface DadosWallet {
  saldosPorCaminhaoPagador: Record<string, SaldoCaminhaoPagadorWallet>;
  descontos: DescontoWallet[];
  reembolsos: ReembolsoWallet[];
}

export interface SaldoConsolidadoWallet {
  chave: string;
  caminhaoId: string;
  caminhaoNome: string;
  pagadorTipo: TipoPagadorWallet;
  pagadorId: string;
  pagadorNome: string;
  subtitulo?: string;
  saldo: number;
  atualizadoEm?: string;
}

const CHAVE_WALLET = 'bt_wallet';

function arredondar2(valor: number): number {
  return Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
}

export function chaveCaminhaoPagadorWallet(
  caminhaoId: string,
  pagadorTipo: TipoPagadorWallet,
  pagadorId: string
): string {
  return `${String(caminhaoId)}::${pagadorTipo}:${String(pagadorId)}`;
}

function normalizarWallet(raw: unknown): DadosWallet {
  if (!raw || typeof raw !== 'object') {
    return { saldosPorCaminhaoPagador: {}, descontos: [], reembolsos: [] };
  }

  const obj = raw as Partial<DadosWallet>;
  return {
    saldosPorCaminhaoPagador:
      obj.saldosPorCaminhaoPagador &&
      typeof obj.saldosPorCaminhaoPagador === 'object' &&
      !Array.isArray(obj.saldosPorCaminhaoPagador)
        ? obj.saldosPorCaminhaoPagador
        : {},
    descontos: Array.isArray(obj.descontos) ? obj.descontos : [],
    reembolsos: Array.isArray(obj.reembolsos) ? obj.reembolsos : [],
  };
}

export function lerDadosWallet(): DadosWallet {
  try {
    const bruto = localStorage.getItem(CHAVE_WALLET);
    if (!bruto) {
      return { saldosPorCaminhaoPagador: {}, descontos: [], reembolsos: [] };
    }
    return normalizarWallet(JSON.parse(bruto));
  } catch {
    return { saldosPorCaminhaoPagador: {}, descontos: [], reembolsos: [] };
  }
}

export function salvarDadosWallet(dados: DadosWallet): void {
  localStorage.setItem(CHAVE_WALLET, JSON.stringify(dados));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('bt-wallet-updated'));
}

export function ajusteWalletEstaPago(id: string): boolean {
  const wallet = lerDadosWallet();
  const desc = wallet.descontos.find((d) => d.id === id);
  if (desc?.pagoEmRecebimentoId) return true;
  const reemb = wallet.reembolsos.find((r) => r.id === id);
  if (reemb?.pagoEmRecebimentoId) return true;
  return false;
}

export function marcarAjustesWalletComoPagos(
  ids: string[],
  recebimentoId: string
): void {
  if (ids.length === 0) return;
  const setIds = new Set(ids.map(String));
  const wallet = lerDadosWallet();
  const agora = new Date().toISOString();

  salvarDadosWallet({
    ...wallet,
    descontos: wallet.descontos.map((d) =>
      setIds.has(String(d.id))
        ? { ...d, pagoEmRecebimentoId: recebimentoId, atualizadoEm: agora }
        : d
    ),
    reembolsos: wallet.reembolsos.map((r) =>
      setIds.has(String(r.id))
        ? { ...r, pagoEmRecebimentoId: recebimentoId, atualizadoEm: agora }
        : r
    ),
  });
}

export function liberarAjustesWalletDoRecebimento(recebimentoId: string): void {
  const wallet = lerDadosWallet();
  const agora = new Date().toISOString();

  salvarDadosWallet({
    ...wallet,
    descontos: wallet.descontos.map((d) =>
      d.pagoEmRecebimentoId === recebimentoId
        ? { ...d, pagoEmRecebimentoId: undefined, atualizadoEm: agora }
        : d
    ),
    reembolsos: wallet.reembolsos.map((r) =>
      r.pagoEmRecebimentoId === recebimentoId
        ? { ...r, pagoEmRecebimentoId: undefined, atualizadoEm: agora }
        : r
    ),
  });
}

// --- DESCONTOS (bloqueados se já pagos) ---

export function adicionarDescontoWallet(
  dados: Omit<DescontoWallet, 'id' | 'criadoEm' | 'pagoEmRecebimentoId'>
): DescontoWallet {
  const wallet = lerDadosWallet();
  const novo: DescontoWallet = {
    ...dados,
    caminhaoId: String(dados.caminhaoId),
    pagadorId: String(dados.pagadorId),
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
  dados: Partial<Omit<DescontoWallet, 'id' | 'criadoEm' | 'pagoEmRecebimentoId'>>
): void {
  if (ajusteWalletEstaPago(id)) return;

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
  if (ajusteWalletEstaPago(idOriginal)) return;

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
  if (ajusteWalletEstaPago(id)) return;
  atualizarDescontoWallet(id, { arquivado });
}

export function excluirDescontoWallet(id: string): void {
  if (ajusteWalletEstaPago(id)) return;

  const wallet = lerDadosWallet();
  salvarDadosWallet({
    ...wallet,
    descontos: wallet.descontos.filter((item) => item.id !== id),
  });
}

// --- REEMBOLSOS (bloqueados se já pagos) ---

export function adicionarReembolsoWallet(
  dados: Omit<ReembolsoWallet, 'id' | 'criadoEm' | 'pagoEmRecebimentoId'>
): ReembolsoWallet {
  const wallet = lerDadosWallet();
  const novo: ReembolsoWallet = {
    ...dados,
    caminhaoId: String(dados.caminhaoId),
    pagadorId: String(dados.pagadorId),
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
  dados: Partial<Omit<ReembolsoWallet, 'id' | 'criadoEm' | 'pagoEmRecebimentoId'>>
): void {
  if (ajusteWalletEstaPago(id)) return;

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
  if (ajusteWalletEstaPago(idOriginal)) return;

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
  if (ajusteWalletEstaPago(id)) return;
  atualizarReembolsoWallet(id, { arquivado });
}

export function excluirReembolsoWallet(id: string): void {
  if (ajusteWalletEstaPago(id)) return;

  const wallet = lerDadosWallet();
  salvarDadosWallet({
    ...wallet,
    reembolsos: wallet.reembolsos.filter((item) => item.id !== id),
  });
}

// --- SALDOS POR CAMINHÃO + PAGADOR ---

export function obterSaldoCaminhaoPagadorWallet(
  caminhaoId: string,
  pagadorTipo: TipoPagadorWallet,
  pagadorId: string
): number {
  if (!caminhaoId || !pagadorId) return 0;
  const wallet = lerDadosWallet();
  const chave = chaveCaminhaoPagadorWallet(caminhaoId, pagadorTipo, pagadorId);
  const entry = wallet.saldosPorCaminhaoPagador[chave];
  return typeof entry?.saldo === 'number' && Number.isFinite(entry.saldo)
    ? arredondar2(entry.saldo)
    : 0;
}

export function definirSaldoCaminhaoPagadorWallet(
  caminhaoId: string,
  pagadorTipo: TipoPagadorWallet,
  pagadorId: string,
  novoSaldo: number
): void {
  if (!caminhaoId || !pagadorId) return;
  const wallet = lerDadosWallet();
  const chave = chaveCaminhaoPagadorWallet(caminhaoId, pagadorTipo, pagadorId);

  salvarDadosWallet({
    ...wallet,
    saldosPorCaminhaoPagador: {
      ...wallet.saldosPorCaminhaoPagador,
      [chave]: {
        caminhaoId: String(caminhaoId),
        pagadorTipo,
        pagadorId: String(pagadorId),
        saldo: arredondar2(novoSaldo),
        atualizadoEm: new Date().toISOString(),
      },
    },
  });
}

export function listarSaldosCaminhaoPagadorWallet(): SaldoConsolidadoWallet[] {
  const wallet = lerDadosWallet();
  const caminhoes = listarCaminhoes();
  const frigorificos = listarFrigorificos();
  const intermediarios = listarIntermediarios();

  const mapaCaminhoes = new Map(
    caminhoes.map((c) => [
      String(c.id),
      c.apelido || c.nome || c.modelo || `Caminhão #${c.id}`,
    ])
  );
  const mapaPagadores = new Map<
    string,
    { nome: string; subtitulo?: string }
  >();

  for (const i of intermediarios) {
    mapaPagadores.set(`intermediario:${i.id}`, {
      nome: i.nome,
      subtitulo: i.cidade ? `${i.cidade}${i.uf ? `/${i.uf}` : ''}` : undefined,
    });
  }
  for (const f of frigorificos) {
    mapaPagadores.set(`frigorifico:${f.id}`, {
      nome: f.nome,
      subtitulo: f.cidade ? `${f.cidade}${f.uf ? `/${f.uf}` : ''}` : undefined,
    });
  }

  return Object.entries(wallet.saldosPorCaminhaoPagador).map(
    ([chave, entry]) => {
      const pagInfo = mapaPagadores.get(
        `${entry.pagadorTipo}:${entry.pagadorId}`
      );
      return {
        chave,
        caminhaoId: String(entry.caminhaoId),
        caminhaoNome:
          mapaCaminhoes.get(String(entry.caminhaoId)) ||
          `Caminhão #${entry.caminhaoId}`,
        pagadorTipo: entry.pagadorTipo,
        pagadorId: String(entry.pagadorId),
        pagadorNome: pagInfo?.nome || String(entry.pagadorId),
        subtitulo: pagInfo?.subtitulo,
        saldo: arredondar2(entry.saldo),
        atualizadoEm: entry.atualizadoEm,
      };
    }
  );
}

export function lerWallet(caminhaoId?: string): { saldo: number } {
  const itens = listarSaldosCaminhaoPagadorWallet().filter(
    (item) => !caminhaoId || String(item.caminhaoId) === String(caminhaoId)
  );
  const total = itens.reduce((acc, item) => acc + item.saldo, 0);
  return { saldo: arredondar2(total) };
}