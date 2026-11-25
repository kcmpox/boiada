import { useState, useMemo } from 'react';
import {
  Table2,
  X,
  Plus,
  Trash2,
  Check,
  Calculator,
  Route,
  Gauge,
  ArrowLeftRight,
  ArrowRight,
  Percent,
  History,
  Wrench,
  CalendarClock,
  Truck,
} from 'lucide-react';
import {
  obterTabelaPreco,
  salvarTabelaPreco,
  calcularFretePelaTabela,
  calcularDataRecebimento,
  type TipoEntidadeTabela,
  type BaseQuilometragemTabela,
  type TipoGadoTabela,
  type MesRecebimentoRegra,
  type FaixaPrecoKm,
  type RegraRecebimentoCiclo,
  type ConfigCarretaAlugada,
  type TabelaPrecoEntidade,
} from '../../../storage/tabelasPrecoStorage';
import { listarCaminhoes } from '../../../storage/cadastrosStorage';

interface ModalTabelaPrecosProps {
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

function formatarDataBr(isoDate: string): string {
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

function parseNumeroRacional(valor: string): number {
  if (!valor.trim()) return NaN;
  return Number(valor.trim().replace(',', '.'));
}

export function ModalTabelaPrecos({
  entidadeTipo,
  entidadeId,
  entidadeNome,
  onFechar,
}: ModalTabelaPrecosProps) {
  const caminhoes = useMemo(() => listarCaminhoes(), []);

  const [tabelaSalva, setTabelaSalva] = useState<TabelaPrecoEntidade | null>(
    () => obterTabelaPreco(entidadeTipo, entidadeId)
  );

  const [baseKm, setBaseKm] = useState<BaseQuilometragemTabela>(
    tabelaSalva?.baseKm || 'ida_volta'
  );
  const [faixas, setFaixas] = useState<FaixaPrecoKm[]>(
    tabelaSalva?.faixas || []
  );
  const [regraPorKmAtiva, setRegraPorKmAtiva] = useState<boolean>(
    tabelaSalva?.regraPorKm.ativa ?? true
  );
  const [aPartirDeKm, setAPartirDeKm] = useState<string>(
    tabelaSalva?.regraPorKm.aPartirDeKm
      ? String(tabelaSalva.regraPorKm.aPartirDeKm)
      : ''
  );
  const [valorPorKm, setValorPorKm] = useState<string>(
    tabelaSalva?.regraPorKm.valorPorKm
      ? String(tabelaSalva.regraPorKm.valorPorKm)
      : ''
  );

  const [carretaAlugadaAtiva, setCarretaAlugadaAtiva] = useState<boolean>(
    tabelaSalva?.carretaAlugada?.ativa ?? false
  );
  const [percentualAluguel, setPercentualAluguel] = useState<string>(
    tabelaSalva?.carretaAlugada?.percentual
      ? String(tabelaSalva.carretaAlugada.percentual)
      : ''
  );

  // Taxas específicas por caminhão
  const [taxasPorCaminhao, setTaxasPorCaminhao] = useState<
    Record<string, ConfigCarretaAlugada>
  >(tabelaSalva?.taxasAluguelPorCaminhao || {});
  const [caminhaoTaxaId, setCaminhaoTaxaId] = useState<string>(
    () => caminhoes[0]?.id || ''
  );
  const [percentualCaminhaoInput, setPercentualCaminhaoInput] =
    useState<string>('');

  // Regras de Data de Recebimento (Boi Gordo e Boi Magro)
  const [regrasRecebimento, setRegrasRecebimento] = useState<
    RegraRecebimentoCiclo[]
  >(tabelaSalva?.regrasRecebimento || []);
  const [abaGadoRecebimento, setAbaGadoRecebimento] =
    useState<TipoGadoTabela>('boi_gordo');
  const [novoDiaInicio, setNovoDiaInicio] = useState('');
  const [novoDiaFim, setNovoDiaFim] = useState('');
  const [novoDiaRecebimento, setNovoDiaRecebimento] = useState('');
  const [novoMesRecebimento, setNovoMesRecebimento] =
    useState<MesRecebimentoRegra>('mesmo_mes');

  const [observacoes, setObservacoes] = useState<string>(
    tabelaSalva?.observacoes || ''
  );

  // Faixas KM
  const [novoKmInicial, setNovoKmInicial] = useState('');
  const [novoKmFinal, setNovoKmFinal] = useState('');
  const [novoValorFixo, setNovoValorFixo] = useState('');

  // Simulador
  const [kmTesteIda, setKmTesteIda] = useState('');
  const [caminhaoSimulacaoId, setCaminhaoSimulacaoId] = useState<string>('');
  const [dataTesteViagem, setDataTesteViagem] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [tipoGadoTeste, setTipoGadoTeste] =
    useState<TipoGadoTabela>('boi_gordo');

  const [salvoSucesso, setSalvoSucesso] = useState<string>('');
  const [confirmandoModoSalvar, setConfirmandoModoSalvar] = useState(false);
  const [motivoReajuste, setMotivoReajuste] = useState('');

  const handleAdicionarFaixa = (e: React.FormEvent) => {
    e.preventDefault();
    const ini = parseNumeroRacional(novoKmInicial);
    const fim = parseNumeroRacional(novoKmFinal);
    const val = parseNumeroRacional(novoValorFixo);

    if (
      isNaN(ini) ||
      isNaN(fim) ||
      isNaN(val) ||
      ini < 0 ||
      fim < ini ||
      val <= 0
    ) {
      return;
    }

    const nova: FaixaPrecoKm = {
      id: crypto.randomUUID(),
      kmInicial: ini,
      kmFinal: fim,
      valorFixo: val,
    };

    const ordenadas = [...faixas, nova].sort(
      (a, b) => a.kmFinal - b.kmFinal
    );
    setFaixas(ordenadas);

    setNovoKmInicial(String(fim));
    setNovoKmFinal('');
    setNovoValorFixo('');
  };

  const removerFaixa = (id: string) => {
    setFaixas(faixas.filter((f) => f.id !== id));
  };

  const handleSalvarTaxaCaminhao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caminhaoTaxaId) return;
    const perc = parseNumeroRacional(percentualCaminhaoInput);
    if (isNaN(perc) || perc < 0 || perc > 100) return;

    setTaxasPorCaminhao((prev) => ({
      ...prev,
      [caminhaoTaxaId]: {
        ativa: perc > 0,
        percentual: perc,
      },
    }));
    setPercentualCaminhaoInput('');
  };

