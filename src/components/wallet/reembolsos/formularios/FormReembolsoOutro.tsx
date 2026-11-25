import { FormReembolsoPadrao } from './FormReembolsoPadrao';
import type { OpcaoPagadorForm } from '../../descontos/formularios/FormDescontoAbastecimento';

interface FormReembolsoOutroProps {
  pagadores: OpcaoPagadorForm[];
  onSalvo: () => void;
  onVoltarTipo: () => void;
}

export function FormReembolsoOutro(props: FormReembolsoOutroProps) {
  return (
    <FormReembolsoPadrao
      {...props}
      tipo="outro"
      tituloTipo="Outro"
      placeholderDescricao="Descreva o reembolso..."
    />
  );
}