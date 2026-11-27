import {
  definirSaldoCaminhaoPagadorWallet,
  lerDadosWallet,
  liberarAjustesWalletDoRecebimento,
  marcarAjustesWalletComoPagos,
  obterSaldoCaminhaoPagadorWallet,
} from './walletStorage';

export interface ItemViagemRecebimento {
  viagemId: string;
  dataViagem: string;
  descricaoRota: string;
  tipoGado: string;
  valorEsperado: number;
  valorRecebido: number;
}

export interface ItemDespesaRecebimento {
  despesaId: string;
  tipo: 'abastecimento' | 'manutencao' | 'pedagio';
  data: string;
  descricao: string;
  natureza: 'desconto' | 'ressarcimento';
  valorOriginal: number;
  valorConsiderado: number;
}

export interface ItemAvulsoRecebimento {
  id: string;
  descricao: string;
  natureza: 'desconto' | 'ressarcimento';
  valorOriginal?: number;
  valor: number;
}

export interface RegistroRecebimento {
  id: string;
  dataPagamento: string;
  caminhaoId: string;
  caminhaoNome: string;
  pagadorTipo: 'frigorifico' | 'intermediario';
  pagadorId: string;
  pagadorNome: string;
  viagens: ItemViagemRecebimento[];
  despesas: ItemDespesaRecebimento[];
  avulsos: ItemAvulsoRecebimento[];
  saldoAnteriorPagador: number;
  compensouSaldoAnterior: boolean;
  totalViagensEsperado: number;
  totalViagens: number;
  totalRessarcimentos: number;
  totalDescontos: number;
  valorEsperadoAcerto: number;
  liquidoCalculado: number;
  diferencaAcerto: number;
  valorEfetivamentePago: number;
  novoSaldoPagador: number;
  observacoes?: string;
  arquivado?: boolean;
  criadoEm: string;
  atualizadoEm?: string;
  excluidoEm?: string;
}

export const CHAVE_RECEBIMENTOS = 'bt_recebimentos';
export const CHAVE_RECEBIMENTOS_EXCLUIDOS = 'bt_recebimentos_excluidos';

function gerarId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function arredondar2(valor: number): number {
  return Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
}

export function obterSaldoCaminhaoPagadorNaCarteira(
  caminhaoId: string,
  pagadorTipo: 'frigorifico' | 'intermediario',
  pagadorId: string
): number {
  return obterSaldoCaminhaoPagadorWallet(caminhaoId, pagadorTipo, pagadorId);
}

export function obterSaldoPagadorNaCarteira(
  pagadorTipo: 'frigorifico' | 'intermediario',
  pagadorId: string,
  caminhaoId = ''
): number {
  return obterSaldoCaminhaoPagadorWallet(caminhaoId, pagadorTipo, pagadorId);
}

function notificarAtualizacoes(): void {
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('bt-wallet-updated'));
  window.dispatchEvent(new Event('bt-recebimentos-updated'));
}

export function listarRecebimentos(): RegistroRecebimento[] {
  try {
    const bruto = localStorage.getItem(CHAVE_RECEBIMENTOS);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? (parsed as RegistroRecebimento[]) : [];
  } catch {
    return [];
  }
}

export function listarRecebimentosExcluidos(): RegistroRecebimento[] {
  try {
    const bruto = localStorage.getItem(CHAVE_RECEBIMENTOS_EXCLUIDOS);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? (parsed as RegistroRecebimento[]) : [];
  } catch {
    return [];
  }
}

function salvarRecebimentoExcluido(rec: RegistroRecebimento): void {
  const existentes = listarRecebimentosExcluidos().filter(
    (item) => String(item.id) !== String(rec.id)
  );
  const registroFantasma: RegistroRecebimento = {
    ...rec,
    excluidoEm: new Date().toISOString(),
  };
  localStorage.setItem(
    CHAVE_RECEBIMENTOS_EXCLUIDOS,
    JSON.stringify([registroFantasma, ...existentes])
  );
}

