import { useEffect, useState } from 'react';
import { formatarDataBrPdf } from '../../../../utils/pdfFinanceiroGenerator';
import type { ItemPrevisaoCarteira } from '../../../../utils/pdfFinanceiroGenerator';
import {
  extrairMovimentosCarteira,
  type CaminhaoFiltroOption,
  type PagadorFiltroOption,
  type PropsPainelRelatorio,
} from './types';

interface RelatorioDescontosReembolsosProps extends PropsPainelRelatorio {
  caminhoes: CaminhaoFiltroOption[];
  pagadores: PagadorFiltroOption[];
  mapaCaminhoes: Map<string, string>;
  mapaPagadores: Map<string, string>;
}

export function RelatorioDescontosReembolsos({
  caminhoes,
  pagadores,
  mapaCaminhoes,
  mapaPagadores,
  onPayloadChange,
  onFiltrosAtivosChange,
  sinalLimpar = 0,
}: RelatorioDescontosReembolsosProps) {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagadorChave, setPagadorChave] = useState('');
  const [caminhaoId, setCaminhaoId] = useState('');
  const [natureza, setNatureza] = useState<
    'todos' | 'desconto' | 'ressarcimento'
  >('todos');

  useEffect(() => {
    if (sinalLimpar === 0) return;
    setDataInicio('');
    setDataFim('');
    setPagadorChave('');
    setCaminhaoId('');
    setNatureza('todos');
  }, [sinalLimpar]);

  useEffect(() => {
    onFiltrosAtivosChange(
      Boolean(
        dataInicio || dataFim || pagadorChave || caminhaoId || natureza !== 'todos'
      )
    );
  }, [
    dataInicio,
    dataFim,
    pagadorChave,
    caminhaoId,
    natureza,
    onFiltrosAtivosChange,
  ]);

  useEffect(() => {
    const filtrados: ItemPrevisaoCarteira[] = extrairMovimentosCarteira(
      mapaPagadores,
      mapaCaminhoes
    )
      .filter((item) => {
        if (dataInicio && (!item.data || item.data < dataInicio)) return false;
        if (dataFim && (!item.data || item.data > dataFim)) return false;
        if (pagadorChave && item.pagadorChave !== pagadorChave) return false;
        if (caminhaoId && item.caminhaoId !== caminhaoId) return false;
        if (natureza !== 'todos' && item.natureza !== natureza) return false;
        return true;
      })
      .sort((a, b) => b.data.localeCompare(a.data))
      .map(({ pagadorChave: _p, caminhaoId: _c, ...rest }) => rest);

    onPayloadChange({
      tipo: 'descontos_reembolsos',
      subtituloFiltros: [
        dataInicio || dataFim
          ? `Período: ${dataInicio ? formatarDataBrPdf(dataInicio) : 'Início'} até ${dataFim ? formatarDataBrPdf(dataFim) : 'Hoje'}`
          : 'Período: Todos',
        pagadorChave
          ? `Pagador: ${mapaPagadores.get(pagadorChave) || pagadorChave}`
          : 'Pagador: Todos',
        caminhaoId
          ? `Caminhão: ${mapaCaminhoes.get(caminhaoId) || caminhaoId}`
          : 'Caminhão: Todos',
      ].join(' • '),
      itens: filtrados,
    });
  }, [
    dataInicio,
    dataFim,
    pagadorChave,
    caminhaoId,
    natureza,
    mapaPagadores,
    mapaCaminhoes,
    onPayloadChange,
  ]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Data (De)
        </label>
        <input
          type="date"
          value={dataInicio}
          max={dataFim || undefined}
          onChange={(e) => setDataInicio(e.target.value)}
          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Data (Até)
        </label>
        <input
          type="date"
          value={dataFim}
          min={dataInicio || undefined}
          onChange={(e) => setDataFim(e.target.value)}
          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Pagador
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

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Caminhão
        </label>
        <select
          value={caminhaoId}
          onChange={(e) => setCaminhaoId(e.target.value)}
          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
        >
          <option value="">Todos os caminhões</option>
          {caminhoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Natureza
        </label>
        <select
          value={natureza}
          onChange={(e) =>
            setNatureza(
              e.target.value as 'todos' | 'desconto' | 'ressarcimento'
            )
          }
          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
        >
          <option value="todos">Descontos e Reembolsos</option>
          <option value="desconto">Somente Descontos (−)</option>
          <option value="ressarcimento">Somente Reembolsos (+)</option>
        </select>
      </div>
    </div>
  );
}