import type jsPDF from 'jspdf';
import {
  obterCorDestaqueConfigurada,
  type PayloadGeracaoPdfFinanceiro,
} from './pdf_financeiro/pdfTypes';
import { gerarPdfTodosRecebimentos } from './pdf_financeiro/pdfTodosRecebimentos';
import { gerarPdfPrevisaoFutura } from './pdf_financeiro/pdfPrevisaoFutura';
import { gerarPdfDescontosReembolsos } from './pdf_financeiro/pdfDescontosReembolsos';
import { gerarPdfRecebimentoEspecifico } from './pdf_financeiro/pdfRecebimentoEspecifico';

export * from './pdf_financeiro/pdfTypes';

export function gerarDocumentoPdfFinanceiro(
  payload: PayloadGeracaoPdfFinanceiro
): { doc: jsPDF; nomeArquivo: string } {
  const corDestaque = obterCorDestaqueConfigurada();

  switch (payload.tipo) {
    case 'todos_recebimentos':
      return gerarPdfTodosRecebimentos(payload, corDestaque);
    case 'previsao_futura':
      return gerarPdfPrevisaoFutura(payload, corDestaque);
    case 'descontos_reembolsos':
      return gerarPdfDescontosReembolsos(payload, corDestaque);
    case 'recebimento_especifico':
      return gerarPdfRecebimentoEspecifico(payload, corDestaque);
  }
}