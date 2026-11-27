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
  COLUNAS_TODOS_RECEBIMENTOS,
  COR_PRIMARIA,
  formatarDataBrPdf,
  formatarMoedaComSinalPdf,
  formatarMoedaPdf,
  type CorRgb,
  type DadosPdfTodosRecebimentos,
} from './pdfTypes';

export function gerarPdfTodosRecebimentos(
  payload: DadosPdfTodosRecebimentos,
  corDestaque: CorRgb
): { doc: jsPDF; nomeArquivo: string } {
  const doc = criarDocumentoA4('landscape');

  const subtituloFormatado = payload.subtituloFiltros
    .split(' • ')
    .map((linha) => linha.trim())
    .filter(Boolean)
    .join('\n');

  let y = desenharCabecalhoDocumento(
    doc,
    'Relatório de Recebimentos',
    subtituloFormatado,
    corDestaque
  );

  const totalEsperado = payload.recebimentos.reduce(
    (acc, r) =>
      acc +
      (typeof r.valorEsperadoAcerto === 'number'
        ? r.valorEsperadoAcerto
        : r.liquidoCalculado || 0),
    0
  );
  const totalApurado = payload.recebimentos.reduce(
    (acc, r) =>
      acc +
      (typeof r.liquidoCalculado === 'number'
        ? r.liquidoCalculado
        : r.valorEfetivamentePago || 0),
    0
  );
  const totalRecebido = payload.recebimentos.reduce(
    (acc, r) => acc + (r.valorEfetivamentePago || 0),
    0
  );
  const totalDiferenca = Number((totalApurado - totalEsperado).toFixed(2));

  y = desenharCardsResumo(
    doc,
    y,
    [
      {
        label: 'Fechamentos',
        valor: String(payload.recebimentos.length),
      },
      {
        label: 'Total Esperado',
        valor: formatarMoedaPdf(totalEsperado),
      },
      {
        label: 'Líquido Apurado',
        valor: formatarMoedaPdf(totalApurado),
      },
      {
        label: 'Diferença',
        valor:
          Math.abs(totalDiferenca) < 0.01
            ? 'R$ 0,00'
            : formatarMoedaComSinalPdf(totalDiferenca),
        destaque:
          Math.abs(totalDiferenca) < 0.01
            ? undefined
            : totalDiferenca > 0
              ? 'positivo'
              : 'negativo',
      },
      {
        label: 'Total Recebido',
        valor: formatarMoedaPdf(totalRecebido),
        destaque: 'destaque',
      },
    ],
    corDestaque
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COR_PRIMARIA);
  doc.text(
    `Fechamentos Registrados (${payload.recebimentos.length})`,
    MARGEM_PAGINA_PDF,
    y
  );
  y += 2;

  const colunasAtivas = COLUNAS_TODOS_RECEBIMENTOS.filter((c) =>
    payload.colunasVisiveis.includes(c.id)
  );

  const head = [colunasAtivas.map((c) => c.label)];
  const body = payload.recebimentos.map((rec) => {
    const esp =
      typeof rec.valorEsperadoAcerto === 'number'
        ? rec.valorEsperadoAcerto
        : rec.liquidoCalculado || 0;
    const apu =
      typeof rec.liquidoCalculado === 'number'
        ? rec.liquidoCalculado
        : rec.valorEfetivamentePago || 0;
    const receb = rec.valorEfetivamentePago || 0;
    const dif =
      typeof rec.diferencaAcerto === 'number'
        ? rec.diferencaAcerto
        : apu - esp;

    return colunasAtivas.map((col) => {
      switch (col.id) {
        case 'dataPagamento':
          return formatarDataBrPdf(rec.dataPagamento);
        case 'pagador':
          return rec.pagadorNome;
        case 'caminhao':
          return rec.caminhaoNome;
        case 'itens':
          return `${rec.viagens?.length || 0}v • ${rec.despesas?.length || 0}d • ${rec.avulsos?.length || 0}a`;
        case 'valorEsperado':
          return formatarMoedaPdf(esp);
        case 'liquidoApurado':
          return formatarMoedaPdf(apu);
        case 'valorRecebido':
          return formatarMoedaPdf(receb);
        case 'diferenca':
          return Math.abs(dif) < 0.01
            ? 'R$ 0,00'
            : formatarMoedaComSinalPdf(dif);
        case 'saldoPagador':
          return formatarMoedaComSinalPdf(rec.novoSaldoPagador || 0);
      }
    });
  });

  renderizarTabelaPadrao(doc, y, head, body, {
    styles: { fontSize: 7.8, cellPadding: 2.3 },
    headStyles: {
      fillColor: COR_PRIMARIA,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
    },
  });

  aplicarRodapePaginacao(doc);
  return {
    doc,
    nomeArquivo: `relatorio-recebimentos-${new Date().toISOString().slice(0, 10)}.pdf`,
  };
}