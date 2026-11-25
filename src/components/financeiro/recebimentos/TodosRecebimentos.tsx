import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Wallet,
  Calendar,
  Truck,
  MapPin,
  FileText,
  Building2,
} from 'lucide-react';
import * as viagensStorage from '../../../storage/viagensStorage';
import {
  listarCaminhoes,
  listarFrigorificos,
  listarIntermediarios,
} from '../../../storage/cadastrosStorage';
import { Paginacao } from '../../Paginacao';
import { ModalNovoRecebimento } from './ModalNovoRecebimento';

const ITENS_POR_PAGINA = 10;

interface ViagemRecebimento {
  id: string;
  data: string;
  caminhaoId?: string;
  localEmbarque?: string;
  localDesembarque?: string;
  minuta?: string;
  cte?: string;
  pagadorTipo?: 'frigorifico' | 'intermediario';
  pagadorId?: string;
  valorViagem?: number;
  valorLiquidoViagem?: number;
  dataPrevistaRecebimento?: string | null;
  arquivada?: boolean;
}

function extrairViagensAtivas(): ViagemRecebimento[] {
  const storageObj = viagensStorage as Record<string, unknown>;
  let listaBruta: unknown[] = [];

  if (typeof storageObj.listarViagens === 'function') {
    const res = storageObj.listarViagens();
    if (Array.isArray(res)) listaBruta = res;
  }

  if (listaBruta.length === 0) {
    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);
      if (!chave || !chave.includes('viagens') || chave.includes('arquiv')) {
        continue;
      }
      try {
        const parsed = JSON.parse(localStorage.getItem(chave) || '');
        if (Array.isArray(parsed)) {
          listaBruta = parsed;
          break;
        }
      } catch {
        // Ignora
      }
    }
  }

  return listaBruta
    .filter(
      (v): v is ViagemRecebimento =>
        typeof v === 'object' &&
        v !== null &&
        'id' in v &&
        !(v as ViagemRecebimento).arquivada
    )
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarDataBr(isoDate?: string | null): string {
  if (!isoDate) return '—';
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

export function TodosRecebimentos() {
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [viagens, setViagens] = useState<ViagemRecebimento[]>(() =>
    extrairViagensAtivas()
  );
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    const carregar = () => setViagens(extrairViagensAtivas());
    carregar();
    window.addEventListener('storage', carregar);
    return () => window.removeEventListener('storage', carregar);
  }, []);

  const { mapaCaminhoes, mapaPagadores } = useMemo(() => {
    const camMap = new Map<string, string>();
    for (const c of listarCaminhoes()) {
      camMap.set(
        String(c.id),
        `${c.nome}${c.placa ? ` (${c.placa})` : ''}`
      );
    }

    const pagMap = new Map<string, string>();
    for (const i of listarIntermediarios()) {
      pagMap.set(`intermediario:${i.id}`, i.nome);
    }
    for (const f of listarFrigorificos()) {
      pagMap.set(`frigorifico:${f.id}`, f.nome);
    }

    return { mapaCaminhoes: camMap, mapaPagadores: pagMap };
  }, [viagens]);

  const totalGeral = useMemo(() => {
    return viagens.reduce((acc, v) => {
      const val =
        typeof v.valorLiquidoViagem === 'number'
          ? v.valorLiquidoViagem
          : typeof v.valorViagem === 'number'
            ? v.valorViagem
            : 0;
      return acc + val;
    }, 0);
  }, [viagens]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(viagens.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const viagensPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return viagens.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [viagens, paginaSegura]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Todos Recebimentos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {viagens.length} lançamento(s) • Total previsto:{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {formatarMoeda(totalGeral)}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNovoAberto(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-brand-contrast text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Recebimento
        </button>
      </div>

      {viagens.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[38vh] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum recebimento registrado
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Clique em &ldquo;Novo Recebimento&rdquo; acima para lançar um recebimento ou acompanhe as previsões das viagens.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {viagensPaginadas.map((v) => {
            const chavePag = `${v.pagadorTipo}:${v.pagadorId}`;
            const nomePagador =
              mapaPagadores.get(chavePag) || 'Pagador não informado';
            const nomeCaminhao = v.caminhaoId
              ? mapaCaminhoes.get(String(v.caminhaoId))
              : undefined;
            const valorExibido =
              typeof v.valorLiquidoViagem === 'number'
                ? v.valorLiquidoViagem
                : v.valorViagem || 0;

            return (
              <article
                key={v.id}
                className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      <Building2 className="w-4 h-4 text-brand-500 shrink-0" />
                      {nomePagador}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Viagem: {formatarDataBr(v.data)}
                    </span>

                    {v.dataPrevistaRecebimento && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25">
                        Previsto: {formatarDataBr(v.dataPrevistaRecebimento)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {v.localEmbarque && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {v.localEmbarque}
                        {v.localDesembarque
                          ? ` → ${v.localDesembarque}`
                          : ''}
                      </span>
                    )}

                    {nomeCaminhao && (
                      <span className="inline-flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {nomeCaminhao}
                      </span>
                    )}

                    {(v.minuta || v.cte) && (
                      <span className="inline-flex items-center gap-1 font-mono">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {[
                          v.minuta ? `Minuta ${v.minuta}` : null,
                          v.cte ? `CTe ${v.cte}` : null,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Valor Líquido
                  </span>
                  <strong className="text-base sm:text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatarMoeda(valorExibido)}
                  </strong>
                </div>
              </article>
            );
          })}

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={viagens.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      <ModalNovoRecebimento
        aberto={modalNovoAberto}
        onFechar={() => setModalNovoAberto(false)}
      />
    </div>
  );
}