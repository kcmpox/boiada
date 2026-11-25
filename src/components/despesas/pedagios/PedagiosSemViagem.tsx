import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Milestone,
  Calendar,
  Truck,
  User,
  Link2,
  Sparkles,
  MapPin,
  Clock,
  Pencil,
  RotateCcw,
  Eye,
  EyeOff,
  Radio,
} from 'lucide-react';
import {
  type DespesaPedagio,
  lerDespesasPedagios,
  vincularViagemDespesaPedagio,
  confirmarPedagioSemViagem,
} from '../../../storage/despesasPedagiosStorage';
import {
  listarCaminhoes,
  listarMotoristas,
} from '../../../storage/cadastrosStorage';
import * as viagensStorage from '../../../storage/viagensStorage';
import { Paginacao } from '../../Paginacao';
import { ModalNovoPedagio } from './ModalNovoPedagio';

const ITENS_POR_PAGINA = 10;

interface ViagemCandidata {
  id: string;
  data: string; // YYYY-MM-DD
  caminhaoId: string;
  motoristaId?: string;
  localEmbarque: string;
  localDesembarque?: string;
  pecuarista?: string;
  minuta?: string;
  cte?: string;
  dataHoraSaida?: string;
  dataHoraChegada?: string;
  arquivada?: boolean;
}

interface SugestaoViagem {
  viagem: ViagemCandidata;
  nivel: 'exata' | 'mesmo_dia';
  motivo: string;
  pontuacao: number;
}

function extrairTodasViagens(): ViagemCandidata[] {
  const mapa = new Map<string, ViagemCandidata>();
  const storageObj = viagensStorage as Record<string, unknown>;

  const normalizar = (
    raw: unknown,
    forcarArquivada = false
  ): ViagemCandidata | null => {
    if (!raw || typeof raw !== 'object') return null;
    const v = raw as Record<string, unknown>;
    if (!v.id || !v.data) return null;

    const saida =
      (typeof v.dataHoraSaida === 'string' && v.dataHoraSaida) ||
      (typeof v.saidaDataHora === 'string' && v.saidaDataHora) ||
      (v.dataSaida && v.horaSaida ? `${v.dataSaida}T${v.horaSaida}` : undefined);

    const chegada =
      (typeof v.dataHoraChegada === 'string' && v.dataHoraChegada) ||
      (typeof v.chegadaDataHora === 'string' && v.chegadaDataHora) ||
      (v.dataChegada && v.horaChegada
        ? `${v.dataChegada}T${v.horaChegada}`
        : undefined);

    return {
      id: String(v.id),
      data: String(v.data),
      caminhaoId: v.caminhaoId ? String(v.caminhaoId) : '',
      motoristaId: v.motoristaId ? String(v.motoristaId) : undefined,
      localEmbarque: String(
        v.localEmbarque || v.embarque || 'Embarque não informado'
      ),
      localDesembarque: v.localDesembarque
        ? String(v.localDesembarque)
        : undefined,
      pecuarista: v.pecuarista ? String(v.pecuarista) : undefined,
      minuta: v.minuta ? String(v.minuta) : undefined,
      cte: v.cte ? String(v.cte) : undefined,
      dataHoraSaida: saida,
      dataHoraChegada: chegada,
      arquivada: forcarArquivada || Boolean(v.arquivada),
    };
  };

  if (typeof storageObj.listarViagens === 'function') {
    const ativas = storageObj.listarViagens() as unknown[];
    if (Array.isArray(ativas)) {
      for (const item of ativas) {
        const norm = normalizar(item, false);
        if (norm) mapa.set(norm.id, norm);
      }
    }
  }

  if (typeof storageObj.listarViagensArquivadas === 'function') {
    const arqs = storageObj.listarViagensArquivadas() as unknown[];
    if (Array.isArray(arqs)) {
      for (const item of arqs) {
        const norm = normalizar(item, true);
        if (norm && !mapa.has(norm.id)) mapa.set(norm.id, norm);
      }
    }
  }

  if (mapa.size === 0) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.includes('viagens')) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(k) || '');
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const norm = normalizar(item, k.includes('arquiv'));
            if (norm && !mapa.has(norm.id)) mapa.set(norm.id, norm);
          }
        }
      } catch {
        // Ignora
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) => b.data.localeCompare(a.data));
}

