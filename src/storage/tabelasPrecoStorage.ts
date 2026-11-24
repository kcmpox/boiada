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

export interface RegraRecebimentoCiclo {
  id: string;
  tipoGado: TipoGadoTabela;
  diaInicio: number; // 1 a 31
  diaFim: number; // 1 a 31
  diaRecebimento: number; // 1 a 31
  mesRecebimento: MesRecebimentoRegra;
}

export interface TabelaPrecoEntidade {
  id: string;
  entidadeTipo: TipoEntidadeTabela;
  entidadeId: string;
  baseKm: BaseQuilometragemTabela;
  dataCriacao: string;
  dataAtualizacao: string;
  observacoes: string;
  faixas: FaixaPrecoKm[];
  regraPorKm: {
    ativa: boolean;
    aPartirDeKm: number;
    valorPorKm: number;
  };
  carretaAlugada: {
    ativa: boolean;
    percentual: number;
  };
  regrasRecebimento: RegraRecebimentoCiclo[];
}

export interface RegistroHistoricoTabela {
  id: string;
  entidadeTipo: TipoEntidadeTabela;
  entidadeId: string;
  dataInicioVigencia: string;
  dataArquivamento: string;
  motivoReajuste: string;
  tabela: TabelaPrecoEntidade;
}

const STORAGE_VIGENTES = 'bt_tabelas_preco_vigentes';
const STORAGE_HISTORICO = 'bt_tabelas_preco_historico';

function normalizarTabela(t: Partial<TabelaPrecoEntidade>): TabelaPrecoEntidade {
  const agora = new Date().toISOString();
  return {
    id: t.id || crypto.randomUUID(),
    entidadeTipo: t.entidadeTipo || 'intermediario',
    entidadeId: t.entidadeId || '',
    baseKm: t.baseKm || 'ida_volta',
    dataCriacao: t.dataCriacao || t.dataAtualizacao || agora,
    dataAtualizacao: t.dataAtualizacao || agora,
    observacoes: t.observacoes || '',
    faixas: Array.isArray(t.faixas) ? t.faixas : [],
    regraPorKm: {
      ativa: t.regraPorKm?.ativa ?? true,
      aPartirDeKm: Number(t.regraPorKm?.aPartirDeKm) || 0,
      valorPorKm: Number(t.regraPorKm?.valorPorKm) || 0,
    },
    carretaAlugada: {
      ativa: t.carretaAlugada?.ativa ?? false,
      percentual: Number(t.carretaAlugada?.percentual) || 0,
    },
    regrasRecebimento: Array.isArray(t.regrasRecebimento)
      ? t.regrasRecebimento
      : [],
  };
}

function lerTodasVigentes(): TabelaPrecoEntidade[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_VIGENTES) || '[]');
    return Array.isArray(raw) ? raw.map(normalizarTabela) : [];
  } catch {
    return [];
  }
}

function lerTodoHistorico(): RegistroHistoricoTabela[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_HISTORICO) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function obterTabelaPreco(
  entidadeTipo: TipoEntidadeTabela,
  entidadeId: string
): TabelaPrecoEntidade | null {
  const todas = lerTodasVigentes();
  return (
    todas.find(
      (t) => t.entidadeTipo === entidadeTipo && t.entidadeId === entidadeId
    ) || null
  );
}

export function buscarTabelaPorId(tabelaId: string): TabelaPrecoEntidade | null {
  const vigente = lerTodasVigentes().find((t) => t.id === tabelaId);
  if (vigente) return vigente;

  const noHistorico = lerTodoHistorico().find((h) => h.id === tabelaId);
  if (noHistorico) return normalizarTabela(noHistorico.tabela);

  return null;
}

export function salvarTabelaPreco(
  novaTabela: TabelaPrecoEntidade,
  modo: 'corrigir' | 'reajuste' = 'corrigir',
  motivoReajuste = ''
): TabelaPrecoEntidade {
  const todasVigentes = lerTodasVigentes();
  const anterior = todasVigentes.find(
    (t) =>
      t.entidadeTipo === novaTabela.entidadeTipo &&
      t.entidadeId === novaTabela.entidadeId
  );

  const agora = new Date().toISOString();
  let tabelaFinal: TabelaPrecoEntidade;

  if (modo === 'reajuste' && anterior) {
    const historicoAtual = lerTodoHistorico();
    const registroArquivado: RegistroHistoricoTabela = {
      id: anterior.id,
      entidadeTipo: anterior.entidadeTipo,
      entidadeId: anterior.entidadeId,
      dataInicioVigencia: anterior.dataCriacao || anterior.dataAtualizacao,
      dataArquivamento: agora,
      motivoReajuste: motivoReajuste.trim() || 'Reajuste de tabela',
      tabela: anterior,
    };
    localStorage.setItem(
      STORAGE_HISTORICO,
      JSON.stringify([registroArquivado, ...historicoAtual])
    );

    tabelaFinal = {
      ...novaTabela,
      id: crypto.randomUUID(),
      dataCriacao: agora,
      dataAtualizacao: agora,
    };
  } else {
    tabelaFinal = {
      ...novaTabela,
      id: anterior?.id || novaTabela.id || crypto.randomUUID(),
      dataCriacao: anterior?.dataCriacao || novaTabela.dataCriacao || agora,
      dataAtualizacao: agora,
    };
  }

  const outrasVigentes = todasVigentes.filter(
    (t) =>
      !(
        t.entidadeTipo === tabelaFinal.entidadeTipo &&
        t.entidadeId === tabelaFinal.entidadeId
      )
  );
  localStorage.setItem(
    STORAGE_VIGENTES,
    JSON.stringify([tabelaFinal, ...outrasVigentes])
  );

  return tabelaFinal;
}

