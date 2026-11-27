import { useEffect, useMemo, useState } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  CalendarClock,
  Wallet,
  Receipt,
  Eye,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  listarRecebimentos,
  type RegistroRecebimento,
} from '../../../storage/recebimentosStorage';
import {
  listarCaminhoes,
  listarFrigorificos,
  listarIntermediarios,
} from '../../../storage/cadastrosStorage';
import {
  gerarDocumentoPdfFinanceiro,
  type PayloadGeracaoPdfFinanceiro,
  type TipoRelatorioFinanceiro,
} from '../../../utils/pdfFinanceiroGenerator';
import {
  extrairRegrasPagamentoDasTabelas,
  gerarOpcoesDatasFuturas,
  type CaminhaoFiltroOption,
  type FiltroInicialRecebimentosPDF,
  type OpcaoDataPrevisao,
  type PagadorFiltroOption,
} from './relatorios_pdf/types';
import { RelatorioTodosRecebimentos } from './relatorios_pdf/RelatorioTodosRecebimentos';
import { RelatorioPrevisaoFutura } from './relatorios_pdf/RelatorioPrevisaoFutura';
import { RelatorioDescontosReembolsos } from './relatorios_pdf/RelatorioDescontosReembolsos';
import { RelatorioRecebimentoEspecifico } from './relatorios_pdf/RelatorioRecebimentoEspecifico';

export type { FiltroInicialRecebimentosPDF };

interface ModalRecebimentosPDFProps {
  aberto: boolean;
  filtroInicial?: FiltroInicialRecebimentosPDF | null;
  onFechar: () => void;
}

const MODELOS_RELATORIO = [
  {
    id: 'todos_recebimentos',
    titulo: 'Todos os Recebimentos',
    desc: 'Lista filtrada com colunas configuráveis',
    icone: Receipt,
  },
  {
    id: 'previsao_futura',
    titulo: 'Previsão Futura',
    desc: 'Viagens e despesas por data prevista',
    icone: CalendarClock,
  },
  {
    id: 'descontos_reembolsos',
    titulo: 'Descontos e Reembolsos',
    desc: 'Movimentos ativos na carteira',
    icone: Wallet,
  },
  {
    id: 'recebimento_especifico',
    titulo: 'Recebimento Específico',
    desc: 'Ficha detalhada de um fechamento',
    icone: Eye,
  },
] as const;

