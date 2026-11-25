import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Wallet, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { rootRoute } from './root';
import { SecaoSaldoWallet } from '../components/wallet/SecaoSaldoWallet';
import { SecaoDescontosWallet } from '../components/wallet/SecaoDescontosWallet';
import { SecaoReembolsoWallet } from '../components/wallet/SecaoReembolsoWallet';

type SecaoWalletId = 'saldo' | 'descontos' | 'reembolso';

function WalletPage() {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoWalletId>('saldo');

  const getItemClass = (ativo: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all cursor-pointer ${
      ativo
        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
    }`;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex items-start gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Carteira
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Controle de saldo por pagador, descontos aplicados e reembolsos.
          </p>
        </div>
      </div>

      {/* Layout com Menu Lateral + Área de Conteúdo */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <aside className="w-full lg:w-64 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3 flex flex-col gap-2">
          <span className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Carteira
          </span>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setSecaoAtiva('saldo')}
              className={getItemClass(secaoAtiva === 'saldo')}
            >
              <Scale className="w-4 h-4 shrink-0" />
              <span>Saldo</span>
            </button>

            <button
              type="button"
              onClick={() => setSecaoAtiva('descontos')}
              className={getItemClass(secaoAtiva === 'descontos')}
            >
              <TrendingDown className="w-4 h-4 shrink-0" />
              <span>Descontos</span>
            </button>

            <button
              type="button"
              onClick={() => setSecaoAtiva('reembolso')}
              className={getItemClass(secaoAtiva === 'reembolso')}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Reembolso</span>
            </button>
          </nav>
        </aside>

        <div className="flex-1 w-full min-w-0">
          {secaoAtiva === 'saldo' && <SecaoSaldoWallet />}
          {secaoAtiva === 'descontos' && <SecaoDescontosWallet />}
          {secaoAtiva === 'reembolso' && <SecaoReembolsoWallet />}
        </div>
      </div>
    </div>
  );
}

export const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallet',
  component: WalletPage,
});