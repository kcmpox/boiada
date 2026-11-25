export type TipoEntidadeTabela = 'frigorifico' | 'intermediario';
export type BaseQuilometragemTabela = 'ida_volta' | 'so_ida';
export type TipoGadoTabela = 'boi_gordo' | 'boi_magro';
export type MesRecebimentoRegra = 'mesmo_mes' | 'mes_seguinte';

export interface FaixaPrecoKm {
  id: string;
  kmInicial: number;
  kmFinal: number;
  valorFixo: number;
}

export interface RegraPorKm {
  ativa: boolean;
  aPartirDeKm: number;
  valorPorKm: number;
}

export interface ConfigCarretaAlugada {
  ativa: boolean;
  percentual: number;
}

export interface RegraRecebimentoCiclo {
  id: string;
  tipoGado: TipoGadoTabela;
  diaInicio: number;
  diaFim: number;
  diaRecebimento: number;
  mesRecebimento: MesRecebimentoRegra;
}

export interface TabelaPrecoEntidade {
  id: string;
  entidadeTipo: TipoEntidadeTabela;
  entidadeId: string;
  baseKm: BaseQuilometragemTabela;
  dataCriacao: string;
  dataAtualizacao: string;
  observacoes?: string;
  faixas: FaixaPrecoKm[];
  regraPorKm: RegraPorKm;
  carretaAlugada: ConfigCarretaAlugada;
  taxasAluguelPorCaminhao?: Record<string, ConfigCarretaAlugada>;
  regrasRecebimento?: RegraRecebimentoCiclo[];
}

export interface HistoricoTabelaPrecoItem {
  id: string;
  entidadeTipo: TipoEntidadeTabela;
  entidadeId: string;
  dataInicioVigencia?: string;
  dataArquivamento: string;
  motivo?: string;
  motivoReajuste?: string;
  tabela: TabelaPrecoEntidade;
}

export interface ResultadoCalculoFrete {
  valor: number;
  kmUtilizado: number;
  baseKm: BaseQuilometragemTabela;
  regraAplicada: string;
  percentualAluguel: number;
  valorAluguelCarreta: number;
  origemTaxaAluguel: 'caminhao' | 'tabela' | 'nenhum';
}

export interface ResultadoCalculoDataRecebimento {
  dataRecebimentoIso: string;
  descricaoRegra: string;
}

const CHAVE_TABELAS = 'bt_tabelas_preco';
const CHAVE_HISTORICO_TABELAS = 'bt_tabelas_preco_historico';

