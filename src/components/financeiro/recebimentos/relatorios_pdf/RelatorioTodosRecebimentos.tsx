import { useEffect, useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import {
  COLUNAS_TODOS_RECEBIMENTOS,
  formatarDataBrPdf,
  type ColunaRecebimentosId,
} from '../../../../utils/pdfFinanceiroGenerator';
import type {
  CaminhaoFiltroOption,
  FiltroInicialRecebimentosPDF,
  PagadorFiltroOption,
  PropsPainelRelatorio,
  RegistroRecebimento,
} from './types';

interface RelatorioTodosRecebimentosProps extends PropsPainelRelatorio {
  recebimentos: RegistroRecebimento[];
  caminhoes: CaminhaoFiltroOption[];
  pagadores: PagadorFiltroOption[];
  mapaCaminhoes: Map<string, string>;
  mapaPagadores: Map<string, string>;
  filtroInicial?: FiltroInicialRecebimentosPDF | null;
}

export function RelatorioTodosRecebimentos({
  recebimentos,
  caminhoes,
  pagadores,
  mapaCaminhoes,
  mapaPagadores,
  filtroInicial,
  onPayloadChange,
  onFiltrosAtivosChange,
  sinalLimpar = 0,
}: RelatorioTodosRecebimentosProps) {
  const [dataInicio, setDataInicio] = useState(filtroInicial?.dataInicio || '');
  const [dataFim, setDataFim] = useState(filtroInicial?.dataFim || '');
  const [caminhaoId, setCaminhaoId] = useState(filtroInicial?.caminhaoId || '');
  const [pagadorChave, setPagadorChave] = useState(
    filtroInicial?.pagadorChave || ''
  );
  const [colunasVisiveis, setColunasVisiveis] = useState<
    ColunaRecebimentosId[]
  >(() => COLUNAS_TODOS_RECEBIMENTOS.map((c) => c.id));

  useEffect(() => {
    setDataInicio(filtroInicial?.dataInicio || '');
    setDataFim(filtroInicial?.dataFim || '');
    setCaminhaoId(filtroInicial?.caminhaoId || '');
    setPagadorChave(filtroInicial?.pagadorChave || '');
    setColunasVisiveis(COLUNAS_TODOS_RECEBIMENTOS.map((c) => c.id));
  }, [filtroInicial]);

  useEffect(() => {
    if (sinalLimpar === 0) return;
    setDataInicio('');
    setDataFim('');
    setCaminhaoId('');
    setPagadorChave('');
  }, [sinalLimpar]);

  useEffect(() => {
    onFiltrosAtivosChange(
      Boolean(dataInicio || dataFim || caminhaoId || pagadorChave)
    );
  }, [dataInicio, dataFim, caminhaoId, pagadorChave, onFiltrosAtivosChange]);

  useEffect(() => {
    const filtrados = recebimentos.filter((r) => {
      const dt = (r.dataPagamento || '').slice(0, 10);
      if (dataInicio && (!dt || dt < dataInicio)) return false;
      if (dataFim && (!dt || dt > dataFim)) return false;
      if (caminhaoId && String(r.caminhaoId) !== String(caminhaoId)) {
        return false;
      }
      if (
        pagadorChave &&
        `${r.pagadorTipo}:${r.pagadorId}` !== pagadorChave
      ) {
        return false;
      }
      return true;
    });

    const subtituloFiltros = [
      dataInicio || dataFim
        ? `Período: ${dataInicio ? formatarDataBrPdf(dataInicio) : 'Início'} até ${dataFim ? formatarDataBrPdf(dataFim) : 'Hoje'}`
        : 'Período: Todos os registros',
      caminhaoId
        ? `Caminhão: ${mapaCaminhoes.get(caminhaoId) || caminhaoId}`
        : 'Caminhão: Todos',
      pagadorChave
        ? `Pagador: ${mapaPagadores.get(pagadorChave) || pagadorChave}`
        : 'Pagador: Todos',
    ].join(' • ');

    onPayloadChange({
      tipo: 'todos_recebimentos',
      subtituloFiltros,
      colunasVisiveis,
      recebimentos: filtrados,
    });
  }, [
    recebimentos,
    dataInicio,
    dataFim,
    caminhaoId,
    pagadorChave,
    colunasVisiveis,
    mapaCaminhoes,
    mapaPagadores,
    onPayloadChange,
  ]);

  const toggleColuna = (id: ColunaRecebimentosId) => {
    setColunasVisiveis((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((c) => c !== id) : prev;
      }
      return [...prev, id];
    });
  };

  return (
    <>
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
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Colunas Exibidas no PDF
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {COLUNAS_TODOS_RECEBIMENTOS.map((col) => {
            const marcada = colunasVisiveis.includes(col.id);
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => toggleColuna(col.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  marcada
                    ? 'border-brand-500/40 bg-brand-50/50 dark:bg-brand-500/10 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400'
                }`}
              >
                {marcada ? (
                  <CheckSquare className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{col.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}