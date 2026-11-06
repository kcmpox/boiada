import { EmConstrucao } from '../../EmConstrucao';

interface PedagiosCaminhaoProps {
  caminhaoId: string;
  nome?: string;
  placa?: string;
}

export function PedagiosCaminhao({
  caminhaoId,
  nome,
  placa,
}: PedagiosCaminhaoProps) {
  const titulo = nome
    ? `Pedágios — ${nome}${placa ? ` (${placa})` : ''}`
    : `Pedágios — Caminhão #${caminhaoId}`;

  return (
    <EmConstrucao
      titulo={titulo}
      descricao="Histórico de praças, eixos cobrados e valores de pedágio deste veículo."
    />
  );
}