import { useEffect, useState } from 'react';
import {
  X,
  CopyCheck,
  RefreshCw,
  Trash2,
  Code2,
  Check,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Calendar,
  FileJson,
} from 'lucide-react';
import {
  atualizarRegistroPorIndice,
  buscarRegistrosDuplicados,
  formatarDataResumo,
  formatarMoedaResumo,
  removerRegistroPorIndice,
  type GrupoIdDuplicado,
  type OcorrenciaDuplicada,
} from './types';
import {
  ModalConfirmacaoAntesDepois,
  type DadosConfirmacaoAntesDepois,
} from './ModalConfirmacaoAntesDepois';

interface ModalRegistrosDuplicadosProps {
  aberto: boolean;
  onFechar: () => void;
}

function renderCardVisualOcorrencia(
  chaveFonte: string,
  reg: Record<string, unknown>
) {
  if (chaveFonte === 'bt_viagens_ativas') {
    const origem = String(reg.localEmbarque || reg.embarque || 'Origem');
    const destino = String(
      reg.localDesembarque || reg.desembarque || 'Destino'
    );
    const data = formatarDataResumo(reg.data || reg.dataViagem);
    const bruto = Number(reg.valorViagem ?? reg.valorBruto ?? 0);
    const aluguel = Number(reg.valorAluguelCarreta ?? 0);
    const liquido =
      reg.valorLiquidoViagem !== undefined
        ? Number(reg.valorLiquidoViagem)
        : bruto - aluguel;
    const tipoGado = reg.tipoGado === 'boi_magro' ? 'Boi Magro' : 'Boi Gordo';

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-brand-500" />
            {data}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {tipoGado}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
          <Truck className="w-4 h-4 text-brand-500 shrink-0" />
          <span className="truncate">
            {origem} → {destino}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
          <div>
            <span className="block text-[10px] uppercase text-slate-400">
              Bruto
            </span>
            <strong className="font-mono text-slate-800 dark:text-slate-200">
              {formatarMoedaResumo(bruto)}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-slate-400">
              Aluguel
            </span>
            <strong className="font-mono text-slate-800 dark:text-slate-200">
              {formatarMoedaResumo(aluguel)}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-slate-400">
              Líquido
            </span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">
              {formatarMoedaResumo(liquido)}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  const titulo = String(
    reg.nome ||
      reg.descricao ||
      reg.posto ||
      reg.praca ||
      reg.pagadorNome ||
      'Registro'
  );
  const data = formatarDataResumo(
    reg.data || reg.dataHora || reg.dataPagamento || reg.criadoEm
  );
  const valor =
    reg.valorEfetivamentePago ?? reg.valorTotal ?? reg.valor ?? undefined;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 space-y-1.5 text-xs">
      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
        {titulo}
      </div>
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono">
        <span>Data: {data}</span>
        {valor !== undefined && (
          <strong className="text-slate-800 dark:text-slate-200">
            {formatarMoedaResumo(valor)}
          </strong>
        )}
      </div>
    </div>
  );
}

