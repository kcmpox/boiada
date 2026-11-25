import { useState } from 'react';
import {
  History,
  X,
  Calendar,
  ArrowLeftRight,
  ArrowRight,
  Route,
  Gauge,
  Percent,
  RotateCcw,
  Trash2,
  FileText,
  Check,
} from 'lucide-react';
import {
  listarHistoricoTabelas,
  excluirRegistroHistorico,
  restaurarTabelaDoHistorico,
  type TipoEntidadeTabela,
  type RegistroHistoricoTabela,
} from '../../../storage/tabelasPrecoStorage';

interface ModalHistoricoTabelasProps {
  entidadeTipo: TipoEntidadeTabela;
  entidadeId: string;
  entidadeNome: string;
  onFechar: () => void;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function ModalHistoricoTabelas({
  entidadeTipo,
  entidadeId,
  entidadeNome,
  onFechar,
}: ModalHistoricoTabelasProps) {
  const [historico, setHistorico] = useState<RegistroHistoricoTabela[]>(() =>
    listarHistoricoTabelas(entidadeTipo, entidadeId)
  );
  const [selecionadoId, setSelecionadoId] = useState<string | null>(
    () => listarHistoricoTabelas(entidadeTipo, entidadeId)[0]?.id || null
  );
  const [avisoRestaurado, setAvisoRestaurado] = useState(false);

  const registroAtual =
    historico.find((h) => h.id === selecionadoId) || historico[0] || null;

  const handleExcluir = (id: string) => {
    excluirRegistroHistorico(id);
    const novaLista = listarHistoricoTabelas(entidadeTipo, entidadeId);
    setHistorico(novaLista);
    if (selecionadoId === id) {
      setSelecionadoId(novaLista[0]?.id || null);
    }
  };

  const handleRestaurar = (registro: RegistroHistoricoTabela) => {
    restaurarTabelaDoHistorico(registro);
    const novaLista = listarHistoricoTabelas(entidadeTipo, entidadeId);
    setHistorico(novaLista);
    setSelecionadoId(novaLista[0]?.id || null);
    setAvisoRestaurado(true);
    setTimeout(() => setAvisoRestaurado(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-[95vw] h-[90vh] max-w-7xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/15 text-brand-600 dark:text-brand-400">
                {entidadeTipo === 'frigorifico'
                  ? 'Frigorífico'
                  : 'Intermediário'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate mt-0.5">
                Histórico de Tabelas • {entidadeNome}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {avisoRestaurado && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <Check className="w-4 h-4" />
                Tabela restaurada como vigente!
              </span>
            )}
            <button
              type="button"
              onClick={onFechar}
              title="Fechar"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo */}
        {historico.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Nenhuma versão anterior arquivada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Quando você editar a tabela de preços de{' '}
                <strong>{entidadeNome}</strong> e escolher{' '}
                <strong>"Nova versão (Reajuste)"</strong>, a tabela anterior
                ficará salva aqui automaticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Coluna Esquerda: Lista de Versões */}
            <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-2.5 bg-slate-50/40 dark:bg-slate-950/30">
              <div className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Versões Arquivadas ({historico.length})
              </div>

              {historico.map((item) => {
                const selecionada = registroAtual?.id === item.id;
                const t = item.tabela;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelecionadoId(item.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      selecionada
                        ? 'bg-white dark:bg-slate-900 border-brand-500 ring-1 ring-brand-500/30 shadow-xs'
                        : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                        <Calendar className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        {new Date(item.dataInicioVigencia).toLocaleDateString(
                          'pt-BR'
                        )}{' '}
                        →{' '}
                        {new Date(item.dataArquivamento).toLocaleDateString(
                          'pt-BR'
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        #{item.id.slice(0, 6)}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {item.motivoReajuste}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t.baseKm === 'ida_volta' ? 'Ida e Volta' : 'Só Ida'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t.faixas.length}{' '}
                        {t.faixas.length === 1 ? 'faixa' : 'faixas'}
                      </span>
                      {t.carretaAlugada?.ativa && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300">
                          Aluguel {t.carretaAlugada.percentual}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </aside>

            {/* Coluna Direita: Detalhes da Versão Selecionada */}
            {registroAtual && (
              <div className="lg:col-span-8 overflow-y-auto p-6 space-y-6">
                {/* Barra de Ações da Versão */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Motivo do arquivamento:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {registroAtual.motivoReajuste}
                      </strong>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      ID da Versão: {registroAtual.id}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRestaurar(registroAtual)}
                      className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restaurar esta versão
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluir(registroAtual.id)}
                      title="Excluir do histórico"
                      className="h-9 px-3 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Resumo das Regras desta Versão */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {registroAtual.tabela.baseKm === 'ida_volta' ? (
                        <ArrowLeftRight className="w-4 h-4 text-brand-500" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-brand-500" />
                      )}
                      Base de KM
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {registroAtual.tabela.baseKm === 'ida_volta'
                        ? 'Ida e Volta'
                        : 'Só Ida (Uma perna)'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Gauge className="w-4 h-4 text-brand-500" />
                      Tarifa por KM
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {registroAtual.tabela.regraPorKm.ativa
                        ? `Acima de ${registroAtual.tabela.regraPorKm.aPartirDeKm} km: ${formatarMoeda(registroAtual.tabela.regraPorKm.valorPorKm)}/km`
                        : 'Inativa nesta versão'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Percent className="w-4 h-4 text-brand-500" />
                      Carreta Alugada
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                      {registroAtual.tabela.carretaAlugada?.ativa
                        ? `${registroAtual.tabela.carretaAlugada.percentual}% sobre a viagem`
                        : 'Não se aplica (0%)'}
                    </div>
                  </div>
                </div>

                {/* Tabela de Faixas daquela época */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Route className="w-4 h-4 text-brand-500" />
                    Faixas de Preço Fechado da Versão
                  </div>

                  {registroAtual.tabela.faixas.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                      Nenhuma faixa fechada estava cadastrada nesta versão.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-4">Intervalo</th>
                            <th className="py-2.5 px-4">Valor Fechado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                          {registroAtual.tabela.faixas.map((faixa) => (
                            <tr key={faixa.id}>
                              <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                                De{' '}
                                <span className="font-mono font-bold">
                                  {faixa.kmInicial} km
                                </span>{' '}
                                até{' '}
                                <span className="font-mono font-bold">
                                  {faixa.kmFinal} km
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatarMoeda(faixa.valorFixo)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Observações da Versão */}
                {registroAtual.tabela.observacoes && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-brand-500" />
                      Observações registradas na época
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                      {registroAtual.tabela.observacoes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}