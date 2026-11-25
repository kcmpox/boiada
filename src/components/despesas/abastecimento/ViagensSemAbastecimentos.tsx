import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Truck,
  User,
  Calendar,
  MapPin,
  FileText,
  Fuel,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import * as cadastrosStorage from '../../../storage/cadastrosStorage';
import * as viagensStorage from '../../../storage/viagensStorage';
import {
  lerAbastecimentos,
  lerViagensConfirmadasSemAbastecimento,
  confirmarViagemSemAbastecimento,
  desconfirmarViagemSemAbastecimento,
} from '../../../storage/abastecimentosStorage';
import { ModalNovoAbastecimento } from './ModalNovoAbastecimento';

interface ViagemRegistro {
  id: string | number;
  data?: string;
  caminhaoId?: string | number;
  motoristaId?: string | number;
  tipoGado?: string;
  embarque?: string;
  localEmbarque?: string;
  pecuarista?: string;
  desembarque?: string;
  minuta?: string;
  numeroMinuta?: string;
  cte?: string;
  arquivada?: boolean;
}

function extrairColecao(
  modulo: Record<string, unknown>,
  chaves: string[],
  validador: (x: unknown) => boolean
): unknown[] {
  for (const fn of Object.values(modulo)) {
    if (typeof fn === 'function' && fn.length === 0) {
      try {
        const res = fn();
        if (Array.isArray(res) && res.length > 0 && validador(res[0])) return res;
        if (res && typeof res === 'object') {
          for (const k of chaves) {
            const lista = (res as Record<string, unknown>)[k];
            if (Array.isArray(lista)) return lista;
          }
        }
      } catch {
        // Ignora
      }
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '');
      if (Array.isArray(parsed) && parsed.length > 0 && validador(parsed[0])) {
        return parsed;
      }
      if (parsed && typeof parsed === 'object') {
        for (const k of chaves) {
          const lista = (parsed as Record<string, unknown>)[k];
          if (Array.isArray(lista)) return lista;
        }
      }
    } catch {
      // Ignora
    }
  }

  return [];
}

