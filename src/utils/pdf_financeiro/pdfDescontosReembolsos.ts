import type jsPDF from 'jspdf';
import {
  aplicarRodapePaginacao,
  criarDocumentoA4,
  desenharCabecalhoDocumento,
  desenharCardsResumo,
  renderizarTabelaPadrao,
} from './pdfLayout';
import {
  formatarDataBrPdf,
  formatarMoedaComSinalPdf,
  formatarMoedaPdf,
  type CorRgb,
  type DadosPdfDescontosReembolsos,
} from './pdfTypes';

export function gerarPdfDescontosReembolsos(
  payload: DadosPdfDescontosReembolsos,
  corDestaque: CorRgb
): { doc: jsPDF; nomeArquivo: string } {
  const doc = criarDocumentoA4('portrait');

  let y = desenharCabecalhoDocumento(
    doc,
    'Relatório de Descontos e Reembolsos na Carteira',
    payload.subtituloFiltros,
    corDestaque
  );

  const totalReembolsos = payload.itens
    .filter((i) => i.natureza === 'ressarcimento')
    .reduce((acc, i) => acc + i.valor, 0);
  const totalDescontos = payload.itens
    .filter((i) => i.natureza === 'desconto')
    .reduce((acc, i) => acc + i.valor, 0);
  const saldoLiquido = totalReembolsos - totalDescontos;

  y = desenharCardsResumo(
    doc,
    y,
    [
      { label: 'Lançamentos', valor: String(payload.itens.length) },
      {
        label: 'Total Reembolsos (+)',
        valor: formatarMoedaPdf(totalReembolsos),
        destaque: 'positivo',
      },
      {
        label: 'Total Descontos (-)',
        valor: formatarMoedaPdf(totalDescontos),
        destaque: 'negativo',
      },
      {
        label: 'Saldo Líquido',
        valor: formatarMoedaComSinalPdf(saldoLiquido),
        destaque: saldoLiquido >= 0 ? 'positivo' : 'negativo',
      },
    ],
    corDestaque
  );

  renderizarTabelaPadrao(
    doc,
    y,
    [['Data', 'Natureza', 'Pagador', 'Caminhão', 'Descrição', 'Valor']],
    payload.itens.map((item) => [
      formatarDataBrPdf(item.data),
      item.natureza === 'ressarcimento' ? 'Reembolso (+)' : 'Desconto (-)',
      item.pagador,
      item.caminhao,
      item.descricao,
      `${item.natureza === 'ressarcimento' ? '+' : '-'}${formatarMoedaPdf(item.valor)}`,
    ]),
    {
      styles: { fontSize: 8, cellPadding: 2.6 },
    }
  );

  aplicarRodapePaginacao(doc);
  return {
    doc,
    nomeArquivo: `descontos-reembolsos-carteira-${new Date().toISOString().slice(0, 10)}.pdf`,
  };
}