function parseTimestamp(iso?: string): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function formatarDataHoraBr(iso?: string): string {
  if (!iso) return '—';
  const [dataParte, horaParte] = iso.split('T');
  const [ano, mes, dia] = (dataParte || '').split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}${horaParte ? ` às ${horaParte.slice(0, 5)}` : ''}`;
}

function formatarDataBr(isoDate: string): string {
  const [ano, mes, dia] = (isoDate || '').split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

function calcularSugestoesParaPedagio(
  passagem: DespesaPedagio,
  todasViagens: ViagemCandidata[]
): SugestaoViagem[] {
  const tsPedagio = parseTimestamp(passagem.dataHora);
  const dataPedagio = passagem.dataHora.slice(0, 10);
  const sugestoes: SugestaoViagem[] = [];

  for (const v of todasViagens) {
    const mesmoCaminhao =
      Boolean(passagem.caminhaoId) &&
      String(v.caminhaoId) === String(passagem.caminhaoId);

    if (passagem.caminhaoId && !mesmoCaminhao) continue;

    const tsSaida = parseTimestamp(v.dataHoraSaida);
    const tsChegada = parseTimestamp(v.dataHoraChegada);

    // 1. Viagem com saída e chegada registradas: precisa estar estritamente dentro do intervalo
    if (tsPedagio !== null && tsSaida !== null && tsChegada !== null) {
      if (tsPedagio >= tsSaida && tsPedagio <= tsChegada) {
        sugestoes.push({
          viagem: v,
          nivel: 'exata',
          motivo: `Dentro do período da viagem (${formatarDataHoraBr(
            v.dataHoraSaida
          )} → ${formatarDataHoraBr(v.dataHoraChegada)})`,
          pontuacao: 100 + (mesmoCaminhao ? 20 : 0),
        });
      }
      continue;
    }

    // 2. Viagem com saída registrada, mas sem chegada: precisa ser >= saída e no mesmo dia
    if (tsPedagio !== null && tsSaida !== null && tsChegada === null) {
      if (tsPedagio >= tsSaida && v.data === dataPedagio) {
        sugestoes.push({
          viagem: v,
          nivel: 'mesmo_dia',
          motivo: `Saída registrada em ${formatarDataHoraBr(
            v.dataHoraSaida
          )} (viagem em andamento)`,
          pontuacao: 80 + (mesmoCaminhao ? 20 : 0),
        });
      }
      continue;
    }

    // 3. Viagem sem horários de saída/chegada preenchidos: fallback pela data
    if (v.data === dataPedagio) {
      sugestoes.push({
        viagem: v,
        nivel: 'mesmo_dia',
        motivo: `Mesma data da viagem (${formatarDataBr(v.data)})`,
        pontuacao: 65 + (mesmoCaminhao ? 20 : 0),
      });
    }
  }

  return sugestoes.sort((a, b) => b.pontuacao - a.pontuacao);
}

export function PedagiosSemViagem() {
  const [versao, setVersao] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mostrarConfirmadosSemViagem, setMostrarConfirmadosSemViagem] =
    useState(false);
  const [passagemEmEdicao, setPassagemEmEdicao] =
    useState<DespesaPedagio | null>(null);
  const [selecaoManualPorPedagio, setSelecaoManualPorPedagio] = useState<
    Record<string, string>
  >({});

  const recarregar = () => setVersao((v) => v + 1);

  useEffect(() => {
    window.addEventListener('storage', recarregar);
    return () => window.removeEventListener('storage', recarregar);
  }, []);

  const {
    pendentes,
    confirmadosSemViagem,
    todasViagens,
    mapaCaminhoes,
    mapaMotoristas,
  } = useMemo(() => {
    const todasPassagens = lerDespesasPedagios()
      .filter((p) => !p.arquivado && !p.viagemId)
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));

    const listaPendentes: DespesaPedagio[] = [];
    const listaConfirmados: DespesaPedagio[] = [];

    for (const p of todasPassagens) {
      if (p.semViagemConfirmado) {
        listaConfirmados.push(p);
      } else {
        listaPendentes.push(p);
      }
    }

    const caminhoesMap = new Map<string, string>();
    for (const c of listarCaminhoes()) {
      caminhoesMap.set(
        String(c.id),
        `${c.nome}${c.placa ? ` (${c.placa})` : ''}`
      );
    }

    const motoristasMap = new Map<string, string>();
    for (const m of listarMotoristas()) {
      motoristasMap.set(String(m.id), m.nome);
    }

    return {
      pendentes: listaPendentes,
      confirmadosSemViagem: listaConfirmados,
      todasViagens: extrairTodasViagens(),
      mapaCaminhoes: caminhoesMap,
      mapaMotoristas: motoristasMap,
    };
  }, [versao]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(pendentes.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const pendentesPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return pendentes.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [pendentes, paginaSegura]);

  const handleVincular = (passagemId: string, viagemId: string) => {
    if (!viagemId) return;
    vincularViagemDespesaPedagio(passagemId, viagemId);
    recarregar();
  };

  const handleConfirmarSemViagem = (passagemId: string) => {
    confirmarPedagioSemViagem(passagemId, true);
    recarregar();
  };

  const handleVoltarParaPendentes = (passagemId: string) => {
    confirmarPedagioSemViagem(passagemId, false);
    recarregar();
  };

  const formatarRotuloViagem = (v: ViagemCandidata) => {
    const caminhao = v.caminhaoId ? mapaCaminhoes.get(v.caminhaoId) : '';
    const rota = v.localDesembarque
      ? `${v.localEmbarque} → ${v.localDesembarque}`
      : v.localEmbarque;
    return [
      formatarDataBr(v.data),
      rota,
      caminhao,
      v.minuta ? `Minuta ${v.minuta}` : null,
      v.arquivada ? '(Arquivada)' : null,
    ]
      .filter(Boolean)
      .join(' • ');
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Pedágios Sem Viagem Vinculada
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pendentes.length} passagem(ns) aguardando vínculo com viagem
            {confirmadosSemViagem.length > 0
              ? ` • ${confirmadosSemViagem.length} confirmada(s) como deslocamento avulso`
              : ''}
          </p>
        </div>

        {confirmadosSemViagem.length > 0 && (
          <button
            type="button"
            onClick={() => setMostrarConfirmadosSemViagem((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {mostrarConfirmadosSemViagem ? (
              <>
                <EyeOff className="w-4 h-4 text-slate-400" />
                Ocultar avulsos ({confirmadosSemViagem.length})
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-slate-400" />
                Ver avulsos sem viagem ({confirmadosSemViagem.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Lista de Pedágios Pendentes */}
      {pendentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Todos os pedágios estão vinculados
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Não há passagens de pedágio pendentes de vínculo com viagem no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendentesPaginados.map((p) => {
            const sugestoes = calcularSugestoesParaPedagio(p, todasViagens);
            const melhorSugestao = sugestoes[0];
            const nomeCaminhao = p.caminhaoId
              ? mapaCaminhoes.get(String(p.caminhaoId)) ||
                `Caminhão #${p.caminhaoId}`
              : undefined;
            const nomeMotorista = p.motoristaId
              ? mapaMotoristas.get(String(p.motoristaId))
              : undefined;

            const viagensParaSelect = p.caminhaoId
              ? todasViagens.filter(
                  (v) => String(v.caminhaoId) === String(p.caminhaoId)
                )
              : todasViagens;

            const viagemManualEscolhida =
              selecaoManualPorPedagio[p.id] ??
              (melhorSugestao ? melhorSugestao.viagem.id : '');

            return (
              <article
                key={p.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-500 bg-white dark:bg-slate-900/70 p-4 sm:p-5 shadow-2xs space-y-4"
              >
                {/* Topo: Dados do Pedágio */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                        <Milestone className="w-4 h-4 text-amber-500 shrink-0" />
                        {p.nomePedagio}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.semParar
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Radio className="w-3 h-3" />
                        {p.semParar ? 'Sem Parar' : 'Avulso'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatarDataHoraBr(p.dataHora)}
                      </span>

                      {nomeCaminhao ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                          <Truck className="w-3.5 h-3.5 text-brand-500" />
                          {nomeCaminhao}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Caminhão não informado
                        </span>
                      )}

                      {nomeMotorista && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {nomeMotorista}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase text-slate-400">
                        Tarifa
                      </div>
                      <div className="text-sm font-mono font-extrabold text-brand-600 dark:text-brand-400">
                        {p.valor.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPassagemEmEdicao(p)}
                      title="Editar passagem"
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bloco de Sugestão Automática pela Saída/Chegada */}
                {melhorSugestao ? (
                  <div
                    className={`rounded-xl border p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                      melhorSugestao.nivel === 'exata'
                        ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25'
                        : 'bg-brand-50/60 dark:bg-brand-500/10 border-brand-500/25'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide ${
                            melhorSugestao.nivel === 'exata'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-brand-600 dark:text-brand-400'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {melhorSugestao.nivel === 'exata'
                            ? 'Viagem identificada pelo horário'
                            : 'Viagem sugerida'}
                        </span>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {melhorSugestao.motivo}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                        <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span>{melhorSugestao.viagem.localEmbarque}</span>
                        {melhorSugestao.viagem.localDesembarque && (
                          <>
                            <span className="text-slate-400">→</span>
                            <span>
                              {melhorSugestao.viagem.localDesembarque}
                            </span>
                          </>
                        )}
                        {melhorSugestao.viagem.minuta && (
                          <span className="px-2 py-0.5 rounded bg-white/80 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                            Minuta {melhorSugestao.viagem.minuta}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleVincular(p.id, melhorSugestao.viagem.id)
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Vincular esta viagem
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                    Nenhuma viagem encontrada automaticamente para este horário
                    {!p.caminhaoId
                      ? ' (vincule o caminhão no botão editar para refinar a busca).'
                      : '.'}
                  </div>
                )}

                {/* Vínculo Manual / Alternativo + Confirmar sem viagem */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <select
                      value={viagemManualEscolhida}
                      onChange={(e) =>
                        setSelecaoManualPorPedagio((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      className="flex-1 min-w-0 h-9 px-3 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">
                        Selecionar viagem manualmente...
                      </option>
                      {viagensParaSelect.map((v) => (
                        <option key={v.id} value={v.id}>
                          {formatarRotuloViagem(v)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!viagemManualEscolhida}
                      onClick={() =>
                        handleVincular(p.id, viagemManualEscolhida)
                      }
                      className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                    >
                      Vincular
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmarSemViagem(p.id)}
                    className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    Confirmar sem viagem
                  </button>
                </div>
              </article>
            );
          })}

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={pendentes.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      {/* Seção Opcional: Pedágios confirmados como deslocamento avulso */}
      {mostrarConfirmadosSemViagem && confirmadosSemViagem.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Confirmados sem viagem ({confirmadosSemViagem.length})
          </h4>
          {confirmadosSemViagem.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatarDataHoraBr(p.dataHora)} — {p.nomePedagio}
                </div>
                <div className="text-slate-400">
                  {p.caminhaoId
                    ? mapaCaminhoes.get(String(p.caminhaoId))
                    : 'Sem caminhão'}{' '}
                  •{' '}
                  {p.valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleVoltarParaPendentes(p.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Voltar para pendentes
              </button>
            </div>
          ))}
        </div>
      )}

      <ModalNovoPedagio
        aberto={Boolean(passagemEmEdicao)}
        passagemEdicao={passagemEmEdicao}
        onFechar={() => setPassagemEmEdicao(null)}
        onSalvo={recarregar}
      />
    </div>
  );
}