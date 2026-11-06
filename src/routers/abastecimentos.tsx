import { createRoute, Link, Outlet } from '@tanstack/react-router';
import { Fuel, Archive, AlertCircle, Truck } from 'lucide-react';
import { rootRoute } from './root';
import * as cadastrosStorage from '../storage/cadastrosStorage';

interface CaminhaoItem {
  id: string | number;
  nome?: string;
  apelido?: string;
  placa?: string;
  ativo?: boolean;
}

function obterCaminhoes(): CaminhaoItem[] {
  const storage = cadastrosStorage as Record<string, unknown>;

  // Tenta encontrar a função de leitura exportada em cadastrosStorage.ts
  const fn =
    storage.getCaminhoes ||
    storage.loadCadastros ||
    storage.getCadastros ||
    storage.carregarCadastros;

  if (typeof fn === 'function') {
    const resultado = fn();
    if (Array.isArray(resultado)) return resultado;
    if (resultado && typeof resultado === 'object' && 'caminhoes' in resultado) {
      const lista = (resultado as { caminhoes?: CaminhaoItem[] }).caminhoes;
      if (Array.isArray(lista)) return lista;
    }
  }

  return [];
}

export const abastecimentosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'abastecimentos',
  component: AbastecimentosLayout,
});

function AbastecimentosLayout() {
  const caminhoes = obterCaminhoes().filter((c) => c.ativo !== false);

  const linkClass =
    'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800';
  const activeLinkClass =
    'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold';

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-6 shrink-0">
        <div>
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Abastecimentos
          </span>
          <nav className="mt-2 flex flex-col gap-1">
            <Link
              to="/abastecimentos"
              activeOptions={{ exact: true }}
              className={linkClass}
              activeProps={{ className: activeLinkClass }}
            >
              <Fuel className="w-4 h-4 shrink-0" />
              Todos os Abastecimentos
            </Link>

            <Link
              to="/abastecimentos/arquivados"
              className={linkClass}
              activeProps={{ className: activeLinkClass }}
            >
              <Archive className="w-4 h-4 shrink-0" />
              Arquivados
            </Link>

            <Link
              to="/abastecimentos/viagens-sem-abastecimentos"
              className={linkClass}
              activeProps={{ className: activeLinkClass }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              Viagens Sem Abastecimentos
            </Link>
          </nav>
        </div>

        <div>
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Por Caminhão
          </span>
          <nav className="mt-2 flex flex-col gap-1">
            {caminhoes.length === 0 ? (
              <span className="px-3 py-2 text-xs text-zinc-500">
                Nenhum caminhão cadastrado
              </span>
            ) : (
              caminhoes.map((caminhao) => {
                const rotulo = caminhao.nome || caminhao.apelido || 'Caminhão';
                return (
                  <Link
                    key={caminhao.id}
                    to="/abastecimentos/caminhao/$caminhaoId"
                    params={{ caminhaoId: String(caminhao.id) }}
                    className={linkClass}
                    activeProps={{ className: activeLinkClass }}
                  >
                    <Truck className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {rotulo} {caminhao.placa ? `(${caminhao.placa})` : ''}
                    </span>
                  </Link>
                );
              })
            )}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}