export function ModalRegistrosDuplicados({
  aberto,
  onFechar,
}: ModalRegistrosDuplicadosProps) {
  const [grupos, setGrupos] = useState<GrupoIdDuplicado[]>([]);
  const [chaveEmEdicao, setChaveEmEdicao] = useState<string | null>(null);
  const [textoJsonEdicao, setTextoJsonEdicao] = useState<string>('');
  const [erroJson, setErroJson] = useState<string>('');
  const [confirmacao, setConfirmacao] =
    useState<DadosConfirmacaoAntesDepois | null>(null);

  const reescanear = () => {
    setGrupos(buscarRegistrosDuplicados());
    setChaveEmEdicao(null);
    setTextoJsonEdicao('');
    setErroJson('');
  };

  useEffect(() => {
    if (!aberto) return;
    reescanear();
  }, [aberto]);

  useEffect(() => {
    if (!aberto || confirmacao) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, confirmacao, onFechar]);

  if (!aberto) return null;

  const iniciarEdicaoJson = (
    grupo: GrupoIdDuplicado,
    ocorrencia: OcorrenciaDuplicada
  ) => {
    setChaveEmEdicao(`${grupo.grupoKey}::${ocorrencia.indiceNoArray}`);
    setTextoJsonEdicao(ocorrencia.jsonFormatado);
    setErroJson('');
  };

  const solicitarConfirmacaoEdicao = (
    grupo: GrupoIdDuplicado,
    ocorrencia: OcorrenciaDuplicada
  ) => {
    setErroJson('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(textoJsonEdicao);
    } catch {
      setErroJson('JSON inválido. Verifique as chaves, aspas e vírgulas.');
      return;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setErroJson('O registro precisa ser um objeto JSON válido.');
      return;
    }

    const novoObjeto = parsed as Record<string, unknown>;
    const jsonDepoisFormatado = JSON.stringify(novoObjeto, null, 2);

    setConfirmacao({
      tipoAcao: 'editar',
      titulo: 'Confirmar edição direta do JSON',
      descricao: `${grupo.fonte.rotulo} • Índice #${ocorrencia.indiceNoArray}`,
      jsonAntes: ocorrencia.jsonFormatado,
      jsonDepois: jsonDepoisFormatado,
      onConfirmar: () => {
        atualizarRegistroPorIndice(
          grupo.fonte,
          ocorrencia.indiceNoArray,
          novoObjeto
        );
        setConfirmacao(null);
        reescanear();
      },
    });
  };

  const solicitarConfirmacaoExclusao = (
    grupo: GrupoIdDuplicado,
    ocorrencia: OcorrenciaDuplicada
  ) => {
    if (grupo.ocorrencias.length <= 1) return;

    setConfirmacao({
      tipoAcao: 'excluir',
      titulo: 'Confirmar remoção de registro duplicado',
      descricao: `Será removida apenas a ocorrência no índice #${ocorrencia.indiceNoArray} de ${grupo.fonte.rotulo}. Pelo menos 1 registro com este ID será preservado.`,
      jsonAntes: ocorrencia.jsonFormatado,
      jsonDepois:
        '// Este item duplicado será removido da lista.\n// As demais ocorrências com o mesmo ID permanecerão salvas.',
      onConfirmar: () => {
        removerRegistroPorIndice(grupo.fonte, ocorrencia.indiceNoArray);
        setConfirmacao(null);
        reescanear();
      },
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-duplicados"
        onClick={onFechar}
      >
        <div
          className="w-[95vw] h-[90vh] max-w-6xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <CopyCheck className="w-4 h-4" />
              </div>
              <div>
                <h2
                  id="titulo-modal-duplicados"
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white"
                >
                  Verificação de Registros Duplicados
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inspecione ocorrências com o mesmo ID, edite o JSON diretamente ou remova cópias excedentes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reescanear}
                className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Verificar Novamente
              </button>

              <button
                type="button"
                onClick={onFechar}
                aria-label="Fechar janela"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {grupos.length === 0 ? (
              <div className="h-full min-h-[45vh] flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 p-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Nenhum registro duplicado encontrado
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
                  Todos os registros em viagens, despesas, recebimentos, carteira e cadastros possuem identificadores únicos.
                </p>
              </div>
            ) : (
              grupos.map((grupo) => {
                const podeApagarAlgum = grupo.ocorrencias.length > 1;

                return (
                  <section
                    key={grupo.grupoKey}
                    className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {grupo.ocorrencias.length} ocorrências com o mesmo ID
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {grupo.fonte.rotulo}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                        ID: <strong>{grupo.idDuplicado}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {grupo.ocorrencias.map((oc, idxVisual) => {
                        const itemEditKey = `${grupo.grupoKey}::${oc.indiceNoArray}`;
                        const emEdicao = chaveEmEdicao === itemEditKey;

                        return (
                          <div
                            key={itemEditKey}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col justify-between space-y-3.5 shadow-2xs"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  Cópia #{idxVisual + 1}{' '}
                                  <span className="font-mono text-[11px] font-normal text-slate-400">
                                    (posição {oc.indiceNoArray} no array)
                                  </span>
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {!emEdicao && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        iniciarEdicaoJson(grupo, oc)
                                      }
                                      className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-brand-500/50 hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <Code2 className="w-3.5 h-3.5" />
                                      Editar JSON
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={!podeApagarAlgum}
                                    onClick={() =>
                                      solicitarConfirmacaoExclusao(grupo, oc)
                                    }
                                    title={
                                      podeApagarAlgum
                                        ? 'Apagar esta cópia duplicada'
                                        : 'Não é possível apagar a única cópia restante'
                                    }
                                    className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Apagar
                                  </button>
                                </div>
                              </div>

                              {/* Card visual do registro */}
                              {renderCardVisualOcorrencia(
                                grupo.fonte.chave,
                                oc.registro
                              )}

                              {/* Bloco JSON */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                  <FileJson className="w-3.5 h-3.5 text-brand-500" />
                                  JSON do Registro
                                </div>

                                {emEdicao ? (
                                  <div className="space-y-2">
                                    <textarea
                                      rows={11}
                                      value={textoJsonEdicao}
                                      onChange={(e) =>
                                        setTextoJsonEdicao(e.target.value)
                                      }
                                      spellCheck={false}
                                      className="w-full p-3 rounded-xl border border-brand-500 bg-slate-950 text-emerald-300 font-mono text-xs focus:outline-none"
                                    />

                                    {erroJson && (
                                      <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                        {erroJson}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setChaveEmEdicao(null);
                                          setErroJson('');
                                        }}
                                        className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                      >
                                        Cancelar
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          solicitarConfirmacaoEdicao(grupo, oc)
                                        }
                                        className="h-8 px-3 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        Revisar Antes e Depois
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <pre className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 font-mono text-[11px] overflow-auto max-h-56 whitespace-pre-wrap break-all">
                                    {oc.jsonFormatado}
                                  </pre>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Ao apagar duplicados, pelo menos 1 cópia de cada ID é sempre preservada.
            </span>
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>

      <ModalConfirmacaoAntesDepois
        dados={confirmacao}
        onCancelar={() => setConfirmacao(null)}
      />
    </>
  );
}