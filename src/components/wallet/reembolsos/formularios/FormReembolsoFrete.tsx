import { FormReembolsoPadrao } from './FormReembolsoPadrao';
import type { OpcaoPagadorForm } from '../../descontos/formularios/FormDescontoAbastecimento';

interface FormReembolsoFreteProps {
  pagadores: OpcaoPagadorForm[];
  onSalvo: () => void;
  onVoltarTipo: () => void;
}

export function FormReembolsoFrete(props: FormReembolsoFreteProps) {
  return (
    <FormReembolsoPadrao
      {...props}
      tipo="frete"
      tituloTipo="Frete"
      placeholderDescricao="Ex.: Diferença de frete / estadia / CTe"
    />
  );
}