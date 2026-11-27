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
  COR_FUNDO_SUAVE,
  COR_PRIMARIA,
  COR_TEXTO_SUAVE,
  formatarDataBrPdf,
  formatarMoedaComSinalPdf,
  formatarMoedaPdf,
  type CorRgb,
  type DadosPdfPrevisaoFutura,
  type ItemPrevisaoDespesa,
} from './pdfTypes';

function somarDespesasPorResponsavel(itens: ItemPrevisaoDespesa[]): {
  ressarcimentos: number;
  abates: number;
} {
  let ressarcimentos = 0;
  let abates = 0;

  for (const item of itens) {
    const resp = (item.responsavel || '').toLowerCase();
    if (resp.includes('ressarce')) {
      ressarcimentos += item.valor;
    } else if (resp.includes('desconta')) {
      abates += item.valor;
    }
  }

  return {
    ressarcimentos: Number(ressarcimentos.toFixed(2)),
    abates: Number(abates.toFixed(2)),
  };
}

export function gerarPdfPrevisaoFutura(
  payload: DadosPdfPrevisaoFutura,
  corDestaque: CorRgb
): { doc: jsPDF; nomeArquivo: string } {
  const doc = criarDocumentoA4('portrait');

  const subtitulo = [
    `Pagamento previsto: ${formatarDataBrPdf(payload.dataRecebimentoAlvo)}`,
    `Janela de origem: ${formatarDataBrPdf(payload.periodoOrigemInicio)} até ${formatarDataBrPdf(payload.periodoOrigemFim)}`,
    `Regra: ${payload.regraDescricao}`,
    payload.pagadorFiltroLabel,
  ].join('\n');

  let y = desenharCabecalhoDocumento(
    doc,
    'Previsão de Pagamento',
    subtitulo,
    corDestaque
  );

  const totalViagens = payload.viagens.reduce(
    (acc, v) => acc + v.valorLiquido,
    0
  );

  const todasDespesasPeriodo = [
    ...payload.abastecimentos,
    ...payload.manutencoes,
    ...payload.pedagios,
  ];
  const totaisDespesas = somarDespesasPorResponsavel(todasDespesasPeriodo);

  const reembolsosCarteira = payload.movimentosCarteira
    .filter((m) => m.natureza === 'ressarcimento')
    .reduce((acc, m) => acc + m.valor, 0);
  const descontosCarteira = payload.movimentosCarteira
    .filter((m) => m.natureza === 'desconto')
    .reduce((acc, m) => acc + m.valor, 0);

  const totalRessarcimentos = Number(totaisDespesas.ressarcimentos.toFixed(2));
  const totalAbatesDescontos = Number(
    (totaisDespesas.abates + descontosCarteira).toFixed(2)
  );
  const totalReembolsos = Number(reembolsosCarteira.toFixed(2));

  const totalPagamento = Number(
    (
      totalViagens +
      totalRessarcimentos -
      totalAbatesDescontos +
      totalReembolsos
    ).toFixed(2)
  );

  y = desenharCardsResumo(
    doc,
    y,
    [
      {
        label: `Viagens (${payload.viagens.length})`,
        valor: formatarMoedaPdf(totalViagens),
        destaque: 'positivo',
      },
      {
        label: 'Ressarcimentos',
        valor: `+ ${formatarMoedaPdf(totalRessarcimentos)}`,
        destaque: 'positivo',
      },
      {
        label: 'Abates / Descontos',
        valor: `- ${formatarMoedaPdf(totalAbatesDescontos)}`,
        destaque: 'negativo',
      },
      {
        label: 'Reembolsos',
        valor: `+ ${formatarMoedaPdf(totalReembolsos)}`,
        destaque: 'positivo',
      },
      {
        label: 'Total do Pagamento',
        valor: formatarMoedaComSinalPdf(totalPagamento),
        destaque: 'destaque',
      },
    ],
    corDestaque
  );

  const adicionarSecaoTabela = (
    titulo: string,
    head: string[][],
    body: string[][],
    mensagemVazia: string
  ) => {
    const alturaPagina = doc.internal.pageSize.getHeight();
    if (y > alturaPagina - 32) {
      doc.addPage();
      y = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COR_PRIMARIA);
    doc.text(titulo, MARGEM_PAGINA_PDF, y);
    y += 2;

    if (body.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.8);
      doc.setTextColor(...COR_TEXTO_SUAVE);
      doc.text(mensagemVazia, MARGEM_PAGINA_PDF, y + 3.5);
      y += 8.5;
      return;
    }

    const finalY = renderizarTabelaPadrao(doc, y, head, body, {
      styles: { fontSize: 7.6, cellPadding: 2.1 },
    });
    y = finalY + 5.5;
  };

  adicionarSecaoTabela(
    `1. Viagens Previstas (${payload.viagens.length})`,
    [
      [
        'Data',
        'Caminhão',
        'Pagador',
        'Rota / Tipo',
        'Bruto',
        'Aluguel',
        'Líquido',
      ],
    ],
    payload.viagens.map((v) => [
      formatarDataBrPdf(v.data),
      v.caminhao,
      v.pagador,
      `${v.rota} (${v.tipoGado})`,
      formatarMoedaPdf(v.valorBruto),
      formatarMoedaPdf(v.valorAluguel),
      formatarMoedaPdf(v.valorLiquido),
    ]),
    'Nenhuma viagem prevista para esta data de recebimento.'
  );

  adicionarSecaoTabela(
    `2. Abastecimentos no Período (${payload.abastecimentos.length})`,
    [['Data', 'Caminhão', 'Posto / Descrição', 'Responsável', 'Valor']],
    payload.abastecimentos.map((a) => [
      formatarDataBrPdf(a.data),
      a.caminhao,
      a.descricao,
      a.responsavel,
      formatarMoedaPdf(a.valor),
    ]),
    'Nenhum abastecimento registrado neste período.'
  );

  adicionarSecaoTabela(
    `3. Manutenções no Período (${payload.manutencoes.length})`,
    [['Data', 'Caminhão', 'Categoria / Descrição', 'Responsável', 'Valor']],
    payload.manutencoes.map((m) => [
      formatarDataBrPdf(m.data),
      m.caminhao,
      `${m.categoria} — ${m.descricao}`,
      m.responsavel,
      formatarMoedaPdf(m.valor),
    ]),
    'Nenhuma manutenção registrada neste período.'
  );

  adicionarSecaoTabela(
    `4. Pedágios no Período (${payload.pedagios.length})`,
    [['Data', 'Caminhão', 'Praça / Rodovia', 'Responsável', 'Valor']],
    payload.pedagios.map((p) => [
      formatarDataBrPdf(p.data),
      p.caminhao,
      p.descricao,
      p.responsavel,
      formatarMoedaPdf(p.valor),
    ]),
    'Nenhum pedágio registrado neste período.'
  );

  adicionarSecaoTabela(
    `5. Descontos e Reembolsos da Carteira no Período (${payload.movimentosCarteira.length})`,
    [['Data', 'Tipo', 'Pagador', 'Caminhão', 'Descrição', 'Valor']],
    payload.movimentosCarteira.map((c) => [
      formatarDataBrPdf(c.data),
      c.natureza === 'ressarcimento' ? 'Reembolso (+)' : 'Desconto (-)',
      c.pagador,
      c.caminhao,
      c.descricao,
      `${c.natureza === 'ressarcimento' ? '+' : '-'}${formatarMoedaPdf(c.valor)}`,
    ]),
    'Nenhum desconto ou reembolso na carteira neste período.'
  );

  const alturaPagina = doc.internal.pageSize.getHeight();
  if (y > alturaPagina - 55) {
    doc.addPage();
    y = 16;
  }

  renderizarTabelaPadrao(
    doc,
    y,
    [['Composição do Total do Pagamento', 'Valor']],
    [
      [`Viagens (${payload.viagens.length})`, formatarMoedaPdf(totalViagens)],
      [
        'Ressarcimentos (despesas)',
        `+ ${formatarMoedaPdf(totalRessarcimentos)}`,
      ],
      [
        'Abates e Descontos (despesas + carteira)',
        `- ${formatarMoedaPdf(totalAbatesDescontos)}`,
      ],
      ['Reembolsos (carteira)', `+ ${formatarMoedaPdf(totalReembolsos)}`],
      ['TOTAL DO PAGAMENTO', formatarMoedaComSinalPdf(totalPagamento)],
    ],
    {
      styles: { fontSize: 8, cellPadding: 2.4 },
      didParseCell: (data) => {
        if (data.row.index === 4) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = COR_FUNDO_SUAVE;
          data.cell.styles.textColor = corDestaque;
        }
      },
    }
  );

  aplicarRodapePaginacao(doc);
  return {
    doc,
    nomeArquivo: `previsao-pagamento-${payload.dataRecebimentoAlvo}.pdf`,
  };
}