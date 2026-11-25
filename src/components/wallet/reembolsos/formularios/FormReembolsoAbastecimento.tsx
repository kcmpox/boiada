import { FormReembolsoPadrao } from './FormReembolsoPadrao';
import type { OpcaoPagadorForm } from '../../descontos/formularios/FormDescontoAbastecimento';

interface FormReembolsoAbastecimentoProps {
  pagadores: OpcaoPagadorForm[];
  onSalvo: () => void;
  onVoltarTipo: () => void;
}

export function FormReembolsoAbastecimento(
  props: FormReembolsoAbastecimentoProps
) {
  return (
    <FormReembolsoPadrao
      {...props}
      tipo="abastecimento"
      tituloTipo="Abastecimento"
      placeholderDescricao="Ex.: Ressarcimento diesel / cupom de abastecimento"
    />
  );
}