import { EmConstrucao } from '../../EmConstrucao';

interface AbastecimentosCaminhaoProps {
  caminhaoId: string;
  nome?: string;
  placa?: string;
}

export function AbastecimentosCaminhao({
  caminhaoId,
  nome,
  placa,
}: AbastecimentosCaminhaoProps) {
  const titulo = nome
    ? `Abastecimentos — ${nome}${placa ? ` (${placa})` : ''}`
    : `Abastecimentos — Caminhão #${caminhaoId}`;

  return (
    <EmConstrucao
      titulo={titulo}
      descricao="Controlo individual de diesel, Arla 32, litragem e consumo médio deste veículo."
    />
  );
}