export function obterUltimoRecebimentoId(): string | null {
  const todos = listarRecebimentos();
  if (todos.length === 0) return null;
  const ordenados = [...todos].sort((a, b) =>
    (b.criadoEm || b.dataPagamento || '').localeCompare(
      a.criadoEm || a.dataPagamento || ''
    )
  );
  return ordenados[0]?.id ?? null;
}

export function listarIdsViagensJaRecebidas(): Set<string> {
  const todos = listarRecebimentos().filter((r) => !r.arquivado);
  const ids = new Set<string>();
  for (const rec of todos) {
    for (const v of rec.viagens || []) {
      ids.add(String(v.viagemId));
    }
  }
  return ids;
}

export function listarIdsDespesasJaAcertadas(): Set<string> {
  const todos = listarRecebimentos().filter((r) => !r.arquivado);
  const ids = new Set<string>();
  for (const rec of todos) {
    for (const d of rec.despesas || []) {
      const ref = String(d.despesaId);
      ids.add(ref);
      const prefixoRegistro = ref.split('::')[0];
      if (prefixoRegistro) ids.add(prefixoRegistro);
    }
  }
  return ids;
}

export function listarIdsReembolsosEDescontosJaPagos(): Set<string> {
  const todos = listarRecebimentos().filter((r) => !r.arquivado);
  const ids = new Set<string>();
  for (const rec of todos) {
    for (const av of rec.avulsos || []) {
      if (av.id) ids.add(String(av.id));
    }
  }
  const wallet = lerDadosWallet();
  for (const d of wallet.descontos) {
    if (d.pagoEmRecebimentoId) ids.add(String(d.id));
  }
  for (const r of wallet.reembolsos) {
    if (r.pagoEmRecebimentoId) ids.add(String(r.id));
  }
  return ids;
}

export function viagemJaFoiPaga(viagemId: string): boolean {
  return listarIdsViagensJaRecebidas().has(String(viagemId));
}

export function despesaJaFoiPaga(despesaId: string): boolean {
  return listarIdsDespesasJaAcertadas().has(String(despesaId));
}

export function ajusteWalletJaFoiPago(ajusteId: string): boolean {
  return listarIdsReembolsosEDescontosJaPagos().has(String(ajusteId));
}

export function registrarRecebimento(
  novo: Omit<RegistroRecebimento, 'id' | 'criadoEm'>
): RegistroRecebimento {
  const registro: RegistroRecebimento = {
    ...novo,
    arquivado: false,
    id: gerarId(),
    criadoEm: new Date().toISOString(),
  };

  const atuais = listarRecebimentos();
  localStorage.setItem(
    CHAVE_RECEBIMENTOS,
    JSON.stringify([registro, ...atuais])
  );

  definirSaldoCaminhaoPagadorWallet(
    novo.caminhaoId,
    novo.pagadorTipo,
    novo.pagadorId,
    novo.novoSaldoPagador
  );

  const idsAvulsos = (novo.avulsos || []).map((a) => String(a.id)).filter(Boolean);
  marcarAjustesWalletComoPagos(idsAvulsos, registro.id);

  notificarAtualizacoes();
  return registro;
}

export function atualizarRecebimento(
  id: string,
  dados: Omit<RegistroRecebimento, 'id' | 'criadoEm'>
): RegistroRecebimento | undefined {
  const atuais = listarRecebimentos();
  let atualizado: RegistroRecebimento | undefined;

  const novaLista = atuais.map((item) => {
    if (String(item.id) !== String(id)) return item;
    atualizado = {
      ...item,
      ...dados,
      id: item.id,
      criadoEm: item.criadoEm,
      atualizadoEm: new Date().toISOString(),
    };
    return atualizado;
  });

  if (atualizado) {
    localStorage.setItem(CHAVE_RECEBIMENTOS, JSON.stringify(novaLista));
    liberarAjustesWalletDoRecebimento(id);
    if (!atualizado.arquivado) {
      definirSaldoCaminhaoPagadorWallet(
        atualizado.caminhaoId,
        atualizado.pagadorTipo,
        atualizado.pagadorId,
        atualizado.novoSaldoPagador
      );
      const idsAvulsos = (atualizado.avulsos || [])
        .map((a) => String(a.id))
        .filter(Boolean);
      marcarAjustesWalletComoPagos(idsAvulsos, id);
    }
    notificarAtualizacoes();
  }

  return atualizado;
}