function lerMapaTabelas(): Record<string, TabelaPrecoEntidade> {
  try {
    const bruto = localStorage.getItem(CHAVE_TABELAS);
    if (!bruto) return {};
    const parsed = JSON.parse(bruto);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function escreverMapaTabelas(mapa: Record<string, TabelaPrecoEntidade>): void {
  localStorage.setItem(CHAVE_TABELAS, JSON.stringify(mapa));
  window.dispatchEvent(new Event('storage'));
}

function lerTodosHistoricosBrutos(): HistoricoTabelaPrecoItem[] {
  try {
    const bruto = localStorage.getItem(CHAVE_HISTORICO_TABELAS);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function escreverHistoricosBrutos(itens: HistoricoTabelaPrecoItem[]): void {
  localStorage.setItem(CHAVE_HISTORICO_TABELAS, JSON.stringify(itens));
  window.dispatchEvent(new Event('storage'));
}

export function obterTabelaPreco(
  entidadeTipo: TipoEntidadeTabela,
  entidadeId: string
): TabelaPrecoEntidade | null {
  const mapa = lerMapaTabelas();
  const chave = `${entidadeTipo}:${entidadeId}`;
  const tab = mapa[chave];
  if (!tab) return null;

  return {
    ...tab,
    baseKm: tab.baseKm || 'ida_volta',
    faixas: Array.isArray(tab.faixas) ? tab.faixas : [],
    regraPorKm: tab.regraPorKm || {
      ativa: false,
      aPartirDeKm: 0,
      valorPorKm: 0,
    },
    carretaAlugada: tab.carretaAlugada || { ativa: false, percentual: 0 },
    taxasAluguelPorCaminhao:
      tab.taxasAluguelPorCaminhao &&
      typeof tab.taxasAluguelPorCaminhao === 'object'
        ? tab.taxasAluguelPorCaminhao
        : {},
    regrasRecebimento: Array.isArray(tab.regrasRecebimento)
      ? tab.regrasRecebimento
      : [],
  };
}

export function listarHistoricoTabelas(
  entidadeTipo?: TipoEntidadeTabela,
  entidadeId?: string
): HistoricoTabelaPrecoItem[] {
  return lerTodosHistoricosBrutos().filter((item) => {
    if (entidadeTipo && item.entidadeTipo !== entidadeTipo) return false;
    if (entidadeId && String(item.entidadeId) !== String(entidadeId)) {
      return false;
    }
    return true;
  });
}

export function excluirRegistroHistorico(id: string): void {
  const atual = lerTodosHistoricosBrutos();
  const filtrada = atual.filter((item) => String(item.id) !== String(id));
  escreverHistoricosBrutos(filtrada);
}

export function restaurarTabelaDoHistorico(
  historicoId: string
): TabelaPrecoEntidade | null {
  const historicos = lerTodosHistoricosBrutos();
  const alvo = historicos.find((h) => String(h.id) === String(historicoId));
  if (!alvo || !alvo.tabela) return null;

  const mapa = lerMapaTabelas();
  const chave = `${alvo.entidadeTipo}:${alvo.entidadeId}`;
  const vigenteAtual = mapa[chave];
  const agora = new Date().toISOString();

  const proximoHistorico = historicos.filter(
    (h) => String(h.id) !== String(historicoId)
  );

  if (vigenteAtual) {
    proximoHistorico.unshift({
      id: crypto.randomUUID(),
      entidadeTipo: vigenteAtual.entidadeTipo,
      entidadeId: vigenteAtual.entidadeId,
      dataInicioVigencia: vigenteAtual.dataCriacao,
      dataArquivamento: agora,
      motivo: 'Substituída por restauração do histórico',
      motivoReajuste: 'Substituída por restauração do histórico',
      tabela: vigenteAtual,
    });
  }

  const restaurada: TabelaPrecoEntidade = {
    ...alvo.tabela,
    id: crypto.randomUUID(),
    entidadeTipo: alvo.entidadeTipo,
    entidadeId: String(alvo.entidadeId),
    dataCriacao: agora,
    dataAtualizacao: agora,
  };

  mapa[chave] = restaurada;
  escreverHistoricosBrutos(proximoHistorico);
  escreverMapaTabelas(mapa);

  return restaurada;
}

function anexarHistorico(item: HistoricoTabelaPrecoItem): void {
  const atual = lerTodosHistoricosBrutos();
  escreverHistoricosBrutos([item, ...atual]);
}

export function salvarTabelaPreco(
  tabela: TabelaPrecoEntidade,
  modo: 'corrigir' | 'reajuste' = 'corrigir',
  motivo?: string
): TabelaPrecoEntidade {
  const mapa = lerMapaTabelas();
  const chave = `${tabela.entidadeTipo}:${tabela.entidadeId}`;
  const anterior = mapa[chave];
  const agora = new Date().toISOString();

  if (anterior && modo === 'reajuste') {
    const motivoLimpo = motivo?.trim() || 'Reajuste de tabela';
    anexarHistorico({
      id: crypto.randomUUID(),
      entidadeTipo: anterior.entidadeTipo,
      entidadeId: anterior.entidadeId,
      dataInicioVigencia: anterior.dataCriacao,
      dataArquivamento: agora,
      motivo: motivoLimpo,
      motivoReajuste: motivoLimpo,
      tabela: anterior,
    });

    const novaTabela: TabelaPrecoEntidade = {
      ...tabela,
      id: crypto.randomUUID(),
      dataCriacao: agora,
      dataAtualizacao: agora,
    };
    mapa[chave] = novaTabela;
    escreverMapaTabelas(mapa);
    return novaTabela;
  }

  const atualizada: TabelaPrecoEntidade = {
    ...tabela,
    id: anterior?.id || tabela.id || crypto.randomUUID(),
    dataCriacao: anterior?.dataCriacao || tabela.dataCriacao || agora,
    dataAtualizacao: agora,
  };
  mapa[chave] = atualizada;
  escreverMapaTabelas(mapa);
  return atualizada;
}

export function resolverTaxaAluguelCaminhao(
  tabela: TabelaPrecoEntidade,
  caminhaoId?: string
): {
  percentual: number;
  origem: 'caminhao' | 'tabela' | 'nenhum';
} {
  if (caminhaoId && tabela.taxasAluguelPorCaminhao) {
    const configCam = tabela.taxasAluguelPorCaminhao[String(caminhaoId)];
    if (configCam && configCam.ativa && configCam.percentual > 0) {
      return {
        percentual: Number(configCam.percentual),
        origem: 'caminhao',
      };
    }
  }

  if (tabela.carretaAlugada?.ativa && tabela.carretaAlugada.percentual > 0) {
    return {
      percentual: Number(tabela.carretaAlugada.percentual),
      origem: 'tabela',
    };
  }

  return { percentual: 0, origem: 'nenhum' };
}

export function calcularFretePelaTabela(
  tabela: TabelaPrecoEntidade,
  kmIda: number,
  caminhaoId?: string
): ResultadoCalculoFrete | null {
  if (!Number.isFinite(kmIda) || kmIda <= 0) return null;

  const baseKm = tabela.baseKm || 'ida_volta';
  const kmUtilizado =
    baseKm === 'ida_volta' ? Number((kmIda * 2).toFixed(4)) : Number(kmIda);

  const taxa = resolverTaxaAluguelCaminhao(tabela, caminhaoId);

  const regraKm = tabela.regraPorKm;
  if (
    regraKm &&
    regraKm.ativa &&
    regraKm.valorPorKm > 0 &&
    kmUtilizado > regraKm.aPartirDeKm
  ) {
    const valorBruto = Number((kmUtilizado * regraKm.valorPorKm).toFixed(2));
    const valorAluguelCarreta = Number(
      ((valorBruto * taxa.percentual) / 100).toFixed(2)
    );

    return {
      valor: valorBruto,
      kmUtilizado,
      baseKm,
      regraAplicada: `Acima de ${regraKm.aPartirDeKm} km: ${kmUtilizado} km × R$ ${regraKm.valorPorKm.toFixed(2)}`,
      percentualAluguel: taxa.percentual,
      valorAluguelCarreta,
      origemTaxaAluguel: taxa.origem,
    };
  }

  const faixasOrdenadas = [...(tabela.faixas || [])].sort(
    (a, b) => a.kmFinal - b.kmFinal
  );

  for (const faixa of faixasOrdenadas) {
    if (kmUtilizado >= faixa.kmInicial && kmUtilizado <= faixa.kmFinal) {
      const valorBruto = Number(faixa.valorFixo.toFixed(2));
      const valorAluguelCarreta = Number(
        ((valorBruto * taxa.percentual) / 100).toFixed(2)
      );

      return {
        valor: valorBruto,
        kmUtilizado,
        baseKm,
        regraAplicada: `Faixa ${faixa.kmInicial} a ${faixa.kmFinal} km (${
          baseKm === 'ida_volta' ? 'Ida e Volta' : 'Só Ida'
        })`,
        percentualAluguel: taxa.percentual,
        valorAluguelCarreta,
        origemTaxaAluguel: taxa.origem,
      };
    }
  }

  return null;
}

export function calcularDataRecebimento(
  tabela: TabelaPrecoEntidade,
  dataViagemIso: string,
  tipoGado: TipoGadoTabela
): ResultadoCalculoDataRecebimento | null {
  if (!dataViagemIso) return null;
  const partes = dataViagemIso.split('-').map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;

  const [ano, mes, dia] = partes;
  const regras = (tabela.regrasRecebimento || []).filter(
    (r) => r.tipoGado === tipoGado
  );

  const regraEncontrada = regras.find(
    (r) => dia >= r.diaInicio && dia <= r.diaFim
  );
  if (!regraEncontrada) return null;

  let anoAlvo = ano;
  let mesAlvo = mes;

  if (regraEncontrada.mesRecebimento === 'mes_seguinte') {
    mesAlvo += 1;
    if (mesAlvo > 12) {
      mesAlvo = 1;
      anoAlvo += 1;
    }
  }

  const ultimoDiaMesAlvo = new Date(anoAlvo, mesAlvo, 0).getDate();
  const diaFinal = Math.min(regraEncontrada.diaRecebimento, ultimoDiaMesAlvo);

  const isoFinal = `${String(anoAlvo).padStart(4, '0')}-${String(
    mesAlvo
  ).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;

  return {
    dataRecebimentoIso: isoFinal,
    descricaoRegra: `Viagem dia ${dia} (${
      tipoGado === 'boi_gordo' ? 'Boi Gordo' : 'Boi Magro'
    }) → Dia ${regraEncontrada.diaRecebimento} ${
      regraEncontrada.mesRecebimento === 'mesmo_mes'
        ? 'do mesmo mês'
        : 'do mês seguinte'
    }`,
  };
}