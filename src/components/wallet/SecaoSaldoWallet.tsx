import { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Building2,
  Briefcase,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  type PagadorConsolidadoWallet,
  listarSaldosPagadoresWallet,
  definirSaldoPagadorWallet,
} from '../../storage/walletStorage';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function SecaoSaldoWallet() {
  const [pagadores, setPagadores] = useState<PagadorConsolidadoWallet[]>(() =>
    listarSaldosPagadoresWallet()
  );
  const [chaveEmEdicao, setChaveEmEdicao] = useState<string | null>(null);
  const [valorEdicao, setValorEdicao] = useState('');

  useEffect(() => {
    const atualizar = () => setPagadores(listarSaldosPagadoresWallet());
    window.addEventListener('storage', atualizar);
    window.addEventListener('bt-wallet-updated', atualizar);
    return () => {
      window.removeEventListener('storage', atualizar);
      window.removeEventListener('bt-wallet-updated', atualizar);
    };
  }, []);

  const resumo = useMemo(() => {
    let saldoLiquido = 0;
    let totalPositivo = 0;
    let totalDevendo = 0;
    let qtdDevendo = 0;

    for (const p of pagadores) {
      saldoLiquido += p.saldo;
      if (p.saldo > 0) {
        totalPositivo += p.saldo;
      } else if (p.saldo < 0) {
        totalDevendo += Math.abs(p.saldo);
        qtdDevendo++;
      }
    }

    return {
      saldoLiquido: Number(saldoLiquido.toFixed(2)),
      totalPositivo: Number(totalPositivo.toFixed(2)),
      totalDevendo: Number(totalDevendo.toFixed(2)),
      qtdDevendo,
    };
  }, [pagadores]);

  const iniciarEdicao = (item: PagadorConsolidadoWallet) => {
    setChaveEmEdicao(item.chave);
    setValorEdicao(item.saldo !== 0 ? String(item.saldo) : '');
  };

  const salvarEdicao = (item: PagadorConsolidadoWallet) => {
    const bruto = valorEdicao.trim().replace(',', '.');
    const numero = bruto === '' ? 0 : Number(bruto);
    if (Number.isNaN(numero)) return;

    definirSaldoPagadorWallet(item.pagadorTipo, item.pagadorId, numero);
    setChaveEmEdicao(null);
    setValorEdicao('');
  };

  const intermediarios = pagadores.filter(
    (p) => p.pagadorTipo === 'intermediario'
  );
  const frigorificos = pagadores.filter((p) => p.pagadorTipo === 'frigorifico');

  const renderCardPagador = (item: PagadorConsolidadoWallet) => {
    const negativo = item.saldo < 0;
    const positivo = item.saldo > 0;
    const editando = chaveEmEdicao === item.chave;

    return (
      <article
        key={item.chave}
        className={`rounded-xl border p-4 sm:p-5 transition-all space-y-3 ${
          negativo
            ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {item.nome}
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

          {!editando && (
            <button
              type="button"
              onClick={() => iniciarEdicao(item)}
              title="Ajustar saldo manualmente"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
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
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Saldo por Pagador
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cada frigorífico e intermediário inicia em R$ 0,00. Valores negativos indicam saldo devedor para aquele pagador.
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Saldo Líquido Geral
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

      {pagadores.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[34vh] rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum pagador cadastrado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Cadastre frigoríficos ou intermediários em Cadastros para acompanhar o saldo de cada um aqui.
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
                {intermediarios.map(renderCardPagador)}
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
                {frigorificos.map(renderCardPagador)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}