import {
  listarIdsReembolsosEDescontosJaPagos,
  type RegistroRecebimento,
} from '../../../../storage/recebimentosStorage';
import {
  listarFrigorificos,
  listarIntermediarios,
} from '../../../../storage/cadastrosStorage';
import { lerDadosWallet } from '../../../../storage/walletStorage';
import type {
  ItemPrevisaoCarteira,
  PayloadGeracaoPdfFinanceiro,
} from '../../../../utils/pdfFinanceiroGenerator';

export interface FiltroInicialRecebimentosPDF {
  dataInicio: string;
  dataFim: string;
  caminhaoId: string;
  pagadorChave: string;
}

export interface CaminhaoFiltroOption {
  id: string;
  nome: string;
}

export interface PagadorFiltroOption {
  chave: string;
  nome: string;
}

export interface RegraPagamentoTabela {
  diaInicio: number;
  diaFim: number;
  diaPagamento: number;
  mesPagamento: 'mesmo_mes' | 'mes_seguinte';
}

export interface OpcaoDataPrevisao {
  chave: string;
  dataAlvoIso: string;
  periodoInicioIso: string;
  periodoFimIso: string;
  diaPagamento: number;
  descricaoRegra: string;
}

export interface ItemCarteiraComFiltros extends ItemPrevisaoCarteira {
  pagadorChave: string;
  caminhaoId: string;
}

export interface PropsPainelRelatorio {
  payload: PayloadGeracaoPdfFinanceiro | null;
  onPayloadChange: (payload: PayloadGeracaoPdfFinanceiro | null) => void;
  onFiltrosAtivosChange: (ativos: boolean) => void;
  sinalLimpar?: number;
}

export function formatarMoedaPdf(valor: number): string {
  const limpo = Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
  return limpo.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function ultimoDiaDoMes(ano: number, mesZeroBased: number): number {
  return new Date(ano, mesZeroBased + 1, 0).getDate();
}

export function montarIsoData(
  ano: number,
  mesZeroBased: number,
  dia: number
): string {
  const maxDia = ultimoDiaDoMes(ano, mesZeroBased);
  const diaSeguro = Math.min(Math.max(1, dia), maxDia);
  const mm = String(mesZeroBased + 1).padStart(2, '0');
  const dd = String(diaSeguro).padStart(2, '0');
  return `${ano}-${mm}-${dd}`;
}

export function extrairRegrasPagamentoDasTabelas(): RegraPagamentoTabela[] {
  const regras: RegraPagamentoTabela[] = [];

  const inspecionarObjeto = (obj: Record<string, unknown>) => {
    const listas = [
      obj.regrasRecebimento,
      obj.datasRecebimento,
      obj.regrasPagamento,
      obj.prazosRecebimento,
      obj.faixasRecebimento,
    ];
    for (const lista of listas) {
      if (!Array.isArray(lista)) continue;
      for (const item of lista) {
        if (!item || typeof item !== 'object') continue;
        const r = item as Record<string, unknown>;
        const diaInicio = Number(r.diaInicio ?? r.deDia ?? r.inicio ?? 0);
        const diaFim = Number(r.diaFim ?? r.ateDia ?? r.fim ?? 0);
        const diaPagamento = Number(
          r.diaPagamento ?? r.diaRecebimento ?? r.recebeDia ?? 0
        );
        if (diaInicio > 0 && diaFim > 0 && diaPagamento > 0) {
          const mesRaw = String(
            r.mesPagamento ?? r.referenciaMes ?? r.mes ?? 'mesmo_mes'
          );
          regras.push({
            diaInicio,
            diaFim,
            diaPagamento,
            mesPagamento:
              mesRaw.includes('seguinte') || mesRaw.includes('proximo')
                ? 'mes_seguinte'
                : 'mesmo_mes',
          });
        }
      }
    }
  };

  for (const f of listarFrigorificos()) {
    inspecionarObjeto(f as unknown as Record<string, unknown>);
  }
  for (const i of listarIntermediarios()) {
    inspecionarObjeto(i as unknown as Record<string, unknown>);
  }

  for (let idx = 0; idx < localStorage.length; idx++) {
    const key = localStorage.key(idx);
    if (!key || !key.toLowerCase().includes('tabela')) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '');
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && typeof item === 'object') {
            inspecionarObjeto(item as Record<string, unknown>);
          }
        });
      } else if (parsed && typeof parsed === 'object') {
        inspecionarObjeto(parsed as Record<string, unknown>);
      }
    } catch {
      // Ignora
    }
  }

  if (regras.length === 0) {
    regras.push(
      {
        diaInicio: 1,
        diaFim: 7,
        diaPagamento: 21,
        mesPagamento: 'mesmo_mes',
      },
      {
        diaInicio: 8,
        diaFim: 15,
        diaPagamento: 28,
        mesPagamento: 'mesmo_mes',
      },
      {
        diaInicio: 16,
        diaFim: 24,
        diaPagamento: 7,
        mesPagamento: 'mes_seguinte',
      },
      {
        diaInicio: 25,
        diaFim: 31,
        diaPagamento: 14,
        mesPagamento: 'mes_seguinte',
      }
    );
  }

  return regras;
}

