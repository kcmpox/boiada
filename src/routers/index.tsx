import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { EmConstrucao } from '../components/EmConstrucao';

function IndexPage() {
  return (
    <EmConstrucao
      modulo="Visão Geral"
      titulo="Painel Operacional"
      subtitulo="Acompanhamento consolidado da frota, viagens em andamento e resultados."
      descricao="Aqui serão exibidos os indicadores de faturamento bruto, despesas por caminhão, viagens recentes e alertas de acertos pendentes com transportadoras."
    />
  );
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});