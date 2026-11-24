import { useEffect, useState } from 'react';
import {
  createRootRoute,
  Link,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import {
  LayoutDashboard,
  Truck,
  Receipt,
  Wallet,
  Database,
  Settings,
  FolderSync,
  Sun,
  Moon,
  Code2,
} from 'lucide-react';
import { carregarCorSalva } from '../theme';
import { CommandPalette } from '../components/CommandPalette';
import { DevModeProvider, useDevMode } from '../context/DevModeContext';

function RootShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { devMode, setDevMode } = useDevMode();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('bt_theme') === 'dark';
  });

  useEffect(() => {
    carregarCorSalva();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('bt_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('bt_theme', 'light');
    }
  }, [darkMode]);

  const navItems = [
    { to: '/', label: 'Início', icon: LayoutDashboard },
    { to: '/viagens', label: 'Viagens', icon: Truck },
    { to: '/despesas', label: 'Despesas', icon: Receipt },
    { to: '/financeiro', label: 'Financeiro', icon: Wallet },
    { to: '/cadastros', label: 'Cadastros', icon: Database },
  ] as const;

  const isConfigActive = pathname === '/configuracoes';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <CommandPalette
        onChangeTheme={setDarkMode}
        onChangeDevMode={setDevMode}
      />

      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center text-brand-contrast font-black shadow-sm transition-colors">
            BT
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight leading-none">
              Bacchiega
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">
              Transporte Boiadeiro
            </span>
          </div>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Menu Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500 text-brand-contrast font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-brand-contrast' : 'text-slate-400'}`}
                />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 m-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Frota Ativa</span>
            <span className="text-white font-semibold">2 Caminhões</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800">
            <FolderSync className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="truncate">Armazenamento Local</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 transition-colors">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Sistema de Controle Operacional e Financeiro
          </div>

          <div className="flex items-center gap-2.5">
            {devMode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                <Code2 className="w-3.5 h-3.5" />
                DEVMODE
              </span>
            )}

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mr-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Modo Local
            </span>

            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              aria-label="Alternar tema"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-brand-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/configuracoes"
              title="Configurações"
              aria-label="Configurações"
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                isConfigActive
                  ? 'bg-brand-500 border-brand-500 text-brand-contrast shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RootLayout() {
  return (
    <DevModeProvider>
      <RootShell />
    </DevModeProvider>
  );
}

export const rootRoute = createRootRoute({
  component: RootLayout,
});