import { useMemo, useState } from 'react';
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
  Fuel,
  Wrench,
  Milestone,
  ChevronDown,
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

const PASSO_TIMELINE = 10;

type TipoEventoTimeline = 'viagem' | 'abastecimento' | 'manutencao' | 'pedagio';

interface EventoTimeline {
  id: string;
  tipo: TipoEventoTimeline;
  dataHoraIso: string;
  caminhaoId: string;
  motoristaId?: string;
  viagem?: Viagem;
  tituloEvento: string;
  subtituloEvento: string;
  valor: number;
  responsavel?: string;
  detalheExtra?: string;
}

function formatarMoeda(valor: number): string {
  const limpo = Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
  return limpo.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarDataHoraExtrato(isoDateTime: string | null | undefined): {
  data: string;
  hora: string;
} {
  if (!isoDateTime) return { data: '—', hora: '' };
  const normalizado = isoDateTime.includes(' ')
    ? isoDateTime.replace(' ', 'T')
    : isoDateTime;
  const [dataParte, horaCompleta] = normalizado.split('T');
  if (!dataParte) return { data: isoDateTime, hora: '' };
  const partesData = dataParte.split('-');
  if (partesData.length !== 3) return { data: isoDateTime, hora: '' };
  const [ano, mes, dia] = partesData;
  const horaLimpa = horaCompleta ? horaCompleta.slice(0, 5) : '';
  return {
    data: `${dia}/${mes}/${ano}`,
    hora: horaLimpa,
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

function lerArrayLocalStorage(chaves: string[]): Record<string, unknown>[] {
  for (const chave of chaves) {
    try {
      const bruto = localStorage.getItem(chave);
      if (!bruto) continue;
      const parsed = JSON.parse(bruto);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Record<string, unknown>[];
      }
      if (parsed && typeof parsed === 'object') {
        for (const prop of ['itens', 'items', 'dados', 'lista', 'registros']) {
          const val = (parsed as Record<string, unknown>)[prop];
          if (Array.isArray(val) && val.length > 0) {
            return val as Record<string, unknown>[];
          }
        }
      }
    } catch {
      // Ignora entradas inválidas
    }
  }
  return [];
}

function extrairDataHoraDespesa(reg: Record<string, unknown>): string {
  const bruto = String(reg.dataHora || reg.data || reg.criadoEm || '').trim();
  if (!bruto) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(bruto)) {
    return `${bruto}T00:00:00`;
  }
  return bruto;
}

function calcularValorDespesa(reg: Record<string, unknown>): number {
  if (
    reg.valorTotal !== undefined &&
    reg.valorTotal !== null &&
    reg.valorTotal !== ''
  ) {
    const n = Number(reg.valorTotal);
    if (Number.isFinite(n)) return n;
  }
  if (reg.valor !== undefined && reg.valor !== null && reg.valor !== '') {
    const n = Number(reg.valor);
    if (Number.isFinite(n)) return n;
  }
  const itens = Array.isArray(reg.itens)
    ? (reg.itens as Record<string, unknown>[])
    : [];
  if (itens.length > 0) {
    return itens.reduce((acc, it) => {
      if (it.valorTotal !== undefined && it.valorTotal !== null) {
        return acc + (Number(it.valorTotal) || 0);
      }
      const qtd = Number(it.quantidade ?? 0);
      const unit = Number(it.valorUnitario ?? 0);
      const desc = Number(it.desconto ?? 0);
      return acc + Math.max(0, qtd * unit - desc);
    }, 0);
  }
  return 0;
}

function traduzirResponsavel(resp: unknown): string {
  const r = String(resp || '').trim();
  if (r === 'frigorifico_desconta') return 'Desconta do pagador';
  if (r === 'frigorifico_ressarce') return 'Ressarcido pelo pagador';
  if (r === 'minha_despesa') return 'Minha despesa';
  return '';
}

export function SecaoHistoricoViagens() {
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoEventoTimeline>(
    'todos'
  );
  const [filtroCaminhaoId, setFiltroCaminhaoId] = useState<string>('');
  const [limiteExibicao, setLimiteExibicao] = useState<number>(PASSO_TIMELINE);

  const caminhoes = useMemo(() => listarCaminhoes(), []);
  const motoristas = useMemo(() => listarMotoristas(), []);
  const frigorificos = useMemo(() => listarFrigorificos(), []);
  const intermediarios = useMemo(() => listarIntermediarios(), []);

  const eventosTimeline = useMemo<EventoTimeline[]>(() => {
    const listaEventos: EventoTimeline[] = [];

    const todasViagens = [...listarViagens(), ...listarViagensArquivadas()];
    for (const v of todasViagens) {
      if (v.statusSaidaChegada !== 'registrado') continue;
      const refIso =
        v.dataHoraSaida || v.dataHoraChegada || `${v.data}T00:00:00`;
      listaEventos.push({
        id: `viagem-${v.id}`,
        tipo: 'viagem',
        dataHoraIso: refIso,
        caminhaoId: String(v.caminhaoId || ''),
        motoristaId: v.motoristaId ? String(v.motoristaId) : undefined,
        viagem: v,
        tituloEvento: v.localDesembarque
          ? `${v.localEmbarque} → ${v.localDesembarque}`
          : v.localEmbarque,
        subtituloEvento:
          v.tipoGado === 'boi_gordo' ? 'Boi Gordo' : 'Boi Magro',
        valor:
          v.valorLiquidoViagem !== undefined
            ? Number(v.valorLiquidoViagem)
            : Number(v.valorViagem || 0) - Number(v.valorAluguelCarreta || 0),
      });
    }

    const abastecimentos = lerArrayLocalStorage([
      'bt_despesas_abastecimentos',
      'bt_abastecimentos',
    ]);
    for (const reg of abastecimentos) {
      if (reg.arquivado || reg.arquivada) continue;
      const refIso = extrairDataHoraDespesa(reg);
      if (!refIso) continue;
      const itens = Array.isArray(reg.itens)
        ? (reg.itens as Record<string, unknown>[])
        : [];
      const resumoItens = itens
        .map((it) => {
          const desc = String(it.descricao || 'Combustível');
          const qtd = Number(it.quantidade ?? 0);
          return qtd > 0
            ? `${desc} (${qtd.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L)`
            : desc;
        })
        .join(', ');

      const hodometro =
        reg.hodometro !== undefined &&
        reg.hodometro !== null &&
        String(reg.hodometro) !== ''
          ? `Hodômetro: ${Number(reg.hodometro).toLocaleString('pt-BR')} km`
          : undefined;

      listaEventos.push({
        id: `abast-${String(reg.id ?? refIso)}`,
        tipo: 'abastecimento',
        dataHoraIso: refIso,
        caminhaoId: String(reg.caminhaoId || ''),
        motoristaId: reg.motoristaId ? String(reg.motoristaId) : undefined,
        tituloEvento: String(reg.posto || reg.descricao || 'Abastecimento'),
        subtituloEvento: resumoItens || 'Abastecimento registrado',
        valor: calcularValorDespesa(reg),
        responsavel: traduzirResponsavel(reg.responsavelPagamento),
        detalheExtra: hodometro,
      });
    }

    const manutencoes = lerArrayLocalStorage([
      'bt_despesas_manutencoes',
      'bt_manutencoes',
    ]);
    for (const reg of manutencoes) {
      if (reg.arquivado || reg.arquivada) continue;
      const refIso = extrairDataHoraDespesa(reg);
      if (!refIso) continue;
      listaEventos.push({
        id: `manut-${String(reg.id ?? refIso)}`,
        tipo: 'manutencao',
        dataHoraIso: refIso,
        caminhaoId: String(reg.caminhaoId || ''),
        motoristaId: reg.motoristaId ? String(reg.motoristaId) : undefined,
        tituloEvento: String(
          reg.descricao || reg.servico || reg.categoria || 'Manutenção'
        ),
        subtituloEvento: String(reg.categoria || reg.oficina || 'Manutenção'),
        valor: calcularValorDespesa(reg),
        responsavel: traduzirResponsavel(reg.responsavelPagamento),
      });
    }

    const pedagios = lerArrayLocalStorage([
      'bt_despesas_pedagios',
      'bt_pedagios_lancamentos',
      'bt_pedagios',
    ]);
    for (const reg of pedagios) {
      if (reg.arquivado || reg.arquivada) continue;
      const refIso = extrairDataHoraDespesa(reg);
      if (!refIso) continue;
      const localPraca = String(
        reg.praca || reg.nome || reg.descricao || 'Pedágio'
      );
      const rodoviaKm = [
        reg.rodovia ? String(reg.rodovia) : null,
        reg.km !== undefined && reg.km !== null && String(reg.km) !== ''
          ? `KM ${String(reg.km)}`
          : null,
      ]
        .filter(Boolean)
        .join(' • ');

      listaEventos.push({
        id: `pedag-${String(reg.id ?? refIso)}`,
        tipo: 'pedagio',
        dataHoraIso: refIso,
        caminhaoId: String(reg.caminhaoId || ''),
        motoristaId: reg.motoristaId ? String(reg.motoristaId) : undefined,
        tituloEvento: localPraca,
        subtituloEvento: rodoviaKm || 'Tarifa de pedágio',
        valor: calcularValorDespesa(reg),
        responsavel: traduzirResponsavel(reg.responsavelPagamento),
      });
    }

    return listaEventos.sort((a, b) =>
      b.dataHoraIso.localeCompare(a.dataHoraIso)
    );
  }, []);

  const eventosFiltrados = useMemo(() => {
    return eventosTimeline.filter((ev) => {
      if (filtroTipo !== 'todos' && ev.tipo !== filtroTipo) return false;
      if (
        filtroCaminhaoId &&
        String(ev.caminhaoId) !== String(filtroCaminhaoId)
      ) {
        return false;
      }
      return true;
    });
  }, [eventosTimeline, filtroTipo, filtroCaminhaoId]);

  const eventosVisiveis = useMemo(
    () => eventosFiltrados.slice(0, limiteExibicao),
    [eventosFiltrados, limiteExibicao]
  );

  const restantesCount = Math.max(
    0,
    eventosFiltrados.length - eventosVisiveis.length
  );

  const obterCaminhao = (id: string) => caminhoes.find((c) => c.id === id);

  const obterNomeMotorista = (id?: string) =>
    (id && motoristas.find((m) => m.id === id)?.nome) || 'Sem motorista';

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

  if (eventosTimeline.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
          <History className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nenhum movimento registrado na timeline ainda
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Saídas e chegadas de viagens, abastecimentos, manutenções e pedágios aparecerão aqui em ordem cronológica.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Extrato Cronológico Operacional
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Exibindo {eventosVisiveis.length} de {eventosFiltrados.length}{' '}
            {eventosFiltrados.length === 1 ? 'evento' : 'eventos'} na timeline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'todos', label: 'Todos' },
              { id: 'viagem', label: 'Viagens' },
              { id: 'abastecimento', label: 'Abastecimentos' },
              { id: 'manutencao', label: 'Manutenções' },
              { id: 'pedagio', label: 'Pedágios' },
            ] as const
          ).map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => {
                setFiltroTipo(op.id);
                setLimiteExibicao(PASSO_TIMELINE);
              }}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filtroTipo === op.id
                  ? 'bg-brand-500 text-brand-contrast'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              {op.label}
            </button>
          ))}

          <select
            value={filtroCaminhaoId}
            onChange={(e) => {
              setFiltroCaminhaoId(e.target.value);
              setLimiteExibicao(PASSO_TIMELINE);
            }}
            aria-label="Filtrar timeline por caminhão"
            className="h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
          >
            <option value="">Todos os caminhões</option>
            {caminhoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} {c.placa ? `(${c.placa})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline estilo Extrato */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 ml-2">
        {eventosVisiveis.map((ev) => {
          const caminhao = obterCaminhao(ev.caminhaoId);
          const dataHoraFmt = formatarDataHoraExtrato(ev.dataHoraIso);

          if (ev.tipo === 'viagem' && ev.viagem) {
            const v = ev.viagem;
            const saidaFmt = formatarDataHoraExtrato(v.dataHoraSaida);
            const chegadaFmt = formatarDataHoraExtrato(v.dataHoraChegada);
            const duracao = calcularDuracao(v.dataHoraSaida, v.dataHoraChegada);

            return (
              <div key={ev.id} className="relative">
                <span className="absolute -left-[33px] sm:-left-[41px] top-1 w-4 h-4 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900 shadow-xs" />

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5 space-y-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          }

          const configDespesa =
            ev.tipo === 'abastecimento'
              ? {
                  rotulo: 'Abastecimento',
                  icone: Fuel,
                  corMarcador: 'bg-amber-500',
                  badgeClass:
                    'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
                  iconeBoxClass:
                    'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
                }
              : ev.tipo === 'manutencao'
                ? {
                    rotulo: 'Manutenção',
                    icone: Wrench,
                    corMarcador: 'bg-purple-500',
                    badgeClass:
                      'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
                    iconeBoxClass:
                      'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
                  }
                : {
                    rotulo: 'Pedágio',
                    icone: Milestone,
                    corMarcador: 'bg-rose-500',
                    badgeClass:
                      'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
                    iconeBoxClass:
                      'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
                  };

          const IconeDespesa = configDespesa.icone;

          return (
            <div key={ev.id} className="relative">
              <span
                className={`absolute -left-[33px] sm:-left-[41px] top-1 w-4 h-4 rounded-full ${configDespesa.corMarcador} ring-4 ring-white dark:ring-slate-900 shadow-xs`}
              />

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${configDespesa.badgeClass}`}
                    >
                      <IconeDespesa className="w-3 h-3" />
                      {configDespesa.rotulo}
                    </span>

                    <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {dataHoraFmt.data}
                      {dataHoraFmt.hora ? ` às ${dataHoraFmt.hora}` : ''}
                    </span>

                    <span className="text-slate-300 dark:text-slate-700">•</span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                      <Truck className="w-3.5 h-3.5 text-brand-500" />
                      {caminhao
                        ? `${caminhao.nome} (${caminhao.placa})`
                        : 'Caminhão removido'}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {obterNomeMotorista(ev.motoristaId)}
                    </span>
                  </div>

                  <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">
                    {formatarMoeda(ev.valor)}
                  </span>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${configDespesa.iconeBoxClass}`}
                  >
                    <IconeDespesa className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ev.tituloEvento}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                      {ev.subtituloEvento}
                    </div>
                  </div>
                </div>

                {(ev.responsavel || ev.detalheExtra) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {ev.responsavel && <span>{ev.responsavel}</span>}
                    {ev.detalheExtra && (
                      <span className="font-mono">{ev.detalheExtra}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {restantesCount > 0 && (
        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Restam {restantesCount}{' '}
            {restantesCount === 1
              ? 'evento anterior no extrato'
              : 'eventos anteriores no extrato'}
          </span>

          <button
            type="button"
            onClick={() =>
              setLimiteExibicao((prev) => prev + PASSO_TIMELINE)
            }
            className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4 text-brand-500" />
            Carregar mais {Math.min(PASSO_TIMELINE, restantesCount)}
          </button>
        </div>
      )}
    </div>
  );
}