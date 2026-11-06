import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './routers/root';
import { indexRoute } from './routers/index';
import { viagensRoute } from './routers/viagens';
import { despesasRoute } from './routers/despesas';
import { financeiroRoute } from './routers/financeiro';
import { cadastrosRoute } from './routers/cadastros';
import { configuracoesRoute } from './routers/configuracoes';

const routeTree = rootRoute.addChildren([
  indexRoute,
  viagensRoute,
  despesasRoute,
  financeiroRoute,
  cadastrosRoute,
  configuracoesRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}