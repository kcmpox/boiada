import { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Building2,
  Briefcase,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Truck,
  Ghost,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Percent,
  RotateCcw,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import {
  type SaldoConsolidadoWallet,
  listarSaldosCaminhaoPagadorWallet,
  definirSaldoCaminhaoPagadorWallet,
  lerWallet,
} from '../../storage/walletStorage';
import {
  listarCaminhoes,
  listarFrigorificos,
  listarIntermediarios,
} from '../../storage/cadastrosStorage';
import {
  listarRecebimentos,
  listarRecebimentosExcluidos,
  type RegistroRecebimento,
} from '../../storage/recebimentosStorage';

interface ItemExtratoWallet {
  id: string;
  data: string;
  caminhaoId: string;
  caminhaoNome: string;
  pagadorTipo: 'intermediario' | 'frigorifico';
  pagadorId: string;
  pagadorNome: string;
  tipoOrigem:
    | 'recebimento'
    | 'recebimento_fantasma'
    | 'desconto'
    | 'reembolso'
    | 'ajuste';
  titulo: string;
  detalhes: string;
  impactoSaldo: number;
  saldoAntes?: number;
  saldoDepois?: number;
  fantasma: boolean;
  recebimentoOriginal?: RegistroRecebimento;
}

function formatarMoeda(valor: number): string {
  const limpo = Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
  return limpo.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarDataBr(isoDate?: string): string {
  if (!isoDate) return '—';
  const limpo = isoDate.slice(0, 10);
  const [ano, mes, dia] = limpo.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

function FundoFantasma() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden rounded-xl opacity-[0.06] dark:opacity-[0.08]"
    >
      <div className="grid grid-cols-4 gap-6 -rotate-12 scale-125 py-3">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-center">
            <Ghost className="w-10 h-10 text-slate-900 dark:text-white" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SecaoSaldoWallet() {
  const [registros, setRegistros] = useState<SaldoConsolidadoWallet[]>(() =>
    listarSaldosCaminhaoPagadorWallet()
  );
  const [filtroCaminhaoId, setFiltroCaminhaoId] = useState<string>('');
  const [filtroChavePar, setFiltroChavePar] = useState<string>('');
  const [apenasFantasmas, setApenasFantasmas] = useState<boolean>(false);
  const [chaveEmEdicao, setChaveEmEdicao] = useState<string | null>(null);
  const [valorEdicao, setValorEdicao] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const atualizar = () => {
      setRegistros(listarSaldosCaminhaoPagadorWallet());
      setTick((t) => t + 1);
    };
    window.addEventListener('storage', atualizar);
    window.addEventListener('bt-wallet-updated', atualizar);
    window.addEventListener('bt-cadastros-updated', atualizar);
    window.addEventListener('bt-recebimentos-updated', atualizar);
    return () => {
      window.removeEventListener('storage', atualizar);
      window.removeEventListener('bt-wallet-updated', atualizar);
      window.removeEventListener('bt-cadastros-updated', atualizar);
      window.removeEventListener('bt-recebimentos-updated', atualizar);
    };
  }, []);

  const caminhoesFiltro = useMemo(() => {
    return listarCaminhoes()
      .filter((c) => c.ativo !== false)
      .map((c) => ({
        id: String(c.id),
        nome: `${c.apelido || c.nome || c.modelo || `Caminhão #${c.id}`}${c.placa ? ` (${c.placa})` : ''}`,
      }));
  }, [registros, tick]);

  const registrosFiltrados = useMemo(() => {
    if (!filtroCaminhaoId) return registros;
    return registros.filter(
      (r) => String(r.caminhaoId) === String(filtroCaminhaoId)
    );
  }, [registros, filtroCaminhaoId]);

  const extratoItens = useMemo<ItemExtratoWallet[]>(() => {
    void tick;
    const wallet = lerWallet();
    const recebimentosAtivos = listarRecebimentos();
    const recebimentosExcluidos = listarRecebimentosExcluidos();
    const caminhoesCad = listarCaminhoes();
    const frigorificosCad = listarFrigorificos();
    const intermediariosCad = listarIntermediarios();

    const mapaCaminhoes = new Map<string, string>();
    for (const c of caminhoesCad) {
      mapaCaminhoes.set(
        String(c.id),
        `${c.apelido || c.nome || c.modelo || `Caminhão #${c.id}`}${c.placa ? ` (${c.placa})` : ''}`
      );
    }
    for (const r of registros) {
      if (!mapaCaminhoes.has(String(r.caminhaoId))) {
        mapaCaminhoes.set(String(r.caminhaoId), r.caminhaoNome);
      }
    }

    const mapaPagadores = new Map<string, string>();
    for (const f of frigorificosCad) {
      mapaPagadores.set(`frigorifico:${f.id}`, f.nome);
    }
    for (const i of intermediariosCad) {
      mapaPagadores.set(`intermediario:${i.id}`, i.nome);
    }
    for (const r of registros) {
      const chave = `${r.pagadorTipo}:${r.pagadorId}`;
      if (!mapaPagadores.has(chave)) {
        mapaPagadores.set(chave, r.pagadorNome);
      }
    }

    const itens: ItemExtratoWallet[] = [];

    for (const rec of recebimentosAtivos) {
      const camId = String(rec.caminhaoId || '');
      const pagTipo =
        rec.pagadorTipo === 'frigorifico' ? 'frigorifico' : 'intermediario';
      const pagId = String(rec.pagadorId || '');
      const pagChave = `${pagTipo}:${pagId}`;
      const anterior = Number(rec.saldoAnteriorPagador ?? 0);
      const depois = Number(rec.novoSaldoPagador ?? anterior);
      const impacto = Number((depois - anterior).toFixed(2));

      itens.push({
        id: `rec-${rec.id}`,
        data: rec.criadoEm || rec.dataPagamento || '',
        caminhaoId: camId,
        caminhaoNome:
          mapaCaminhoes.get(camId) || rec.caminhaoNome || 'Caminhão',
        pagadorTipo: pagTipo,
        pagadorId: pagId,
        pagadorNome:
          mapaPagadores.get(pagChave) || rec.pagadorNome || 'Pagador',
        tipoOrigem: 'recebimento',
        titulo: `Fechamento / Recebimento (${formatarDataBr(rec.dataPagamento)})`,
        detalhes: `Líquido: ${formatarMoeda(rec.liquidoCalculado ?? 0)} • Pago: ${formatarMoeda(rec.valorEfetivamentePago ?? 0)}`,
        impactoSaldo: impacto,
        saldoAntes: anterior,
        saldoDepois: depois,
        fantasma: false,
        recebimentoOriginal: rec,
      });
    }

    for (const recExc of recebimentosExcluidos) {
      const camId = String(recExc.caminhaoId || '');
      const pagTipo =
        recExc.pagadorTipo === 'frigorifico' ? 'frigorifico' : 'intermediario';
      const pagId = String(recExc.pagadorId || '');
      const pagChave = `${pagTipo}:${pagId}`;
      const anterior = Number(recExc.saldoAnteriorPagador ?? 0);
      const depois = Number(recExc.novoSaldoPagador ?? anterior);
      const impacto = Number((depois - anterior).toFixed(2));

      itens.push({
        id: `fantasma-${recExc.id}`,
        data: recExc.excluidoEm || recExc.criadoEm || recExc.dataPagamento || '',
        caminhaoId: camId,
        caminhaoNome:
          mapaCaminhoes.get(camId) || recExc.caminhaoNome || 'Caminhão',
        pagadorTipo: pagTipo,
        pagadorId: pagId,
        pagadorNome:
          mapaPagadores.get(pagChave) || recExc.pagadorNome || 'Pagador',
        tipoOrigem: 'recebimento_fantasma',
        titulo: `Recebimento Excluído (${formatarDataBr(recExc.dataPagamento)})`,
        detalhes: `Recebimento deletado • Líquido: ${formatarMoeda(recExc.liquidoCalculado ?? 0)} • Pago: ${formatarMoeda(recExc.valorEfetivamentePago ?? 0)} • Variação revertida na carteira`,
        impactoSaldo: impacto,
        saldoAntes: anterior,
        saldoDepois: depois,
        fantasma: true,
        recebimentoOriginal: recExc,
      });
    }

    const lancamentosWallet = [
      ...(wallet.descontos || []).map((d) => ({
        ...d,
        natureza: 'desconto' as const,
      })),
      ...(wallet.reembolsos || []).map((r) => ({
        ...r,
        natureza: 'reembolso' as const,
      })),
    ];

    for (const lanc of lancamentosWallet) {
      const recVinculadoId = String(lanc.pagoEmRecebimentoId || '');
      const camId = String(lanc.caminhaoId || '');
      const pagTipo =
        lanc.pagadorTipo === 'frigorifico' ? 'frigorifico' : 'intermediario';
      const pagId = String(lanc.pagadorId || '');
      const pagChave = `${pagTipo}:${pagId}`;
      const ehDesconto = lanc.natureza === 'desconto';
      const valorNum = Math.abs(Number(lanc.valor || 0));

      itens.push({
        id: `lanc-${lanc.natureza}-${lanc.id}`,
        data: lanc.atualizadoEm || lanc.criadoEm || lanc.data || '',
        caminhaoId: camId,
        caminhaoNome: mapaCaminhoes.get(camId) || 'Caminhão',
        pagadorTipo: pagTipo,
        pagadorId: pagId,
        pagadorNome: mapaPagadores.get(pagChave) || 'Pagador',
        tipoOrigem: ehDesconto ? 'desconto' : 'reembolso',
        titulo:
          lanc.descricao ||
          (ehDesconto ? 'Desconto na carteira' : 'Reembolso na carteira'),
        detalhes: recVinculadoId
          ? `Vinculado ao recebimento #${recVinculadoId.slice(0, 8)}`
          : lanc.arquivado
            ? 'Lançamento arquivado'
            : 'Pendente de acerto em recebimento',
        impactoSaldo: ehDesconto ? -valorNum : valorNum,
        fantasma: false,
      });
    }

    for (const sal of registros) {
      const somaMovimentosAtivos = itens
        .filter(
          (i) =>
            !i.fantasma &&
            i.caminhaoId === sal.caminhaoId &&
            `${i.pagadorTipo}:${i.pagadorId}` ===
              `${sal.pagadorTipo}:${sal.pagadorId}`
        )
        .reduce((acc, i) => acc + i.impactoSaldo, 0);

      const diferencaAjuste = Number((sal.saldo - somaMovimentosAtivos).toFixed(2));
      if (Math.abs(diferencaAjuste) >= 0.01) {
        itens.push({
          id: `ajuste-${sal.chave}`,
          data: sal.atualizadoEm || '',
          caminhaoId: sal.caminhaoId,
          caminhaoNome: sal.caminhaoNome,
          pagadorTipo: sal.pagadorTipo,
          pagadorId: sal.pagadorId,
          pagadorNome: sal.pagadorNome,
          tipoOrigem: 'ajuste',
          titulo: 'Ajuste / Saldo Consolidado',
          detalhes: `Saldo atual consolidado: ${formatarMoeda(sal.saldo)} (diferença de ${formatarMoeda(diferencaAjuste)} em relação aos lançamentos ativos)`,
          impactoSaldo: diferencaAjuste,
          saldoDepois: sal.saldo,
          fantasma: false,
        });
      }
    }

    return itens.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  }, [registros, tick]);

  const extratoFiltrado = useMemo(() => {
    return extratoItens.filter((ev) => {
      if (filtroCaminhaoId && String(ev.caminhaoId) !== String(filtroCaminhaoId)) {
        return false;
      }
      if (filtroChavePar) {
        const chaveEv = `${ev.caminhaoId}::${ev.pagadorTipo}:${ev.pagadorId}`;
        if (chaveEv !== filtroChavePar) return false;
      }
      if (apenasFantasmas && !ev.fantasma) {
        return false;
      }
      return true;
    });
  }, [extratoItens, filtroCaminhaoId, filtroChavePar, apenasFantasmas]);

  const totalFantasmas = useMemo(
    () => extratoItens.filter((i) => i.fantasma).length,
    [extratoItens]
  );

  const resumo = useMemo(() => {
    let saldoLiquido = 0;
    let totalPositivo = 0;
    let totalDevendo = 0;
    let qtdDevendo = 0;

    for (const r of registrosFiltrados) {
      saldoLiquido += r.saldo;
      if (r.saldo > 0) {
        totalPositivo += r.saldo;
      } else if (r.saldo < 0) {
        totalDevendo += Math.abs(r.saldo);
        qtdDevendo++;
      }
    }

    return {
      saldoLiquido: Number(saldoLiquido.toFixed(2)),
      totalPositivo: Number(totalPositivo.toFixed(2)),
      totalDevendo: Number(totalDevendo.toFixed(2)),
      qtdDevendo,
    };
  }, [registrosFiltrados]);

  const iniciarEdicao = (item: SaldoConsolidadoWallet) => {
    setChaveEmEdicao(item.chave);
    setValorEdicao(item.saldo !== 0 ? String(item.saldo) : '');
  };

  const salvarEdicao = (item: SaldoConsolidadoWallet) => {
    const bruto = valorEdicao.trim().replace(',', '.');
    const numero = bruto === '' ? 0 : Number(bruto);
    if (Number.isNaN(numero)) return;

    definirSaldoCaminhaoPagadorWallet(
      item.caminhaoId,
      item.pagadorTipo,
      item.pagadorId,
      numero
    );
    setChaveEmEdicao(null);
    setValorEdicao('');
  };

  const intermediarios = registrosFiltrados.filter(
    (p) => p.pagadorTipo === 'intermediario'
  );
  const frigorificos = registrosFiltrados.filter(
    (p) => p.pagadorTipo === 'frigorifico'
  );

  const renderCardSaldo = (item: SaldoConsolidadoWallet) => {
    const negativo = item.saldo < 0;
    const positivo = item.saldo > 0;
    const editando = chaveEmEdicao === item.chave;
    const selecionadoNoExtrato = filtroChavePar === item.chave;

    return (
      <article
        key={item.chave}
        className={`rounded-xl border p-4 sm:p-5 transition-all space-y-3 ${
          selecionadoNoExtrato ? 'ring-2 ring-brand-500' : ''
        } ${
          negativo
            ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {item.pagadorNome}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Truck className="w-3 h-3 text-brand-500" />
                {item.caminhaoNome}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {item.pagadorTipo === 'intermediario'
                  ? 'Intermediário'
                  : 'Frigorífico'}
                {item.subtitulo ? ` • ${item.subtitulo}` : ''}
              </span>

              {negativo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  Estamos devendo
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                setFiltroChavePar((prev) =>
                  prev === item.chave ? '' : item.chave
                )
              }
              title="Filtrar extrato deste caminhão e pagador"
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                selecionadoNoExtrato
                  ? 'bg-brand-500 text-brand-contrast border-brand-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Extrato
            </button>

            {!editando && (
              <button
                type="button"
                onClick={() => iniciarEdicao(item)}
                title="Ajustar saldo manualmente"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {editando ? (
          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              autoFocus
              placeholder="0,00 (negativo = devendo)"
              value={valorEdicao}
              onChange={(e) => setValorEdicao(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') salvarEdicao(item);
                if (e.key === 'Escape') setChaveEmEdicao(null);
              }}
              className="flex-1 min-w-0 h-9 px-3 rounded-lg text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => salvarEdicao(item)}
              title="Salvar saldo"
              className="h-9 px-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-brand-contrast text-xs font-semibold cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChaveEmEdicao(null)}
              title="Cancelar"
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Saldo
            </span>
            <strong
              className={`text-lg font-mono font-extrabold ${
                negativo
                  ? 'text-rose-600 dark:text-rose-400'
                  : positivo
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {formatarMoeda(item.saldo)}
            </strong>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Subseção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Saldo por Caminhão e Pagador
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cada combinação de caminhão e pagador possui saldo próprio. Valores negativos indicam saldo devedor naquele caminhão.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <select
            value={filtroCaminhaoId}
            onChange={(e) => {
              setFiltroCaminhaoId(e.target.value);
              setFiltroChavePar('');
            }}
            aria-label="Filtrar saldo por caminhão"
            className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos os caminhões</option>
            {caminhoesFiltro.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Saldo Líquido
          </span>
          <div
            className={`mt-1 text-xl font-mono font-extrabold ${
              resumo.saldoLiquido < 0
                ? 'text-rose-600 dark:text-rose-400'
                : resumo.saldoLiquido > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatarMoeda(resumo.saldoLiquido)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Crédito Positivo
          </span>
          <div className="mt-1 text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatarMoeda(resumo.totalPositivo)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Devendo ({resumo.qtdDevendo})
          </span>
          <div className="mt-1 text-xl font-mono font-extrabold text-rose-600 dark:text-rose-400">
            {formatarMoeda(resumo.totalDevendo)}
          </div>
        </div>
      </div>

      {registrosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[28vh] rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum saldo registrado para este filtro
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Os saldos por caminhão e pagador aparecem aqui conforme os recebimentos são registrados ou ajustados.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {intermediarios.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Briefcase className="w-4 h-4 text-brand-500" />
                Intermediários ({intermediarios.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {intermediarios.map(renderCardSaldo)}
              </div>
            </section>
          )}

          {frigorificos.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Building2 className="w-4 h-4 text-brand-500" />
                Frigoríficos ({frigorificos.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {frigorificos.map(renderCardSaldo)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Extrato de Movimentações da Carteira */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Extrato da Carteira
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Histórico do porquê o saldo subiu ou desceu, incluindo recebimentos excluídos em modo fantasma.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filtroChavePar && (
              <button
                type="button"
                onClick={() => setFiltroChavePar('')}
                className="h-8 px-2.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Limpar par selecionado
              </button>
            )}

            <button
              type="button"
              onClick={() => setApenasFantasmas((v) => !v)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                apenasFantasmas
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 border-slate-800 dark:border-slate-200'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Ghost className="w-3.5 h-3.5" />
              Fantasmas ({totalFantasmas})
            </button>
          </div>
        </div>

        {extratoFiltrado.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhuma movimentação encontrada para o filtro atual.
          </div>
        ) : (
          <div className="space-y-2.5">
            {extratoFiltrado.map((ev) => {
              const sobe = ev.impactoSaldo > 0;
              const desce = ev.impactoSaldo < 0;

              const iconeTipo = ev.fantasma ? (
                <Ghost className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              ) : ev.tipoOrigem === 'recebimento' ? (
                <Receipt className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              ) : ev.tipoOrigem === 'desconto' ? (
                <Percent className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : ev.tipoOrigem === 'reembolso' ? (
                <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              );

              return (
                <div
                  key={ev.id}
                  className={`relative rounded-xl border p-3.5 transition-colors overflow-hidden ${
                    ev.fantasma
                      ? 'border-dashed border-slate-400/80 dark:border-slate-600 bg-slate-200/60 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50'
                  }`}
                >
                  {ev.fantasma && <FundoFantasma />}

                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                          ev.fantasma
                            ? 'bg-white/80 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {iconeTipo}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {ev.titulo}
                          </span>

                          {ev.fantasma && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-700/15 dark:bg-slate-300/15 text-slate-700 dark:text-slate-200 border border-slate-400/40">
                              <Ghost className="w-3 h-3" />
                              Recebimento Deletado
                            </span>
                          )}

                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {formatarDataBr(ev.data)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 break-words">
                          {ev.detalhes}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <Truck className="w-3 h-3 text-brand-500" />
                            {ev.caminhaoNome}
                          </span>
                          <span>•</span>
                          <span>{ev.pagadorNome}</span>
                          {ev.saldoAntes !== undefined &&
                            ev.saldoDepois !== undefined && (
                              <>
                                <span>•</span>
                                <span className="font-mono">
                                  {formatarMoeda(ev.saldoAntes)} →{' '}
                                  {formatarMoeda(ev.saldoDepois)}
                                </span>
                              </>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:justify-end gap-1.5 shrink-0 font-mono text-sm font-extrabold">
                      {sobe && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <ArrowUpRight className="w-4 h-4" />+{formatarMoeda(ev.impactoSaldo)}
                        </span>
                      )}
                      {desce && (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <ArrowDownRight className="w-4 h-4" />
                          {formatarMoeda(ev.impactoSaldo)}
                        </span>
                      )}
                      {!sobe && !desce && (
                        <span className="text-slate-600 dark:text-slate-300">
                          {formatarMoeda(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}