export function gerarOpcoesDatasFuturas(
  regras: RegraPagamentoTabela[],
  dataReferencia: Date = new Date()
): OpcaoDataPrevisao[] {
  const hojeIso = montarIsoData(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth(),
    dataReferencia.getDate()
  );

  const mapa = new Map<string, OpcaoDataPrevisao>();

  for (let offsetMes = 0; offsetMes <= 2; offsetMes++) {
    const base = new Date(
      dataReferencia.getFullYear(),
      dataReferencia.getMonth() + offsetMes,
      1
    );
    const anoPgto = base.getFullYear();
    const mesPgto = base.getMonth();

    for (const regra of regras) {
      const dataAlvoIso = montarIsoData(anoPgto, mesPgto, regra.diaPagamento);
      if (dataAlvoIso < hojeIso) continue;

      const dataOrigemBase =
        regra.mesPagamento === 'mes_seguinte'
          ? new Date(anoPgto, mesPgto - 1, 1)
          : new Date(anoPgto, mesPgto, 1);

      const periodoInicioIso = montarIsoData(
        dataOrigemBase.getFullYear(),
        dataOrigemBase.getMonth(),
        regra.diaInicio
      );
      const periodoFimIso = montarIsoData(
        dataOrigemBase.getFullYear(),
        dataOrigemBase.getMonth(),
        regra.diaFim
      );

      const chaveRegra = `${regra.diaPagamento}:${regra.diaInicio}-${regra.diaFim}:${regra.mesPagamento}`;
      const atual = mapa.get(chaveRegra);
      if (!atual || dataAlvoIso < atual.dataAlvoIso) {
        mapa.set(chaveRegra, {
          chave: `${dataAlvoIso}::${regra.diaInicio}-${regra.diaFim}`,
          dataAlvoIso,
          periodoInicioIso,
          periodoFimIso,
          diaPagamento: regra.diaPagamento,
          descricaoRegra: `Dias ${regra.diaInicio} a ${regra.diaFim} → recebe dia ${regra.diaPagamento} (${
            regra.mesPagamento === 'mes_seguinte' ? 'mês seguinte' : 'mesmo mês'
          })`,
        });
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.dataAlvoIso.localeCompare(b.dataAlvoIso)
  );
}

export function traduzirResponsavelDespesa(resp?: string): string {
  if (resp === 'frigorifico_desconta') return 'Frigorífico desconta';
  if (resp === 'frigorifico_ressarce') return 'Frigorífico ressarce';
  return 'Minha despesa';
}

export function extrairMovimentosCarteira(
  mapaPagadores: Map<string, string>,
  mapaCaminhoes: Map<string, string>
): ItemCarteiraComFiltros[] {
  const wallet = lerDadosWallet();
  const idsJaPagos = listarIdsReembolsosEDescontosJaPagos();
  const itens: ItemCarteiraComFiltros[] = [];

  for (const d of wallet.descontos) {
    if (d.arquivado || d.pagoEmRecebimentoId || idsJaPagos.has(String(d.id))) {
      continue;
    }
    const pagChave = `${d.pagadorTipo}:${d.pagadorId}`;
    const camId = d.caminhaoId ? String(d.caminhaoId) : '';
    itens.push({
      id: d.id,
      data: (d.data || '').slice(0, 10),
      natureza: 'desconto',
      descricao: d.descricao,
      pagador: mapaPagadores.get(pagChave) || d.pagadorId,
      caminhao: camId ? mapaCaminhoes.get(camId) || `Caminhão #${camId}` : '—',
      pagadorChave: pagChave,
      caminhaoId: camId,
      valor: d.valor,
    });
  }

  for (const r of wallet.reembolsos) {
    if (r.arquivado || r.pagoEmRecebimentoId || idsJaPagos.has(String(r.id))) {
      continue;
    }
    const pagChave = `${r.pagadorTipo}:${r.pagadorId}`;
    const camId = r.caminhaoId ? String(r.caminhaoId) : '';
    itens.push({
      id: r.id,
      data: (r.data || '').slice(0, 10),
      natureza: 'ressarcimento',
      descricao: r.descricao,
      pagador: mapaPagadores.get(pagChave) || r.pagadorId,
      caminhao: camId ? mapaCaminhoes.get(camId) || `Caminhão #${camId}` : '—',
      pagadorChave: pagChave,
      caminhaoId: camId,
      valor: r.valor,
    });
  }

  return itens;
}

export type { RegistroRecebimento };
