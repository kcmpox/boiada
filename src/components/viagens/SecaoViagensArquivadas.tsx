import { useState, useMemo } from 'react';
import {
  Archive,
  Truck,
  Calendar,
  MapPin,
  Wallet,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  listarViagensArquivadas,
  salvarViagensArquivadas,
  restaurarViagemArquivada,
  type Viagem,
} from '../../storage/viagensStorage';
import {
  listarCaminhoes,
  listarFrigorificos,
  listarIntermediarios,
} from '../../storage/cadastrosStorage';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarDataBr(isoDate: string): string {
  if (!isoDate) return '—';
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

export function SecaoViagensArquivadas() {
  const [arquivadas, setArquivadas] = useState<Viagem[]>(() =>
    listarViagensArquivadas()
  );

  const caminhoes = useMemo(() => listarCaminhoes(), []);
  const frigorificos = useMemo(() => listarFrigorificos(), []);
  const intermediarios = useMemo(() => listarIntermediarios(), []);

  const handleRestaurar = (id: string) => {
    const restantes = restaurarViagemArquivada(id);
    setArquivadas(restantes);
  };

  const handleExcluirDefinitivo = (id: string) => {
    const atualizada = arquivadas.filter((v) => v.id !== id);
    setArquivadas(atualizada);
    salvarViagensArquivadas(atualizada);
  };

  const obterCaminhao = (id: string) => caminhoes.find((c) => c.id === id);

  const obterNomePagador = (v: Viagem) => {
    if (v.pagadorTipo === 'frigorifico') {
      return (
        frigorificos.find((f) => f.id === v.pagadorId)?.nome ||
        'Frigorífico removido'
      );
    }
    return (
      intermediarios.find((i) => i.id === v.pagadorId)?.nome ||
      'Intermediário removido'
    );
  };

  if (arquivadas.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
          <Archive className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nenhuma viagem arquivada
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          As viagens que você arquivar na guia <strong>Viagens</strong> aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {arquivadas.map((v) => {
        const caminhao = obterCaminhao(v.caminhaoId);

        return (
          <div
            key={v.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3 opacity-90"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                      v.tipoGado === 'boi_gordo'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300'
                    }`}
                  >
                    {v.tipoGado === 'boi_gordo' ? 'Boi Gordo' : 'Boi Magro'}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatarDataBr(v.data)}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Truck className="w-3.5 h-3.5 text-brand-500" />
                    {caminhao
                      ? `${caminhao.nome} (${caminhao.placa})`
                      : 'Caminhão removido'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>{v.localEmbarque}</span>
                  {v.localDesembarque && (
                    <>
                      <span className="text-slate-400">→</span>
                      <span>{v.localDesembarque}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => handleRestaurar(v.id)}
                  title="Restaurar para viagens ativas"
                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar
                </button>
                <button
                  type="button"
                  onClick={() => handleExcluirDefinitivo(v.id)}
                  title="Excluir definitivamente"
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-brand-500" />
                Pagador: <strong>{obterNomePagador(v)}</strong>
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                Bruto: {formatarMoeda(v.valorViagem)} • Líquido:{' '}
                {formatarMoeda(v.valorLiquidoViagem)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}