export function listarHistoricoTabelas(
  entidadeTipo: TipoEntidadeTabela,
  entidadeId: string
): RegistroHistoricoTabela[] {
  return lerTodoHistorico().filter(
    (h) => h.entidadeTipo === entidadeTipo && h.entidadeId === entidadeId
  );
}

export function excluirRegistroHistorico(historicoId: string): void {
  const filtrados = lerTodoHistorico().filter((h) => h.id !== historicoId);
  localStorage.setItem(STORAGE_HISTORICO, JSON.stringify(filtrados));
}

export function restaurarTabelaDoHistorico(
  registro: RegistroHistoricoTabela
): TabelaPrecoEntidade {
  const restaurada: TabelaPrecoEntidade = {
    ...normalizarTabela(registro.tabela),
    id: crypto.randomUUID(),
    dataCriacao: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
  };

  return salvarTabelaPreco(
    restaurada,
    'reajuste',
    `Restaurada versão arquivada em ${new Date(registro.dataArquivamento).toLocaleDateString('pt-BR')}`
  );
}

export function calcularFretePelaTabela(
  tabela: TabelaPrecoEntidade,
  kmUmaPerna: number
): {
  valor: number;
  valorAluguelCarreta: number;
  percentualAluguel: number;
  kmConsiderado: number;
  regraAplicada: string;
} | null {
  if (kmUmaPerna <= 0) return null;

  const kmConsiderado =
    tabela.baseKm === 'ida_volta'
      ? Number((kmUmaPerna * 2).toFixed(4))
      : kmUmaPerna;

  const sufixoBase =
    tabela.baseKm === 'ida_volta'
      ? `(${kmUmaPerna} km ida × 2 = ${kmConsiderado} km ida/volta)`
      : `(${kmConsiderado} km só ida)`;

  const montarRetorno = (valorBruto: number, regraAplicada: string) => {
    const perc = tabela.carretaAlugada?.ativa
      ? tabela.carretaAlugada.percentual
      : 0;
    const valorAluguelCarreta =
      perc > 0 ? Number(((valorBruto * perc) / 100).toFixed(2)) : 0;

    return {
      valor: valorBruto,
      valorAluguelCarreta,
      percentualAluguel: perc,
      kmConsiderado,
      regraAplicada,
    };
  };

  const faixasOrdenadas = [...tabela.faixas].sort(
    (a, b) => a.kmFinal - b.kmFinal
  );

  if (faixasOrdenadas.length > 0) {
    const menorPiso = Math.min(...faixasOrdenadas.map((f) => f.kmInicial));

    if (kmConsiderado >= menorPiso) {
      const faixaEncontrada = faixasOrdenadas.find(
        (f) => kmConsiderado <= f.kmFinal
      );

      if (faixaEncontrada) {
        return montarRetorno(
          faixaEncontrada.valorFixo,
          `Faixa fechada (${faixaEncontrada.kmInicial} km até ${faixaEncontrada.kmFinal} km) ${sufixoBase}`
        );
      }
    }
  }

  if (
    tabela.regraPorKm.ativa &&
    kmConsiderado > tabela.regraPorKm.aPartirDeKm
  ) {
    return montarRetorno(
      kmConsiderado * tabela.regraPorKm.valorPorKm,
      `Acima de ${tabela.regraPorKm.aPartirDeKm} km: ${kmConsiderado} km × R$ ${tabela.regraPorKm.valorPorKm.toFixed(2)} ${sufixoBase}`
    );
  }

  return null;
}

/**
 * Calcula a data prevista de recebimento (YYYY-MM-DD) com base na data da viagem,
 * no tipo de gado ('boi_gordo' ou 'boi_magro') e nas regras de ciclo da tabela.
 */
export function calcularDataRecebimento(
  tabela: TabelaPrecoEntidade,
  dataViagemIso: string,
  tipoGado: TipoGadoTabela
): { dataRecebimentoIso: string; descricaoRegra: string } | null {
  if (!dataViagemIso || !tabela.regrasRecebimento?.length) return null;

  const [anoStr, mesStr, diaStr] = dataViagemIso.split('-');
  const ano = Number(anoStr);
  const mes = Number(mesStr); // 1 a 12
  const dia = Number(diaStr);

  if (!ano || !mes || !dia) return null;

  const regra = tabela.regrasRecebimento.find(
    (r) =>
      r.tipoGado === tipoGado && dia >= r.diaInicio && dia <= r.diaFim
  );

  if (!regra) return null;

  let anoDestino = ano;
  let mesDestino = mes; // 1 a 12

  if (regra.mesRecebimento === 'mes_seguinte') {
    mesDestino += 1;
    if (mesDestino > 12) {
      mesDestino = 1;
      anoDestino += 1;
    }
  }

  // Garante que dias como 31 não ultrapassem o último dia do mês destino (ex: fevereiro)
  const ultimoDiaDoMesDestino = new Date(anoDestino, mesDestino, 0).getDate();
  const diaFinal = Math.min(regra.diaRecebimento, ultimoDiaDoMesDestino);

  const dataRecebimentoIso = `${String(anoDestino).padStart(4, '0')}-${String(
    mesDestino
  ).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;

  const descricaoRegra = `Viagens dia ${regra.diaInicio} a ${regra.diaFim} → paga dia ${regra.diaRecebimento} (${
    regra.mesRecebimento === 'mesmo_mes' ? 'mesmo mês' : 'mês seguinte'
  })`;

  return { dataRecebimentoIso, descricaoRegra };
}