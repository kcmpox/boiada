import { useMemo } from 'react';
import {
  History,
  Truck,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Route,
  Wallet,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import {
  listarViagens,
  listarViagensArquivadas,
  type Viagem,
} from '../../storage/viagensStorage';
import {
  listarCaminhoes,
  listarMotoristas,
  listarFrigorificos,
  listarIntermediarios,
} from '../../storage/cadastrosStorage';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarDataHoraExtrato(isoDateTime: string | null): {
  data: string;
  hora: string;
} {
  if (!isoDateTime) return { data: '—', hora: '' };
  const [dataParte, horaParte] = isoDateTime.split('T');
  if (!dataParte) return { data: isoDateTime, hora: '' };
  const [ano, mes, dia] = dataParte.split('-');
  return {
    data: `${dia}/${mes}/${ano}`,
    hora: horaParte || '',
  };
}

function calcularDuracao(saida: string | null, chegada: string | null): string {
  if (!saida || !chegada) return '—';
  const inicio = new Date(saida).getTime();
  const fim = new Date(chegada).getTime();
  if (isNaN(inicio) || isNaN(fim) || fim <= inicio) return '—';

  const diffMin = Math.floor((fim - inicio) / 60000);
  const dias = Math.floor(diffMin / (60 * 24));
  const horas = Math.floor((diffMin % (60 * 24)) / 60);
  const mins = diffMin % 60;

  const partes: string[] = [];
  if (dias > 0) partes.push(`${dias}d`);
  if (horas > 0) partes.push(`${horas}h`);
  if (mins > 0 || partes.length === 0) partes.push(`${mins}min`);
  return partes.join(' ');
}

export function SecaoHistoricoViagens() {
  const viagensTimeline = useMemo(() => {
    const todas = [...listarViagens(), ...listarViagensArquivadas()];
    return todas
      .filter((v) => v.statusSaidaChegada === 'registrado')
      .sort((a, b) => {
        const refA = a.dataHoraSaida || a.data;
        const refB = b.dataHoraSaida || b.data;
        return refB.localeCompare(refA);
      });
  }, []);

  const caminhoes = useMemo(() => listarCaminhoes(), []);
  const motoristas = useMemo(() => listarMotoristas(), []);
  const frigorificos = useMemo(() => listarFrigorificos(), []);
  const intermediarios = useMemo(() => listarIntermediarios(), []);

  const obterCaminhao = (id: string) => caminhoes.find((c) => c.id === id);

  const obterNomeMotorista = (id: string) =>
    motoristas.find((m) => m.id === id)?.nome || 'Sem motorista';

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

  if (viagensTimeline.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
          <History className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nenhum movimento registrado na timeline ainda
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Assim que você registrar o dia e a hora de saída e chegada das viagens, o extrato cronológico aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Extrato Cronológico de Saídas e Chegadas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {viagensTimeline.length}{' '}
            {viagensTimeline.length === 1
              ? 'viagem registrada no histórico'
              : 'viagens registradas no histórico'}
          </p>
        </div>
      </div>

      {/* Timeline estilo Extrato */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-8 ml-2">
        {viagensTimeline.map((v) => {
          const caminhao = obterCaminhao(v.caminhaoId);
          const saidaFmt = formatarDataHoraExtrato(v.dataHoraSaida);
          const chegadaFmt = formatarDataHoraExtrato(v.dataHoraChegada);
          const duracao = calcularDuracao(v.dataHoraSaida, v.dataHoraChegada);

          return (
            <div key={v.id} className="relative">
              {/* Marcador na linha vertical */}
              <span className="absolute -left-[33px] sm:-left-[41px] top-1 w-4 h-4 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900 shadow-xs" />

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5 space-y-4">
                {/* Cabeçalho do Lançamento no Extrato */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        v.tipoGado === 'boi_gordo'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300'
                      }`}
                    >
                      {v.tipoGado === 'boi_gordo' ? 'Boi Gordo' : 'Boi Magro'}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <Truck className="w-3.5 h-3.5 text-brand-500" />
                      {caminhao
                        ? `${caminhao.nome} (${caminhao.placa})`
                        : 'Caminhão removido'}
                    </span>

                    <span className="text-slate-300 dark:text-slate-700">•</span>

                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {obterNomeMotorista(v.motoristaId)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3 h-3 text-brand-500" />
                      Duração: {duracao}
                    </span>
                  </div>
                </div>

                {/* Linhas de Extrato: SAÍDA e CHEGADA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Linha Saída */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Saída • {saidaFmt.data}{' '}
                        {saidaFmt.hora ? `às ${saidaFmt.hora}` : ''}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                        {v.localEmbarque}
                      </div>
                    </div>
                  </div>

                  {/* Linha Chegada */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        Chegada • {chegadaFmt.data}{' '}
                        {chegadaFmt.hora ? `às ${chegadaFmt.hora}` : ''}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                        {v.localDesembarque || 'Destino não especificado'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Extrato: Pagador, KM, Valor Líquido e Status Animais */}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-brand-500" />
                      {obterNomePagador(v)}
                    </span>

                    <span className="inline-flex items-center gap-1 font-mono">
                      <Route className="w-3.5 h-3.5 text-slate-400" />
                      {v.kmInformado} km
                    </span>

                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      Líquido: {formatarMoeda(v.valorLiquidoViagem)}
                    </span>
                  </div>

                  {/* Badge de Status de Animais Perdidos */}
                  {v.statusAnimaisPerdidos === 'concluido' ? (
                    v.houvePerdaAnimais ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                        <AlertTriangle className="w-3 h-3" />
                        {v.quantidadeAnimaisPerdidos}{' '}
                        {v.quantidadeAnimaisPerdidos === 1
                          ? 'animal perdido'
                          : 'animais perdidos'}{' '}
                        ({formatarMoeda(v.valorTotalAnimaisPerdidos)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <ShieldCheck className="w-3 h-3" />
                        Sem perda de animais
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      Conferência de animais pendente
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}