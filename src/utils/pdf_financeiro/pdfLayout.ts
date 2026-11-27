import jsPDF from 'jspdf';
import autoTable, { type UserOptions } from 'jspdf-autotable';
import {
  COR_BORDA,
  COR_FUNDO_SUAVE,
  COR_PRIMARIA,
  COR_TEXTO,
  COR_TEXTO_SUAVE,
  type CorRgb,
} from './pdfTypes';

export const MARGEM_PAGINA_PDF = 14;

export interface CardResumoPdf {
  label: string;
  valor: string;
  destaque?: 'positivo' | 'negativo' | 'destaque';
}

export function criarDocumentoA4(
  orientacao: 'portrait' | 'landscape' = 'portrait'
): jsPDF {
  return new jsPDF({
    orientation: orientacao,
    unit: 'mm',
    format: 'a4',
  });
}

export function desenharCabecalhoDocumento(
  doc: jsPDF,
  tituloRelatorio: string,
  subtitulo: string,
  corDestaque: CorRgb
): number {
  const larguraPagina = doc.internal.pageSize.getWidth();
  const larguraTexto = larguraPagina - MARGEM_PAGINA_PDF * 2;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, larguraPagina, doc.internal.pageSize.getHeight(), 'F');

  doc.setFillColor(...corDestaque);
  doc.rect(0, 0, larguraPagina, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...corDestaque);
  doc.text('BACCHIEGA TRANSPORTE', MARGEM_PAGINA_PDF, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COR_TEXTO_SUAVE);
  const emitidoEm = `Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(emitidoEm, larguraPagina - MARGEM_PAGINA_PDF, 12, {
    align: 'right',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(...COR_PRIMARIA);
  doc.text(tituloRelatorio, MARGEM_PAGINA_PDF, 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COR_TEXTO_SUAVE);
  const linhasSub = doc.splitTextToSize(subtitulo, larguraTexto);
  doc.text(linhasSub, MARGEM_PAGINA_PDF, 24.5);

  const yFinal = 24.5 + linhasSub.length * 3.8 + 2.5;
  doc.setDrawColor(...COR_BORDA);
  doc.setLineWidth(0.35);
  doc.line(MARGEM_PAGINA_PDF, yFinal, larguraPagina - MARGEM_PAGINA_PDF, yFinal);

  return yFinal + 4.5;
}

export function desenharCardsResumo(
  doc: jsPDF,
  yInicial: number,
  cards: CardResumoPdf[],
  corDestaque: CorRgb
): number {
  const larguraPagina = doc.internal.pageSize.getWidth();
  const gap = 2.5;
  const larguraDisponivel = larguraPagina - MARGEM_PAGINA_PDF * 2;
  const larguraCard =
    (larguraDisponivel - gap * (cards.length - 1)) / cards.length;
  const alturaCard = 15.5;

  cards.forEach((card, idx) => {
    const x = MARGEM_PAGINA_PDF + idx * (larguraCard + gap);
    const ehDestaque = card.destaque === 'destaque';

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...(ehDestaque ? corDestaque : COR_BORDA));
    doc.setLineWidth(ehDestaque ? 0.55 : 0.3);
    doc.roundedRect(x, yInicial, larguraCard, alturaCard, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(...(ehDestaque ? corDestaque : COR_TEXTO_SUAVE));
    const labelCortado = doc.splitTextToSize(
      card.label.toUpperCase(),
      larguraCard - 4
    );
    doc.text(labelCortado[0] || card.label.toUpperCase(), x + 2.5, yInicial + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    if (card.destaque === 'positivo') {
      doc.setTextColor(5, 150, 105);
    } else if (card.destaque === 'negativo') {
      doc.setTextColor(225, 29, 72);
    } else if (ehDestaque) {
      doc.setTextColor(...corDestaque);
    } else {
      doc.setTextColor(...COR_PRIMARIA);
    }
    doc.text(card.valor, x + 2.5, yInicial + 12);
  });

  return yInicial + alturaCard + 5.5;
}

export function obterFinalTabelaY(doc: jsPDF, fallbackY: number): number {
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable?.finalY;
  return finalY || fallbackY;
}

export function renderizarTabelaPadrao(
  doc: jsPDF,
  startY: number,
  head: string[][],
  body: string[][],
  opcoesExtras?: Partial<UserOptions>
): number {
  autoTable(doc, {
    startY,
    head,
    body,
    margin: {
      left: MARGEM_PAGINA_PDF,
      right: MARGEM_PAGINA_PDF,
      bottom: 18,
    },
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      textColor: COR_TEXTO,
      cellPadding: 2.3,
      lineColor: COR_BORDA,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COR_PRIMARIA,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COR_FUNDO_SUAVE,
    },
    ...opcoesExtras,
  });

  return obterFinalTabelaY(doc, startY + 12);
}

export function aplicarRodapePaginacao(doc: jsPDF): void {
  const totalPaginas = doc.getNumberOfPages();
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COR_BORDA);
    doc.setLineWidth(0.3);
    doc.line(
      MARGEM_PAGINA_PDF,
      alturaPagina - 12,
      larguraPagina - MARGEM_PAGINA_PDF,
      alturaPagina - 12
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COR_TEXTO_SUAVE);
    doc.text(
      'Bacchiega Transporte • Gestão Financeira e Logística',
      MARGEM_PAGINA_PDF,
      alturaPagina - 7.5
    );
    doc.text(
      `Página ${i} de ${totalPaginas}`,
      larguraPagina - MARGEM_PAGINA_PDF,
      alturaPagina - 7.5,
      { align: 'right' }
    );
  }
}