  const removerTaxaCaminhao = (camId: string) => {
    setTaxasPorCaminhao((prev) => {
      const copia = { ...prev };
      delete copia[camId];
      return copia;
    });
  };

  const handleAdicionarRegraRecebimento = (e: React.FormEvent) => {
    e.preventDefault();
    const dIni = Number(novoDiaInicio);
    const dFim = Number(novoDiaFim);
    const dRec = Number(novoDiaRecebimento);

    if (
      isNaN(dIni) ||
      isNaN(dFim) ||
      isNaN(dRec) ||
      dIni < 1 ||
      dIni > 31 ||
      dFim < dIni ||
      dFim > 31 ||
      dRec < 1 ||
      dRec > 31
    ) {
      return;
    }

    const novaRegra: RegraRecebimentoCiclo = {
      id: crypto.randomUUID(),
      tipoGado: abaGadoRecebimento,
      diaInicio: dIni,
      diaFim: dFim,
      diaRecebimento: dRec,
      mesRecebimento: novoMesRecebimento,
    };

    const ordenadas = [...regrasRecebimento, novaRegra].sort(
      (a, b) => a.diaInicio - b.diaInicio
    );
    setRegrasRecebimento(ordenadas);

    setNovoDiaInicio('');
    setNovoDiaFim('');
    setNovoDiaRecebimento('');
    setNovoMesRecebimento('mesmo_mes');
  };

  const removerRegraRecebimento = (id: string) => {
    setRegrasRecebimento(regrasRecebimento.filter((r) => r.id !== id));
  };

