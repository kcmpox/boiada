import { useEffect, useState } from 'react';
import { formatarDataBrPdf } from '../../../../utils/pdfFinanceiroGenerator';
import { listarIdsViagensJaRecebidas } from '../../../../storage/recebimentosStorage';
import { listarViagens } from '../../../../storage/viagensStorage';
import { lerAbastecimentos } from '../../../../storage/abastecimentosStorage';
import { lerManutencoes } from '../../../../storage/manutencoesStorage';
import { lerDespesasPedagios } from '../../../../storage/despesasPedagiosStorage';
import type {
  ItemPrevisaoCarteira,
  ItemPrevisaoDespesa,
  ItemPrevisaoViagem,
} from '../../../../utils/pdfFinanceiroGenerator';
import {
  extrairMovimentosCarteira,
  traduzirResponsavelDespesa,
  type OpcaoDataPrevisao,
  type PagadorFiltroOption,
  type PropsPainelRelatorio,
} from './types';

interface RelatorioPrevisaoFuturaProps extends PropsPainelRelatorio {
  opcoesPrevisao: OpcaoDataPrevisao[];
  pagadores: PagadorFiltroOption[];
  mapaCaminhoes: Map<string, string>;
  mapaPagadores: Map<string, string>;
}

export function RelatorioPrevisaoFutura({
  opcoesPrevisao,
  pagadores,
  mapaCaminhoes,
  mapaPagadores,
  onPayloadChange,
  onFiltrosAtivosChange,
  sinalLimpar = 0,
}: RelatorioPrevisaoFuturaProps) {
  const [opcaoChave, setOpcaoChave] = useState(opcoesPrevisao[0]?.chave || '');
  const [pagadorChave, setPagadorChave] = useState('');

  useEffect(() => {
    setOpcaoChave(opcoesPrevisao[0]?.chave || '');
  }, [opcoesPrevisao]);

  useEffect(() => {
    if (sinalLimpar === 0) return;
    setPagadorChave('');
  }, [sinalLimpar]);

  useEffect(() => {
    onFiltrosAtivosChange(Boolean(pagadorChave));
  }, [pagadorChave, onFiltrosAtivosChange]);

  const opcaoSelecionada =
    opcoesPrevisao.find((o) => o.chave === opcaoChave) || opcoesPrevisao[0];

  useEffect(() => {
    if (!opcaoSelecionada) {
      onPayloadChange(null);
      return;
    }

    const idsJaPagas = listarIdsViagensJaRecebidas();
    const viagensPrevistas: ItemPrevisaoViagem[] = listarViagens()
      .filter((v) => !v.arquivada && !idsJaPagas.has(String(v.id)))
      .filter((v) => {
        const chavePag = `${v.pagadorTipo}:${v.pagadorId}`;
        if (pagadorChave && chavePag !== pagadorChave) return false;
        const bateDataPrevista =
          v.dataPrevistaRecebimento === opcaoSelecionada.dataAlvoIso;
        const bateJanelaOrigem =
          Boolean(v.data) &&
          v.data >= opcaoSelecionada.periodoInicioIso &&
          v.data <= opcaoSelecionada.periodoFimIso;
        return bateDataPrevista || bateJanelaOrigem;
      })
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((v) => ({
        id: v.id,
        data: v.data,
        rota: v.localDesembarque
          ? `${v.localEmbarque} → ${v.localDesembarque}`
          : v.localEmbarque,
        caminhao:
          mapaCaminhoes.get(String(v.caminhaoId)) || `Caminhão #${v.caminhaoId}`,
        pagador:
          mapaPagadores.get(`${v.pagadorTipo}:${v.pagadorId}`) || 'Pagador',
        tipoGado: v.tipoGado === 'boi_gordo' ? 'Boi Gordo' : 'Boi Magro',
        valorBruto: v.valorViagem,
        valorAluguel: v.valorAluguelCarreta,
        valorLiquido:
          v.valorLiquidoViagem !== undefined
            ? v.valorLiquidoViagem
            : v.valorViagem - v.valorAluguelCarreta,
      }));

    const dentroDoPeriodo = (dataHora: string) => {
      const dt = (dataHora || '').slice(0, 10);
      return (
        Boolean(dt) &&
        dt >= opcaoSelecionada.periodoInicioIso &&
        dt <= opcaoSelecionada.periodoFimIso
      );
    };

    const abastecimentos: ItemPrevisaoDespesa[] = lerAbastecimentos()
      .filter((a) => !a.arquivado && dentroDoPeriodo(a.dataHora))
      .map((a) => ({
        id: a.id,
        data: a.dataHora.slice(0, 10),
        categoria: 'Abastecimento',
        descricao: a.posto || 'Abastecimento',
        caminhao:
          mapaCaminhoes.get(String(a.caminhaoId)) || `Caminhão #${a.caminhaoId}`,
        responsavel: traduzirResponsavelDespesa(a.responsavelPagamento),
        valor: a.valorTotal,
      }));

    const manutencoes: ItemPrevisaoDespesa[] = lerManutencoes()
      .filter((m) => !m.arquivada && dentroDoPeriodo(m.dataHora))
      .map((m) => ({
        id: m.id,
        data: m.dataHora.slice(0, 10),
        categoria: m.categoria,
        descricao: m.descricao,
        caminhao:
          mapaCaminhoes.get(String(m.caminhaoId)) || `Caminhão #${m.caminhaoId}`,
        responsavel: traduzirResponsavelDespesa(m.responsavelPagamento),
        valor: m.valor,
      }));

    const pedagios: ItemPrevisaoDespesa[] = lerDespesasPedagios()
      .filter((p) => !p.arquivada && dentroDoPeriodo(p.dataHora))
      .map((p) => ({
        id: p.id,
        data: p.dataHora.slice(0, 10),
        categoria: 'Pedágio',
        descricao: p.rodovia ? `${p.praca} (${p.rodovia})` : p.praca,
        caminhao:
          mapaCaminhoes.get(String(p.caminhaoId)) || `Caminhão #${p.caminhaoId}`,
        responsavel: traduzirResponsavelDespesa(p.responsavelPagamento),
        valor: p.valor,
      }));

    const movimentosCarteira: ItemPrevisaoCarteira[] = extrairMovimentosCarteira(
      mapaPagadores,
      mapaCaminhoes
    )
      .filter((item) => dentroDoPeriodo(item.data))
      .filter((item) => !pagadorChave || item.pagadorChave === pagadorChave)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(({ pagadorChave: _p, caminhaoId: _c, ...rest }) => rest);

    onPayloadChange({
      tipo: 'previsao_futura',
      dataRecebimentoAlvo: opcaoSelecionada.dataAlvoIso,
      periodoOrigemInicio: opcaoSelecionada.periodoInicioIso,
      periodoOrigemFim: opcaoSelecionada.periodoFimIso,
      regraDescricao: opcaoSelecionada.descricaoRegra,
      pagadorFiltroLabel: pagadorChave
        ? `Pagador: ${mapaPagadores.get(pagadorChave) || pagadorChave}`
        : 'Todos os pagadores',
      viagens: viagensPrevistas,
      abastecimentos,
      manutencoes,
      pedagios,
      movimentosCarteira,
    });
  }, [
    opcaoSelecionada,
    pagadorChave,
    mapaCaminhoes,
    mapaPagadores,
    onPayloadChange,
  ]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Data de Recebimento Prevista
        </label>
        <select
          value={opcaoChave}
          onChange={(e) => setOpcaoChave(e.target.value)}
          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
        >
          {opcoesPrevisao.map((op) => (
            <option key={op.chave} value={op.chave}>
              Dia {op.diaPagamento} — {formatarDataBrPdf(op.dataAlvoIso)}
            </option>
          ))}
        </select>
      </div>

      {opcaoSelecionada && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-50/60 dark:bg-brand-500/10 p-3 text-xs space-y-1">
          <div className="font-bold text-slate-900 dark:text-white">
            Janela apurada automaticamente:
          </div>
          <div className="font-mono text-slate-800 dark:text-slate-200">
            {formatarDataBrPdf(opcaoSelecionada.periodoInicioIso)} até{' '}
            {formatarDataBrPdf(opcaoSelecionada.periodoFimIso)}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            {opcaoSelecionada.descricaoRegra}
          </div>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Filtrar por Pagador (opcional)
        </label>
        <select
          value={pagadorChave}
          onChange={(e) => setPagadorChave(e.target.value)}
          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
        >
          <option value="">Todos os pagadores</option>
          {pagadores.map((p) => (
            <option key={p.chave} value={p.chave}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}