export function alternarArquivamentoRecebimento(
  id: string,
  arquivado: boolean
): void {
  const atuais = listarRecebimentos();
  const alvo = atuais.find((item) => String(item.id) === String(id));
  if (!alvo) return;

  const novaLista = atuais.map((item) =>
    String(item.id) === String(id)
      ? { ...item, arquivado, atualizadoEm: new Date().toISOString() }
      : item
  );
  localStorage.setItem(CHAVE_RECEBIMENTOS, JSON.stringify(novaLista));

  if (arquivado) {
    liberarAjustesWalletDoRecebimento(id);
  } else {
    const idsAvulsos = (alvo.avulsos || [])
      .map((a) => String(a.id))
      .filter(Boolean);
    marcarAjustesWalletComoPagos(idsAvulsos, id);
  }

  const ultimoId = obterUltimoRecebimentoId();
  if (ultimoId && String(ultimoId) === String(id)) {
    const saldoAtual = obterSaldoCaminhaoPagadorNaCarteira(
      alvo.caminhaoId,
      alvo.pagadorTipo,
      alvo.pagadorId
    );
    const variacao = arredondar2(
      arredondar2(alvo.novoSaldoPagador || 0) -
        arredondar2(alvo.saldoAnteriorPagador || 0)
    );
    const saldoAlvo = arquivado
      ? arredondar2(saldoAtual - variacao)
      : arredondar2(saldoAtual + variacao);

    definirSaldoCaminhaoPagadorWallet(
      alvo.caminhaoId,
      alvo.pagadorTipo,
      alvo.pagadorId,
      saldoAlvo
    );
  }

  notificarAtualizacoes();
}

export function calcularSaldoCarteiraAposExclusao(
  rec: RegistroRecebimento
): number {
  const saldoAtual = obterSaldoCaminhaoPagadorNaCarteira(
    rec.caminhaoId,
    rec.pagadorTipo,
    rec.pagadorId
  );

  if (rec.arquivado) {
    return saldoAtual;
  }

  const variacao = arredondar2(
    arredondar2(rec.novoSaldoPagador || 0) -
      arredondar2(rec.saldoAnteriorPagador || 0)
  );

  return arredondar2(saldoAtual - variacao);
}

export function excluirRecebimento(id: string): boolean {
  const atuais = listarRecebimentos();
  const alvo = atuais.find((item) => String(item.id) === String(id));
  if (!alvo) return false;

  const saldoRestaurado = calcularSaldoCarteiraAposExclusao(alvo);

  salvarRecebimentoExcluido(alvo);

  const restante = atuais.filter((item) => String(item.id) !== String(id));
  localStorage.setItem(CHAVE_RECEBIMENTOS, JSON.stringify(restante));

  liberarAjustesWalletDoRecebimento(id);
  definirSaldoCaminhaoPagadorWallet(
    alvo.caminhaoId,
    alvo.pagadorTipo,
    alvo.pagadorId,
    saldoRestaurado
  );

  notificarAtualizacoes();
  return true;
}

export function excluirUltimoRecebimento(id?: string): boolean {
  const atuais = listarRecebimentos();
  if (atuais.length === 0) return false;

  const ultimoId = obterUltimoRecebimentoId();
  const idAlvo = id ? String(id) : ultimoId;
  if (!idAlvo || String(idAlvo) !== String(ultimoId)) {
    return false;
  }

  return excluirRecebimento(idAlvo);
}