  const montarObjetoTabela = (): TabelaPrecoEntidade => {
    const yKm = parseNumeroRacional(aPartirDeKm);
    const vKm = parseNumeroRacional(valorPorKm);
    const percAlug = parseNumeroRacional(percentualAluguel);
    const agora = new Date().toISOString();

    return {
      id: tabelaSalva?.id || crypto.randomUUID(),
      entidadeTipo,
      entidadeId,
      baseKm,
      dataCriacao: tabelaSalva?.dataCriacao || agora,
      dataAtualizacao: agora,
      observacoes: observacoes.trim(),
      faixas,
      regraPorKm: {
        ativa: regraPorKmAtiva,
        aPartirDeKm: !isNaN(yKm) && yKm >= 0 ? yKm : 0,
        valorPorKm: !isNaN(vKm) && vKm >= 0 ? vKm : 0,
      },
      carretaAlugada: {
        ativa: carretaAlugadaAtiva,
        percentual:
          carretaAlugadaAtiva && !isNaN(percAlug) && percAlug >= 0
            ? percAlug
            : 0,
      },
      taxasAluguelPorCaminhao: taxasPorCaminhao,
      regrasRecebimento,
    };
  };

  const efetivarSalvamento = (modo: 'corrigir' | 'reajuste') => {
    const resultado = salvarTabelaPreco(
      montarObjetoTabela(),
      modo,
      motivoReajuste
    );
    setTabelaSalva(resultado);
    setConfirmandoModoSalvar(false);
    setMotivoReajuste('');
    setSalvoSucesso(
      modo === 'reajuste'
        ? 'Nova tabela salva e anterior arquivada!'
        : 'Tabela atualizada!'
    );
    setTimeout(() => setSalvoSucesso(''), 3000);
  };

  const handleCliqueSalvar = () => {
    if (!tabelaSalva) {
      efetivarSalvamento('corrigir');
      return;
    }
    setConfirmandoModoSalvar(true);
  };

  const objetoAtual = montarObjetoTabela();
  const kmTesteNum = parseNumeroRacional(kmTesteIda);
  const resultadoSimulacao =
    !isNaN(kmTesteNum) && kmTesteNum > 0
      ? calcularFretePelaTabela(
          objetoAtual,
          kmTesteNum,
          caminhaoSimulacaoId || undefined
        )
      : null;

  const simulacaoDataRecebimento = calcularDataRecebimento(
    objetoAtual,
    dataTesteViagem,
    tipoGadoTeste
  );

  const regrasDaAbaAtual = regrasRecebimento.filter(
    (r) => r.tipoGado === abaGadoRecebimento
  );

