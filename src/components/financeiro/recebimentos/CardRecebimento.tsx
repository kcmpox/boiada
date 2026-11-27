import { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Wallet,
  FileText,
  Trash2,
  X,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
} from 'lucide-react';
import {
  calcularSaldoCarteiraAposExclusao,
  excluirRecebimento,
  obterSaldoCaminhaoPagadorNaCarteira,
  type RegistroRecebimento,
} from '../../../storage/recebimentosStorage';

interface CardRecebimentoProps {
  recebimento: RegistroRecebimento;
  onExcluido?: () => void;
}

function formatarMoeda(valor: number): string {
  const limpo = Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
  return limpo.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarMoedaComSinal(valor: number): string {
  const limpo = Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
  const prefixo = limpo > 0 ? '+' : limpo < 0 ? '−' : '';
  return `${prefixo}${formatarMoeda(Math.abs(limpo))}`;
}

function corSaldoClass(valor: number): string {
  if (valor > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (valor < 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-slate-700 dark:text-slate-200';
}

function formatarDataBr(isoDate?: string | null): string {
  if (!isoDate) return '—';
  const limpo = isoDate.slice(0, 10);
  const [ano, mes, dia] = limpo.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

export function CardRecebimento({
  recebimento: rec,
  onExcluido,
}: CardRecebimentoProps) {
  const [expandido, setExpandido] = useState(false);
  const [popupDetalhesAberto, setPopupDetalhesAberto] = useState(false);
  const [popupExcluirAberto, setPopupExcluirAberto] = useState(false);

  useEffect(() => {
    if (!popupDetalhesAberto && !popupExcluirAberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopupDetalhesAberto(false);
        setPopupExcluirAberto(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [popupDetalhesAberto, popupExcluirAberto]);

  const valorEsperado =
    typeof rec.valorEsperadoAcerto === 'number'
      ? rec.valorEsperadoAcerto
      : rec.liquidoCalculado;
  const liquidoApurado =
    typeof rec.liquidoCalculado === 'number'
      ? rec.liquidoCalculado
      : rec.valorEfetivamentePago;
  const valorRecebidoDestaque =
    typeof rec.valorEfetivamentePago === 'number'
      ? rec.valorEfetivamentePago
      : liquidoApurado;
  const diferenca =
    typeof rec.diferencaAcerto === 'number'
      ? rec.diferencaAcerto
      : Number((liquidoApurado - valorEsperado).toFixed(2));

  const saldoRegistradoNoFechamento = Number.isFinite(rec.novoSaldoPagador)
    ? Number(rec.novoSaldoPagador.toFixed(2))
    : 0;

  const saldoAtualCarteira = popupExcluirAberto
    ? obterSaldoCaminhaoPagadorNaCarteira(
        rec.caminhaoId,
        rec.pagadorTipo,
        rec.pagadorId
      )
    : 0;
  const saldoDepoisExclusao = popupExcluirAberto
    ? calcularSaldoCarteiraAposExclusao(rec)
    : 0;

  const viagens = rec.viagens || [];
  const despesas = rec.despesas || [];
  const avulsos = rec.avulsos || [];
  const temDetalhes =
    viagens.length > 0 || despesas.length > 0 || avulsos.length > 0;

  const handleConfirmarExclusao = () => {
    const ok = excluirRecebimento(rec.id);
    setPopupExcluirAberto(false);
    if (ok) {
      onExcluido?.();
    }
  };

  return (
    <>
      <article className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-2xs overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-slate-700">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Esquerda: Pagador, Data, Caminhão e Resumo de Itens */}
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                <Building2 className="w-4 h-4 text-brand-500 shrink-0" />
                {rec.pagadorNome}
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Pagamento: {formatarDataBr(rec.dataPagamento)}
              </span>

              {Math.abs(diferenca) < 0.01 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  <CheckCircle2 className="w-3 h-3" />
                  Sem diferença
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                    diferenca < 0
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
                      : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Dif: {diferenca > 0 ? '+' : ''}
                  {formatarMoeda(diferenca)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {rec.caminhaoNome}
              </span>

              <span>
                {viagens.length} viagem(ns) • {despesas.length} despesa(s) •{' '}
                {avulsos.length} ajuste(s)
              </span>

              <span className="inline-flex items-center gap-1 font-mono">
                <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Saldo pagador:{' '}
                <strong className={corSaldoClass(saldoRegistradoNoFechamento)}>
                  {formatarMoedaComSinal(saldoRegistradoNoFechamento)}
                </strong>
              </span>

              {rec.observacoes && (
                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate max-w-sm">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {rec.observacoes}
                </span>
              )}
            </div>
          </div>

          {/* Direita: Valor Recebido em Destaque + Secundários + Ações */}
          <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Esperado
                </span>
                <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                  {formatarMoeda(valorEsperado)}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Líquido Apurado
                </span>
                <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">
                  {formatarMoeda(liquidoApurado)}
                </span>
              </div>

              <div className="pl-3 border-l border-slate-200 dark:border-slate-800">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Valor Recebido
                </span>
                <strong
                  className={`text-lg sm:text-xl font-mono font-extrabold ${
                    valorRecebidoDestaque >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatarMoeda(valorRecebidoDestaque)}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPopupDetalhesAberto(true)}
                title="Visualizar detalhes do recebimento"
                aria-label="Visualizar detalhes do recebimento"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500/40 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setPopupExcluirAberto(true)}
                title="Excluir recebimento"
                aria-label="Excluir recebimento"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-500/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {temDetalhes && (
                <button
                  type="button"
                  onClick={() => setExpandido((prev) => !prev)}
                  aria-expanded={expandido}
                  title={expandido ? 'Ocultar itens' : 'Ver itens do recebimento'}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {expandido ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detalhes Expansíveis */}
        {expandido && temDetalhes && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 px-4 sm:px-5 py-3.5 space-y-3 text-xs">
            {viagens.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Viagens ({viagens.length})
                </div>
                {viagens.map((v, idx) => (
                  <div
                    key={`${v.viagemId}-${idx}`}
                    className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">
                      <span className="font-mono text-slate-400 mr-2">
                        {formatarDataBr(v.dataViagem)}
                      </span>
                      {v.descricaoRota} ({v.tipoGado})
                    </span>
                    <span className="font-mono font-semibold shrink-0">
                      {formatarMoeda(v.valorRecebido)}
                      {Math.abs(v.valorRecebido - v.valorEsperado) >= 0.01 && (
                        <span className="text-[11px] text-slate-400 ml-1">
                          (esp. {formatarMoeda(v.valorEsperado)})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {despesas.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Despesas Vinculadas ({despesas.length})
                </div>
                {despesas.map((d, idx) => (
                  <div
                    key={`${d.despesaId}-${idx}`}
                    className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">
                      <span className="font-mono text-slate-400 mr-2">
                        {formatarDataBr(d.data)}
                      </span>
                      {d.descricao}
                    </span>
                    <span
                      className={`font-mono font-semibold shrink-0 ${
                        d.natureza === 'ressarcimento'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {d.natureza === 'ressarcimento' ? '+' : '−'}
                      {formatarMoeda(d.valorConsiderado)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {avulsos.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Descontos e Reembolsos ({avulsos.length})
                </div>
                {avulsos.map((a, idx) => (
                  <div
                    key={`${a.id}-${idx}`}
                    className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">{a.descricao}</span>
                    <span
                      className={`font-mono font-semibold shrink-0 ${
                        a.natureza === 'ressarcimento'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {a.natureza === 'ressarcimento' ? '+' : '−'}
                      {formatarMoeda(a.valor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </article>

      {/* Popup Somente Leitura de Detalhes do Recebimento */}
      {popupDetalhesAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-popup-detalhes-recebimento"
          onClick={() => setPopupDetalhesAberto(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Popup */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="titulo-popup-detalhes-recebimento"
                    className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate"
                  >
                    Detalhes do Recebimento
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {rec.pagadorNome} • {rec.caminhaoNome} • Pagamento em{' '}
                    {formatarDataBr(rec.dataPagamento)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPopupDetalhesAberto(false)}
                aria-label="Fechar detalhes"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo Somente Leitura */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Resumo Financeiro */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Valor Esperado
                  </span>
                  <strong className="mt-1 block text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatarMoeda(valorEsperado)}
                  </strong>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Líquido Apurado
                  </span>
                  <strong className="mt-1 block text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatarMoeda(liquidoApurado)}
                  </strong>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Valor Recebido
                  </span>
                  <strong
                    className={`mt-1 block text-sm font-mono font-extrabold ${
                      valorRecebidoDestaque >= 0
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatarMoeda(valorRecebidoDestaque)}
                  </strong>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Saldo do Pagador
                  </span>
                  <strong
                    className={`mt-1 block text-sm font-mono font-bold ${corSaldoClass(
                      saldoRegistradoNoFechamento
                    )}`}
                  >
                    {formatarMoedaComSinal(saldoRegistradoNoFechamento)}
                  </strong>
                </div>
              </div>

              {/* Composição do Acerto */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Composição do Fechamento
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Viagens ({viagens.length})</span>
                  <span className="font-mono font-semibold">
                    {formatarMoeda(rec.totalViagens || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Reembolsos / Ressarcimentos</span>
                  <span className="font-mono font-semibold">
                    + {formatarMoeda(rec.totalRessarcimentos || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                  <span>Descontos</span>
                  <span className="font-mono font-semibold">
                    − {formatarMoeda(rec.totalDescontos || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Saldo anterior do pagador</span>
                  <span className="font-mono font-semibold">
                    {formatarMoedaComSinal(rec.saldoAnteriorPagador || 0)}
                    {rec.compensouSaldoAnterior
                      ? ' (compensado)'
                      : ' (não compensado)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-semibold">
                  <span>Diferença (apurado vs. esperado)</span>
                  <span className="font-mono">
                    {Math.abs(diferenca) < 0.01
                      ? 'R$ 0,00'
                      : `${diferenca > 0 ? '+' : ''}${formatarMoeda(diferenca)}`}
                  </span>
                </div>
              </div>

              {/* Viagens Incluídas */}
              {viagens.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Viagens ({viagens.length})
                  </div>
                  <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-4">
                    {viagens.map((v, idx) => (
                      <div
                        key={`${v.viagemId}-${idx}`}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {v.descricaoRota}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatarDataBr(v.dataViagem)} • {v.tipoGado} •
                            Esperado: {formatarMoeda(v.valorEsperado)}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                          {formatarMoeda(v.valorRecebido)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Despesas Vinculadas */}
              {despesas.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Despesas Vinculadas ({despesas.length})
                  </div>
                  <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-4">
                    {despesas.map((d, idx) => (
                      <div
                        key={`${d.despesaId}-${idx}`}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {d.descricao}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatarDataBr(d.data)} • {d.tipo} • Orig:{' '}
                            {formatarMoeda(d.valorOriginal)}
                          </div>
                        </div>
                        <span
                          className={`font-mono font-bold shrink-0 ${
                            d.natureza === 'ressarcimento'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {d.natureza === 'ressarcimento' ? '+' : '−'}
                          {formatarMoeda(d.valorConsiderado)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Descontos e Reembolsos */}
              {avulsos.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Descontos e Reembolsos ({avulsos.length})
                  </div>
                  <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-4">
                    {avulsos.map((a, idx) => (
                      <div
                        key={`${a.id}-${idx}`}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {a.natureza === 'ressarcimento' ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                          <span className="font-medium text-slate-900 dark:text-white truncate">
                            {a.descricao}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold shrink-0 ${
                            a.natureza === 'ressarcimento'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {a.natureza === 'ressarcimento' ? '+' : '−'}
                          {formatarMoeda(a.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {rec.observacoes && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Observações
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    {rec.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Rodapé Somente Fechar */}
            <div className="flex justify-end px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
              <button
                type="button"
                onClick={() => setPopupDetalhesAberto(false)}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Confirmação de Exclusão com Antes e Depois da Carteira */}
      {popupExcluirAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-popup-excluir-recebimento"
          onClick={() => setPopupExcluirAberto(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3
                  id="titulo-popup-excluir-recebimento"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  Confirmar exclusão do recebimento
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setPopupExcluirAberto(false)}
                aria-label="Fechar janela"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p>
                Deseja apagar o recebimento de{' '}
                <strong className="text-slate-900 dark:text-white">
                  {rec.pagadorNome}
                </strong>{' '}
                ({rec.caminhaoNome}, pagamento em{' '}
                <span className="font-mono">
                  {formatarDataBr(rec.dataPagamento)}
                </span>
                )?
              </p>

              {/* Comparativo Antes e Depois na Carteira */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Wallet className="w-3.5 h-3.5 text-brand-500" />
                  Carteira ({rec.caminhaoNome} • {rec.pagadorNome})
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-center">
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">
                      Antes
                    </span>
                    <strong
                      className={`mt-0.5 block text-sm font-mono font-bold ${corSaldoClass(
                        saldoAtualCarteira
                      )}`}
                    >
                      {formatarMoedaComSinal(saldoAtualCarteira)}
                    </strong>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-center">
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">
                      Depois
                    </span>
                    <strong
                      className={`mt-0.5 block text-sm font-mono font-bold ${corSaldoClass(
                        saldoDepoisExclusao
                      )}`}
                    >
                      {formatarMoedaComSinal(saldoDepoisExclusao)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setPopupExcluirAberto(false)}
                className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                Excluir Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}