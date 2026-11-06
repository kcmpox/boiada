import { EmConstrucao } from '../../EmConstrucao';

interface ManutencoesCaminhaoProps {
  caminhaoId: string;
  nome?: string;
  placa?: string;
}

export function ManutencoesCaminhao({
  caminhaoId,
  nome,
  placa,
}: ManutencoesCaminhaoProps) {
  const titulo = nome
    ? `Manutenções — ${nome}${placa ? ` (${placa})` : ''}`
    : `Manutenções — Caminhão #${caminhaoId}`;

  return (
    <EmConstrucao
      titulo={titulo}
      descricao="Histórico de oficina, trocas de óleo, pneus e revisões preventivas deste veículo."
    />
  );
}