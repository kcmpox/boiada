import { useEffect, useState } from 'react';
import { formatarDataBrPdf } from '../../../../utils/pdfFinanceiroGenerator';
import { formatarMoedaPdf, type PropsPainelRelatorio, type RegistroRecebimento } from './types';

interface RelatorioRecebimentoEspecificoProps extends PropsPainelRelatorio {
  recebimentos: RegistroRecebimento[];
}

export function RelatorioRecebimentoEspecifico({
  recebimentos,
  onPayloadChange,
  onFiltrosAtivosChange,
}: RelatorioRecebimentoEspecificoProps) {
  const [selecionadoId, setSelecionadoId] = useState(recebimentos[0]?.id || '');

  useEffect(() => {
    onFiltrosAtivosChange(false);
  }, [onFiltrosAtivosChange]);

  useEffect(() => {
    if (!recebimentos.some((r) => r.id === selecionadoId)) {
      setSelecionadoId(recebimentos[0]?.id || '');
    }
  }, [recebimentos, selecionadoId]);

  useEffect(() => {
    const alvo =
      recebimentos.find((r) => r.id === selecionadoId) || recebimentos[0];
    if (!alvo) {
      onPayloadChange(null);
      return;
    }

    onPayloadChange({
      tipo: 'recebimento_especifico',
      recebimento: alvo,
    });
  }, [recebimentos, selecionadoId, onPayloadChange]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Selecione o Recebimento
        </label>
        {recebimentos.length === 0 ? (
          <p className="text-xs text-slate-500">
            Nenhum recebimento registrado disponível.
          </p>
        ) : (
          <select
            value={selecionadoId}
            onChange={(e) => setSelecionadoId(e.target.value)}
            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
          >
            {recebimentos.map((r) => (
              <option key={r.id} value={r.id}>
                {formatarDataBrPdf(r.dataPagamento)} — {r.pagadorNome} (
                {formatarMoedaPdf(r.valorEfetivamentePago || 0)})
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}