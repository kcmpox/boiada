import { FormReembolsoPadrao } from './FormReembolsoPadrao';
import type { OpcaoPagadorForm } from '../../descontos/formularios/FormDescontoAbastecimento';

interface FormReembolsoPedagioProps {
  pagadores: OpcaoPagadorForm[];
  onSalvo: () => void;
  onVoltarTipo: () => void;
}

export function FormReembolsoPedagio(props: FormReembolsoPedagioProps) {
  return (
    <FormReembolsoPadrao
      {...props}
      tipo="pedagio"
      tituloTipo="Pedágio"
      placeholderDescricao="Ex.: Ressarcimento pedágio Sem Parar / Praça"
    />
  );
}