export function ModalRecebimentosPDF({
  aberto,
  filtroInicial,
  onFechar,
}: ModalRecebimentosPDFProps) {
  const [tipoRelatorio, setTipoRelatorio] =
    useState<TipoRelatorioFinanceiro>('todos_recebimentos');
  const [payloadAtual, setPayloadAtual] =
    useState<PayloadGeracaoPdfFinanceiro | null>(null);
  const [haFiltrosAtivos, setHaFiltrosAtivos] = useState(false);
  const [sinalLimpar, setSinalLimpar] = useState(0);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const dadosBase = useMemo(() => {
    if (!aberto) {
      return {
        recebimentos: [] as RegistroRecebimento[],
        caminhoes: [] as CaminhaoFiltroOption[],
        pagadores: [] as PagadorFiltroOption[],
        mapaCaminhoes: new Map<string, string>(),
        mapaPagadores: new Map<string, string>(),
        opcoesPrevisao: [] as OpcaoDataPrevisao[],
      };
    }

    const recs = listarRecebimentos()
      .filter((r) => !r.arquivado)
      .sort((a, b) =>
        (b.dataPagamento || '').localeCompare(a.dataPagamento || '')
      );

    const mapaCaminhoes = new Map<string, string>();
    for (const c of listarCaminhoes()) {
      mapaCaminhoes.set(
        String(c.id),
        `${c.nome}${c.placa ? ` (${c.placa})` : ''}`
      );
    }

    const mapaPagadores = new Map<string, string>();
    const pagadoresLista: PagadorFiltroOption[] = [];
    for (const f of listarFrigorificos()) {
      const chave = `frigorifico:${f.id}`;
      mapaPagadores.set(chave, f.nome);
      pagadoresLista.push({ chave, nome: `${f.nome} (Frigorífico)` });
    }
    for (const i of listarIntermediarios()) {
      const chave = `intermediario:${i.id}`;
      mapaPagadores.set(chave, i.nome);
      pagadoresLista.push({ chave, nome: `${i.nome} (Intermediário)` });
    }

    const regras = extrairRegrasPagamentoDasTabelas();
    const opcoesPrevisao = gerarOpcoesDatasFuturas(regras, new Date());

    return {
      recebimentos: recs,
      caminhoes: Array.from(mapaCaminhoes.entries()).map(([id, nome]) => ({
        id,
        nome,
      })),
      pagadores: pagadoresLista,
      mapaCaminhoes,
      mapaPagadores,
      opcoesPrevisao,
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    setTipoRelatorio('todos_recebimentos');
    setSinalLimpar(0);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, onFechar]);

  useEffect(() => {
    if (!aberto || !payloadAtual) {
      setPdfPreviewUrl(null);
      return;
    }

    const { doc } = gerarDocumentoPdfFinanceiro(payloadAtual);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [aberto, payloadAtual]);

  const handleBaixarPdf = () => {
    if (!payloadAtual) return;
    const { doc, nomeArquivo } = gerarDocumentoPdfFinanceiro(payloadAtual);
    doc.save(nomeArquivo);
  };

  const handleImprimirPdf = () => {
    if (!payloadAtual) return;
    const { doc } = gerarDocumentoPdfFinanceiro(payloadAtual);
    doc.autoPrint();
    const url = doc.output('bloburl');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-relatorios-pdf"
      onClick={onFechar}
    >
      <div
        className="w-[96vw] h-[93vh] max-w-7xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="titulo-modal-relatorios-pdf"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white"
              >
                Central de Relatórios e Impressões (PDF)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escolha o modelo de relatório, ajuste os filtros e visualize o documento antes de baixar ou imprimir
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor Inicial do Tipo de Relatório */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {MODELOS_RELATORIO.map((item) => {
              const Icone = item.icone;
              const ativo = tipoRelatorio === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTipoRelatorio(item.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    ativo
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-500/10 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      ativo
                        ? 'bg-brand-500 text-brand-contrast'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.titulo}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Corpo: Parâmetros à Esquerda + Prévia em Fundo Branco à Direita */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          <div className="w-full lg:w-88 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-4 overflow-y-auto space-y-4 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Filter className="w-3.5 h-3.5 text-brand-500" />
                Parâmetros do Relatório
              </span>

              {haFiltrosAtivos && (
                <button
                  type="button"
                  onClick={() => setSinalLimpar((n) => n + 1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar
                </button>
              )}
            </div>

            {tipoRelatorio === 'todos_recebimentos' && (
              <RelatorioTodosRecebimentos
                payload={payloadAtual}
                onPayloadChange={setPayloadAtual}
                onFiltrosAtivosChange={setHaFiltrosAtivos}
                sinalLimpar={sinalLimpar}
                recebimentos={dadosBase.recebimentos}
                caminhoes={dadosBase.caminhoes}
                pagadores={dadosBase.pagadores}
                mapaCaminhoes={dadosBase.mapaCaminhoes}
                mapaPagadores={dadosBase.mapaPagadores}
                filtroInicial={filtroInicial}
              />
            )}

            {tipoRelatorio === 'previsao_futura' && (
              <RelatorioPrevisaoFutura
                payload={payloadAtual}
                onPayloadChange={setPayloadAtual}
                onFiltrosAtivosChange={setHaFiltrosAtivos}
                sinalLimpar={sinalLimpar}
                opcoesPrevisao={dadosBase.opcoesPrevisao}
                pagadores={dadosBase.pagadores}
                mapaCaminhoes={dadosBase.mapaCaminhoes}
                mapaPagadores={dadosBase.mapaPagadores}
              />
            )}

            {tipoRelatorio === 'descontos_reembolsos' && (
              <RelatorioDescontosReembolsos
                payload={payloadAtual}
                onPayloadChange={setPayloadAtual}
                onFiltrosAtivosChange={setHaFiltrosAtivos}
                sinalLimpar={sinalLimpar}
                caminhoes={dadosBase.caminhoes}
                pagadores={dadosBase.pagadores}
                mapaCaminhoes={dadosBase.mapaCaminhoes}
                mapaPagadores={dadosBase.mapaPagadores}
              />
            )}

            {tipoRelatorio === 'recebimento_especifico' && (
              <RelatorioRecebimentoEspecifico
                payload={payloadAtual}
                onPayloadChange={setPayloadAtual}
                onFiltrosAtivosChange={setHaFiltrosAtivos}
                recebimentos={dadosBase.recebimentos}
              />
            )}
          </div>

          {/* Pré-visualização Real do PDF Gerado em Fundo Branco */}
          <div className="flex-1 bg-slate-200/80 dark:bg-slate-900 p-3 sm:p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2 shrink-0">
              <span className="font-semibold">
                Pré-visualização do Documento (Fundo Branco A4)
              </span>
            </div>

            <div className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white overflow-hidden shadow-inner">
              {pdfPreviewUrl ? (
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                  title="Prévia do relatório em PDF"
                  className="w-full h-full bg-white"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 bg-white">
                  Selecione um relatório válido para visualizar o PDF.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé com Ações de Imprimir / Baixar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={!payloadAtual}
              onClick={handleImprimirPdf}
              className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>

            <button
              type="button"
              disabled={!payloadAtual}
              onClick={handleBaixarPdf}
              className="h-9 px-4 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}