export function ViagensSemAbastecimentos() {
  const [versao, setVersao] = useState(0);
  const [mostrarConfirmadas, setMostrarConfirmadas] = useState(false);
  const [viagemParaAbastecer, setViagemParaAbastecer] =
    useState<ViagemRegistro | null>(null);

  const recarregar = () => setVersao((v) => v + 1);

  useEffect(() => {
    window.addEventListener('storage', recarregar);
    return () => window.removeEventListener('storage', recarregar);
  }, []);

  const {
    pendentes,
    confirmadas,
    mapaCaminhoes,
    mapaMotoristas,
  } = useMemo(() => {
    const todasViagens = extrairColecao(
      viagensStorage as Record<string, unknown>,
      ['viagens'],
      (x) =>
        typeof x === 'object' &&
        x !== null &&
        'id' in x &&
        ('localEmbarque' in x || 'embarque' in x || 'tipoGado' in x)
    ) as ViagemRegistro[];

    const abastecimentos = lerAbastecimentos();
    const idsViagensComAbastecimento = new Set<string>();
    const minutasPorCaminhao = new Set<string>();

    for (const ab of abastecimentos) {
      if (ab.viagemId) {
        idsViagensComAbastecimento.add(String(ab.viagemId));
      }
      if (ab.minutaNumero && ab.caminhaoId) {
        minutasPorCaminhao.add(
          `${String(ab.caminhaoId)}::${ab.minutaNumero.trim().toLowerCase()}`
        );
      }
    }

    const idsConfirmadas = lerViagensConfirmadasSemAbastecimento();

    const listaPendentes: ViagemRegistro[] = [];
    const listaConfirmadas: ViagemRegistro[] = [];

    const viagensAtivas = todasViagens
      .filter((v) => !v.arquivada)
      .sort((a, b) => (b.data || '').localeCompare(a.data || ''));

    for (const v of viagensAtivas) {
      const idStr = String(v.id);
      if (idsViagensComAbastecimento.has(idStr)) continue;

      const minuta = (v.minuta || v.numeroMinuta || '').trim().toLowerCase();
      if (
        minuta &&
        v.caminhaoId &&
        minutasPorCaminhao.has(`${String(v.caminhaoId)}::${minuta}`)
      ) {
        continue;
      }

      if (idsConfirmadas.has(idStr)) {
        listaConfirmadas.push(v);
      } else {
        listaPendentes.push(v);
      }
    }

    const caminhoesMap = new Map<string, string>();
    const listaCaminhoes = extrairColecao(
      cadastrosStorage as Record<string, unknown>,
      ['caminhoes'],
      (x) => typeof x === 'object' && x !== null && 'placa' in x
    );
    for (const item of listaCaminhoes) {
      const c = item as {
        id: string | number;
        nome?: string;
        apelido?: string;
        placa?: string;
      };
      const nome = c.nome || c.apelido || 'Caminhão';
      caminhoesMap.set(
        String(c.id),
        `${nome}${c.placa ? ` (${c.placa})` : ''}`
      );
    }

    const motoristasMap = new Map<string, string>();
    const listaMotoristas = extrairColecao(
      cadastrosStorage as Record<string, unknown>,
      ['motoristas'],
      (x) =>
        typeof x === 'object' &&
        x !== null &&
        'nome' in x &&
        !('placa' in x) &&
        !('rodovia' in x) &&
        !('uf' in x)
    );
    for (const item of listaMotoristas) {
      const m = item as { id: string | number; nome: string };
      motoristasMap.set(String(m.id), m.nome);
    }

    return {
      pendentes: listaPendentes,
      confirmadas: listaConfirmadas,
      mapaCaminhoes: caminhoesMap,
      mapaMotoristas: motoristasMap,
    };
  }, [versao]);

  const handleConfirmarSemAbastecimento = (viagemId: string | number) => {
    confirmarViagemSemAbastecimento(String(viagemId));
    recarregar();
  };

  const handleDesconfirmar = (viagemId: string | number) => {
    desconfirmarViagemSemAbastecimento(String(viagemId));
    recarregar();
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Viagens Sem Abastecimento
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pendentes.length} viagem(ns) sem abastecimento vinculado
            {confirmadas.length > 0
              ? ` • ${confirmadas.length} confirmada(s) sem abastecimento`
              : ''}
          </p>
        </div>

        {confirmadas.length > 0 && (
          <button
            type="button"
            onClick={() => setMostrarConfirmadas((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {mostrarConfirmadas ? (
              <>
                <EyeOff className="w-4 h-4 text-slate-400" />
                Ocultar confirmadas ({confirmadas.length})
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-slate-400" />
                Ver confirmadas sem abastecimento ({confirmadas.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Lista de Viagens Pendentes */}
      {pendentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Tudo em dia por aqui
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Não há viagens pendentes de abastecimento no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendentes.map((v) => {
            const dataFmt = v.data
              ? new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')
              : 'Sem data';
            const localEmbarque = (v.localEmbarque || v.embarque || '').trim();
            const pecuarista = (v.pecuarista || '').trim();
            const minuta = (v.minuta || v.numeroMinuta || '').trim();
            const nomeCaminhao = v.caminhaoId
              ? mapaCaminhoes.get(String(v.caminhaoId)) ||
                `Caminhão #${v.caminhaoId}`
              : 'Caminhão não informado';
            const nomeMotorista = v.motoristaId
              ? mapaMotoristas.get(String(v.motoristaId))
              : undefined;

            return (
              <article
                key={String(v.id)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-500 bg-white dark:bg-slate-900/60 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      {[localEmbarque, pecuarista].filter(Boolean).join(' ') ||
                        'Embarque não informado'}
                      {v.desembarque ? ` → ${v.desembarque}` : ''}
                    </span>

                    {minuta && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Minuta {minuta}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {dataFmt}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      {nomeCaminhao}
                    </span>

                    {nomeMotorista && (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {nomeMotorista}
                      </span>
                    )}

                    {v.cte && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        CTe: {v.cte}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViagemParaAbastecer(v)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
                  >
                    <Fuel className="w-3.5 h-3.5 text-brand-500" />
                    Lançar abastecimento
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmarSemAbastecimento(v.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmar sem abastecimento
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Seção opcional das viagens já confirmadas sem abastecimento */}
      {mostrarConfirmadas && confirmadas.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Confirmadas sem abastecimento ({confirmadas.length})
          </h4>
          {confirmadas.map((v) => {
            const dataFmt = v.data
              ? new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')
              : 'Sem data';
            const localEmbarque = (v.localEmbarque || v.embarque || '').trim();
            const pecuarista = (v.pecuarista || '').trim();
            const minuta = (v.minuta || v.numeroMinuta || '').trim();

            return (
              <div
                key={String(v.id)}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {dataFmt} —{' '}
                    {[localEmbarque, pecuarista].filter(Boolean).join(' ') ||
                      'Sem local de embarque'}
                    {minuta ? ` • Minuta ${minuta}` : ''}
                  </div>
                  <div className="text-slate-400">
                    {v.caminhaoId
                      ? mapaCaminhoes.get(String(v.caminhaoId))
                      : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDesconfirmar(v.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Voltar para pendentes
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ModalNovoAbastecimento
        aberto={Boolean(viagemParaAbastecer)}
        caminhaoInicialId={
          viagemParaAbastecer?.caminhaoId
            ? String(viagemParaAbastecer.caminhaoId)
            : undefined
        }
        viagemInicialId={
          viagemParaAbastecer ? String(viagemParaAbastecer.id) : undefined
        }
        onFechar={() => setViagemParaAbastecer(null)}
        onSalvo={recarregar}
      />
    </div>
  );
}