  const entradasTaxasCaminhao = Object.entries(taxasPorCaminhao).filter(
    ([, cfg]) => cfg && cfg.ativa && cfg.percentual > 0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="relative w-[95vw] h-[90vh] max-w-7xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-brand-contrast flex items-center justify-center shadow-xs shrink-0">
              <Table2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/15 text-brand-600 dark:text-brand-400">
                  {entidadeTipo === 'frigorifico'
                    ? 'Frigorífico'
                    : 'Intermediário'}
                </span>
                {tabelaSalva && (
                  <>
                    <span className="text-xs text-slate-400">
                      Vigência desde{' '}
                      {new Date(tabelaSalva.dataCriacao).toLocaleDateString(
                        'pt-BR'
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      ID: {tabelaSalva.id.slice(0, 8)}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate mt-0.5">
                Tabela de Preços • {entidadeNome}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {salvoSucesso && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 mr-1">
                <Check className="w-4 h-4" />
                {salvoSucesso}
              </span>
            )}
            <button
              type="button"
              onClick={handleCliqueSalvar}
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Tabela
            </button>
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

        {/* Diálogo de escolha ao salvar sobre uma tabela existente */}
        {confirmandoModoSalvar && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setConfirmandoModoSalvar(false)}
          >
            <div
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Como deseja salvar estas alterações?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Escolha se você está apenas corrigindo um erro de digitação ou
                  aplicando um novo reajuste de tabela (que arquiva a versão
                  anterior no histórico).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo / Observação do Reajuste (opcional para histórico)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reajuste mensal, aumento diesel, nova safra..."
                  value={motivoReajuste}
                  onChange={(e) => setMotivoReajuste(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => efetivarSalvamento('corrigir')}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <Wrench className="w-4 h-4 text-slate-500" />
                    Corrigir tabela atual
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Mantém o mesmo ID e atualiza os valores sem criar registro no histórico.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => efetivarSalvamento('reajuste')}
                  className="p-3.5 rounded-xl border border-brand-500 bg-brand-50/60 dark:bg-brand-500/10 hover:bg-brand-50 dark:hover:bg-brand-500/20 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-400">
                    <History className="w-4 h-4" />
                    Nova versão (Reajuste)
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Arquiva a tabela antiga no histórico e gera uma nova tabela vigente.
                  </p>
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmandoModoSalvar(false)}
                  className="h-8 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Corpo com Scroll Interno */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Base de Quilometragem */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Base de Quilometragem desta Tabela
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Indique se os intervalos abaixo consideram o percurso total (ida e volta) ou apenas uma perna (só ida).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBaseKm('ida_volta')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    baseKm === 'ida_volta'
                      ? 'border-brand-500 bg-white dark:bg-slate-900 ring-2 ring-brand-500/25'
                      : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      baseKm === 'ida_volta'
                        ? 'bg-brand-500 text-brand-contrast'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Ida e Volta
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Soma total dos KM (multiplica rota de ida por 2)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBaseKm('so_ida')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    baseKm === 'so_ida'
                      ? 'border-brand-500 bg-white dark:bg-slate-900 ring-2 ring-brand-500/25'
                      : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      baseKm === 'so_ida'
                        ? 'bg-brand-500 text-brand-contrast'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Só Ida (Uma perna)
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Considera apenas a distância origem → destino
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bloco 1: Faixas de Valor Fechado */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <Route className="w-4 h-4 text-brand-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    1. Faixas de Preço Fechado (De X km até N km —{' '}
                    {baseKm === 'ida_volta' ? 'Ida e Volta' : 'Só Ida'})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Para distâncias dentro do intervalo contínuo, cobra-se o valor fixo definido. Aceita valores decimais (ex: 25.8).
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleAdicionarFaixa}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800"
              >
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    De (KM inicial) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    required
                    placeholder="Ex: 1"
                    value={novoKmInicial}
                    onChange={(e) => setNovoKmInicial(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Até (KM final) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    required
                    placeholder="Ex: 50 ou 25.8"
                    value={novoKmFinal}
                    onChange={(e) => setNovoKmFinal(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Preço Fechado (R$) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    required
                    placeholder="1200.00"
                    value={novoValorFixo}
                    onChange={(e) => setNovoValorFixo(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-9 px-3 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Incluir
                  </button>
                </div>
              </form>

              {faixas.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  Nenhuma faixa de preço fechado adicionada.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-4">
                          Intervalo ({baseKm === 'ida_volta' ? 'Ida e Volta' : 'Só Ida'})
                        </th>
                        <th className="py-2.5 px-4">Valor Fechado</th>
                        <th className="py-2.5 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                      {faixas.map((faixa) => (
                        <tr
                          key={faixa.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
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
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => removerFaixa(faixa.id)}
                              title="Remover faixa"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bloco 2: Regra por KM Rodado */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Gauge className="w-4 h-4 text-brand-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      2. Cobrança por KM Rodado (Acima de Y km —{' '}
                      {baseKm === 'ida_volta' ? 'Ida e Volta' : 'Só Ida'})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Valores <strong>maiores que Y</strong> (ex: se Y = 240, 240.0 fica na tabela e 240.1 em diante calcula{' '}
                      <strong>Preço × KM</strong>).
                    </p>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regraPorKmAtiva}
                    onChange={(e) => setRegraPorKmAtiva(e.target.checked)}
                    className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  Regra ativa
                </label>
              </div>

              {regraPorKmAtiva && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Acima de quantos KM (Y) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="Ex: 240"
                      value={aPartirDeKm}
                      onChange={(e) => setAPartirDeKm(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Preço por KM (R$) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="Ex: 8.50"
                      value={valorPorKm}
                      onChange={(e) => setValorPorKm(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 3: Carreta Alugada (Geral + Por Caminhão) */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Percent className="w-4 h-4 text-brand-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      3. Carreta Alugada (Percentual de Repasse)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Não é descontado do valor da viagem cobrado de{' '}
                      <strong>{entidadeNome}</strong>; você pode definir um percentual geral ou taxas específicas por caminhão.
                    </p>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={carretaAlugadaAtiva}
                    onChange={(e) => setCarretaAlugadaAtiva(e.target.checked)}
                    className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  Aluguel geral ativo
                </label>
              </div>

              {carretaAlugadaAtiva && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 max-w-sm">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Porcentagem Padrão do Aluguel (% sobre o valor da viagem) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    max={100}
                    placeholder="Ex: 10, 80 ou 2.368"
                    value={percentualAluguel}
                    onChange={(e) => setPercentualAluguel(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {/* Taxa específica por caminhão */}
              <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-brand-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Taxa de Aluguel por Caminhão Específico
                  </h4>
                </div>

                <form
                  onSubmit={handleSalvarTaxaCaminhao}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800"
                >
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Caminhão *
                    </label>
                    <select
                      value={caminhaoTaxaId}
                      onChange={(e) => setCaminhaoTaxaId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    >
                      {caminhoes.length === 0 ? (
                        <option value="">Nenhum caminhão cadastrado</option>
                      ) : (
                        caminhoes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome} {c.placa ? `(${c.placa})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Taxa (%) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      max={100}
                      placeholder="Ex: 15 ou 2.5"
                      value={percentualCaminhaoInput}
                      onChange={(e) =>
                        setPercentualCaminhaoInput(e.target.value)
                      }
                      className="w-full h-9 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full h-9 px-3 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Definir
                    </button>
                  </div>
                </form>

                {entradasTaxasCaminhao.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-2 px-4">Caminhão</th>
                          <th className="py-2 px-4">Taxa de Aluguel</th>
                          <th className="py-2 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                        {entradasTaxasCaminhao.map(([camId, cfg]) => {
                          const cam = caminhoes.find(
                            (c) => String(c.id) === String(camId)
                          );
                          const rotuloCam = cam
                            ? `${cam.nome}${cam.placa ? ` (${cam.placa})` : ''}`
                            : `Caminhão #${camId}`;
                          return (
                            <tr
                              key={camId}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            >
                              <td className="py-2 px-4 font-medium text-slate-800 dark:text-slate-200">
                                {rotuloCam}
                              </td>
                              <td className="py-2 px-4 font-mono font-semibold text-amber-600 dark:text-amber-400">
                                {cfg.percentual}%
                              </td>
                              <td className="py-2 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => removerTaxaCaminhao(camId)}
                                  title="Remover taxa do caminhão"
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 4: Datas de Recebimento (Boi Gordo vs Boi Magro) */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="w-4 h-4 text-brand-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      4. Datas de Recebimento (Ciclos de Fechamento)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Defina em qual dia cai o pagamento conforme o período do mês em que a viagem ocorreu.
                    </p>
                  </div>
                </div>

                {/* Seletor Boi Gordo / Boi Magro */}
                <div className="inline-flex rounded-lg p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAbaGadoRecebimento('boi_gordo')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      abaGadoRecebimento === 'boi_gordo'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Boi Gordo (
                    {
                      regrasRecebimento.filter((r) => r.tipoGado === 'boi_gordo')
                        .length
                    }
                    )
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaGadoRecebimento('boi_magro')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      abaGadoRecebimento === 'boi_magro'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Boi Magro (
                    {
                      regrasRecebimento.filter((r) => r.tipoGado === 'boi_magro')
                        .length
                    }
                    )
                  </button>
                </div>
              </div>

              {/* Formulário de Ciclo */}
              <form
                onSubmit={handleAdicionarRegraRecebimento}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800"
              >
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Viagem Dia *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    placeholder="1"
                    value={novoDiaInicio}
                    onChange={(e) => setNovoDiaInicio(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Até Dia *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    placeholder="7"
                    value={novoDiaFim}
                    onChange={(e) => setNovoDiaFim(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Recebe no Dia *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    placeholder="21"
                    value={novoDiaRecebimento}
                    onChange={(e) => setNovoDiaRecebimento(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Mês do Pagamento
                  </label>
                  <select
                    value={novoMesRecebimento}
                    onChange={(e) =>
                      setNovoMesRecebimento(
                        e.target.value as MesRecebimentoRegra
                      )
                    }
                    className="w-full h-9 px-2.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="mesmo_mes">No mesmo mês</option>
                    <option value="mes_seguinte">Do mês seguinte</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-9 px-3 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Incluir
                  </button>
                </div>
              </form>

              {/* Tabela de Ciclos da Aba Atual */}
              {regrasDaAbaAtual.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  Nenhuma data de recebimento definida para{' '}
                  <strong>
                    {abaGadoRecebimento === 'boi_gordo'
                      ? 'Boi Gordo'
                      : 'Boi Magro'}
                  </strong>
                  .
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-4">
                          Período da Viagem (
                          {abaGadoRecebimento === 'boi_gordo'
                            ? 'Boi Gordo'
                            : 'Boi Magro'}
                          )
                        </th>
                        <th className="py-2.5 px-4">Data de Recebimento</th>
                        <th className="py-2.5 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                      {regrasDaAbaAtual.map((regra) => (
                        <tr
                          key={regra.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                            Entre dia{' '}
                            <span className="font-mono font-bold">
                              {regra.diaInicio}
                            </span>{' '}
                            e dia{' '}
                            <span className="font-mono font-bold">
                              {regra.diaFim}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs font-semibold text-brand-600 dark:text-brand-400">
                            Dia{' '}
                            <span className="font-mono font-bold text-sm">
                              {regra.diaRecebimento}
                            </span>{' '}
                            {regra.mesRecebimento === 'mesmo_mes'
                              ? 'no mesmo mês'
                              : 'do mês seguinte'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => removerRegraRecebimento(regra.id)}
                              title="Remover regra"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita (4 colunas): Simulador e Observações */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Simulador de Cálculo
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Distância da Rota — Só Ida (KM)
                </label>
                <input
                  type="number"
                  step="any"
                  min={0}
                  placeholder="Ex: 25.8"
                  value={kmTesteIda}
                  onChange={(e) => setKmTesteIda(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Caminhão (para testar taxa)
                </label>
                <select
                  value={caminhaoSimulacaoId}
                  onChange={(e) => setCaminhaoSimulacaoId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Padrão da tabela</option>
                  {caminhoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.placa ? `(${c.placa})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Data da Viagem
                  </label>
                  <input
                    type="date"
                    value={dataTesteViagem}
                    onChange={(e) => setDataTesteViagem(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tipo de Gado
                  </label>
                  <select
                    value={tipoGadoTeste}
                    onChange={(e) =>
                      setTipoGadoTeste(e.target.value as TipoGadoTabela)
                    }
                    className="w-full h-9 px-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="boi_gordo">Boi Gordo</option>
                    <option value="boi_magro">Boi Magro</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Valor da Viagem
                </div>
                {!isNaN(kmTesteNum) && kmTesteNum > 0 ? (
                  resultadoSimulacao ? (
                    <>
                      <div className="text-2xl font-bold font-mono text-brand-600 dark:text-brand-400">
                        {formatarMoeda(resultadoSimulacao.valor)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {resultadoSimulacao.regraAplicada}
                      </div>

                      {resultadoSimulacao.percentualAluguel > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Aluguel Carreta ({resultadoSimulacao.percentualAluguel}%):
                            </span>
                            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                              {formatarMoeda(
                                resultadoSimulacao.valorAluguelCarreta
                              )}
                            </span>
                          </div>
                          <span className="block text-[10px] text-slate-400">
                            Origem:{' '}
                            {resultadoSimulacao.origemTaxaAluguel === 'caminhao'
                              ? 'Taxa específica do caminhão'
                              : 'Percentual padrão da tabela'}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                      Nenhuma faixa ou regra cobre{' '}
                      <strong>
                        {baseKm === 'ida_volta'
                          ? `${Number((kmTesteNum * 2).toFixed(4))} km (ida e volta)`
                          : `${kmTesteNum} km (só ida)`}
                      </strong>
                      .
                    </div>
                  )
                ) : (
                  <div className="text-xs text-slate-400">
                    Informe uma quilometragem acima para simular.
                  </div>
                )}

                {/* Previsão da Data de Recebimento no Simulador */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Data Prevista de Recebimento
                  </div>
                  {simulacaoDataRecebimento ? (
                    <>
                      <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatarDataBr(
                          simulacaoDataRecebimento.dataRecebimentoIso
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {simulacaoDataRecebimento.descricaoRegra}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400">
                      Sem regra de ciclo cadastrada para este dia/tipo de gado.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-2.5">
              <label className="block text-sm font-bold text-slate-900 dark:text-white">
                Observações da Tabela
              </label>
              <textarea
                rows={4}
                placeholder="Ex: Tabela referente a caminhão truck; pedágio pago à parte..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full p-3 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}