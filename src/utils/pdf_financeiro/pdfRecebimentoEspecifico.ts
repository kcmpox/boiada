import type jsPDF from 'jspdf';
import {
  aplicarRodapePaginacao,
  criarDocumentoA4,
  desenharCabecalhoDocumento,
  desenharCardsResumo,
  MARGEM_PAGINA_PDF,
  renderizarTabelaPadrao,
} from './pdfLayout';
import {
  COR_PRIMARIA,
  COR_TEXTO,
  formatarDataBrPdf,
  formatarMoedaComSinalPdf,
  formatarMoedaPdf,
  type CorRgb,
  type DadosPdfRecebimentoEspecifico,
} from './pdfTypes';

export function gerarPdfRecebimentoEspecifico(
  payload: DadosPdfRecebimentoEspecifico,
  corDestaque: CorRgb
): { doc: jsPDF; nomeArquivo: string } {
  const doc = criarDocumentoA4('portrait');
  const rec = payload.recebimento;

  let y = desenharCabecalhoDocumento(
    doc,
    'Detalhamento de Recebimento',
    `Pagador: ${rec.pagadorNome} • Caminhão: ${rec.caminhaoNome} • Data do pagamento: ${formatarDataBrPdf(rec.dataPagamento)}`,
    corDestaque
  );

  const esp =
    typeof rec.valorEsperadoAcerto === 'number'
      ? rec.valorEsperadoAcerto
      : rec.liquidoCalculado || 0;
  const apu =
    typeof rec.liquidoCalculado === 'number'
      ? rec.liquidoCalculado
      : rec.valorEfetivamentePago || 0;

  y = desenharCardsResumo(
    doc,
    y,
    [
      { label: 'Valor Esperado', valor: formatarMoedaPdf(esp) },
      { label: 'Líquido Apurado', valor: formatarMoedaPdf(apu) },
      {
        label: 'Valor Recebido',
        valor: formatarMoedaPdf(rec.valorEfetivamentePago || 0),
        destaque: 'positivo',
      },
      {
        label: 'Saldo Pagador',
        valor: formatarMoedaComSinalPdf(rec.novoSaldoPagador || 0),
        destaque: (rec.novoSaldoPagador || 0) >= 0 ? 'positivo' : 'negativo',
      },
    ],
    corDestaque
  );

  y =
    renderizarTabelaPadrao(
      doc,
      y,
      [['Composição do Fechamento', 'Valor']],
      [
        [
          `Viagens (${rec.viagens?.length || 0})`,
          formatarMoedaPdf(rec.totalViagens || 0),
        ],
        [
          'Reembolsos / Ressarcimentos',
          `+ ${formatarMoedaPdf(rec.totalRessarcimentos || 0)}`,
        ],
        ['Descontos', `- ${formatarMoedaPdf(rec.totalDescontos || 0)}`],
        [
          `Saldo anterior do pagador (${rec.compensouSaldoAnterior ? 'compensado' : 'não compensado'})`,
          formatarMoedaComSinalPdf(rec.saldoAnteriorPagador || 0),
        ],
        [
          'Diferença (apurado vs. esperado)',
          formatarMoedaComSinalPdf(rec.diferencaAcerto || 0),
        ],
      ],
      { styles: { fontSize: 8.2, cellPadding: 2.5 } }
    ) + 6;

  if ((rec.viagens?.length || 0) > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_PRIMARIA);
    doc.text(
      `Viagens Incluídas (${rec.viagens.length})`,
      MARGEM_PAGINA_PDF,
      y
    );
    y += 2.5;

    y =
      renderizarTabelaPadrao(
        doc,
        y,
        [['Data', 'Rota', 'Tipo', 'Esperado', 'Recebido']],
        rec.viagens.map((v) => [
          formatarDataBrPdf(v.dataViagem),
          v.descricaoRota,
          v.tipoGado,
          formatarMoedaPdf(v.valorEsperado),
          formatarMoedaPdf(v.valorRecebido),
        ]),
        { styles: { fontSize: 8, cellPadding: 2.4 } }
      ) + 6;
  }

  if ((rec.despesas?.length || 0) > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_PRIMARIA);
    doc.text(
      `Despesas Vinculadas (${rec.despesas.length})`,
      MARGEM_PAGINA_PDF,
      y
    );
    y += 2.5;

    y =
      renderizarTabelaPadrao(
        doc,
        y,
        [['Data', 'Tipo', 'Descrição', 'Natureza', 'Valor']],
        rec.despesas.map((d) => [
          formatarDataBrPdf(d.data),
          d.tipo,
          d.descricao,
          d.natureza === 'ressarcimento'
            ? 'Ressarcimento (+)'
            : 'Desconto (-)',
          `${d.natureza === 'ressarcimento' ? '+' : '-'}${formatarMoedaPdf(d.valorConsiderado)}`,
        ]),
        { styles: { fontSize: 8, cellPadding: 2.4 } }
      ) + 6;
  }

  if ((rec.avulsos?.length || 0) > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_PRIMARIA);
    doc.text(
      `Descontos e Reembolsos (${rec.avulsos.length})`,
      MARGEM_PAGINA_PDF,
      y
    );
    y += 2.5;

    y =
      renderizarTabelaPadrao(
        doc,
        y,
        [['Descrição', 'Natureza', 'Valor']],
        rec.avulsos.map((a) => [
          a.descricao,
          a.natureza === 'ressarcimento' ? 'Reembolso (+)' : 'Desconto (-)',
          `${a.natureza === 'ressarcimento' ? '+' : '-'}${formatarMoedaPdf(a.valor)}`,
        ]),
        { styles: { fontSize: 8, cellPadding: 2.4 } }
      ) + 6;
  }

  if (rec.observacoes) {
    if (y > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      y = 16;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COR_PRIMARIA);
    doc.text('Observações:', MARGEM_PAGINA_PDF, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_TEXTO);
    const obsLinhas = doc.splitTextToSize(
      rec.observacoes,
      doc.internal.pageSize.getWidth() - MARGEM_PAGINA_PDF * 2
    );
    doc.text(obsLinhas, MARGEM_PAGINA_PDF, y + 4.5);
  }

  aplicarRodapePaginacao(doc);
  return {
    doc,
    nomeArquivo: `recebimento-${rec.pagadorNome.toLowerCase().replace(/\s+/g, '-')}-${rec.dataPagamento}.pdf`,
  };
}