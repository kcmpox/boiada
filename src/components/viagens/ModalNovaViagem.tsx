import { useState, useMemo } from 'react';
import {
  Truck,
  X,
  Check,
  MapPin,
  Route,
  Wallet,
  ArrowLeftRight,
  ArrowRight,
  Calculator,
  AlertCircle,
  CalendarCheck,
  Pencil,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  listarCaminhoes,
  listarMotoristas,
  listarFrigorificos,
  listarIntermediarios,
} from '../../storage/cadastrosStorage';
import {
  obterTabelaPreco,
  listarHistoricoTabelas,
  calcularFretePelaTabela,
  calcularDataRecebimento,
  type TipoEntidadeTabela,
  type BaseQuilometragemTabela,
  type TabelaPrecoEntidade,
} from '../../storage/tabelasPrecoStorage';
import type {
  Viagem,
  TipoGado,
  ModoDistanciaViagem,
} from '../../storage/viagensStorage';

interface ModalNovaViagemProps {
  viagemParaEditar?: Viagem | null;
  onSalvar: (viagem: Viagem) => void;
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

export function ModalNovaViagem({
  viagemParaEditar = null,
  onSalvar,
  onFechar,
}: ModalNovaViagemProps) {
  const isEdicao = Boolean(viagemParaEditar);

  const caminhoes = useMemo(() => {
    const todos = listarCaminhoes();
    return todos.filter(
      (c) => c.ativo || c.id === viagemParaEditar?.caminhaoId
    );
  }, [viagemParaEditar?.caminhaoId]);

  const motoristas = useMemo(() => listarMotoristas(), []);
  const frigorificos = useMemo(() => listarFrigorificos(), []);
  const intermediarios = useMemo(() => {
    const todos = listarIntermediarios();
    return todos.filter(
      (i) => i.ativo || i.id === viagemParaEditar?.pagadorId
    );
  }, [viagemParaEditar?.pagadorId]);

  // Bloco 1: Carga, Veículo e Motorista
  const [tipoGado, setTipoGado] = useState<TipoGado>(
    viagemParaEditar?.tipoGado || 'boi_gordo'
  );
  const [caminhaoId, setCaminhaoId] = useState<string>(
    viagemParaEditar?.caminhaoId || caminhoes[0]?.id || ''
  );
  const [motoristaId, setMotoristaId] = useState<string>(
    viagemParaEditar
      ? viagemParaEditar.motoristaId
      : caminhoes[0]?.motoristaId || ''
  );

  // Bloco 2: Data, Locais e Documentação
  const [data, setData] = useState<string>(
    viagemParaEditar?.data || new Date().toISOString().slice(0, 10)
  );
  const [localEmbarque, setLocalEmbarque] = useState(
    viagemParaEditar?.localEmbarque || ''
  );
  const [pecuarista, setPecuarista] = useState(
    viagemParaEditar?.pecuarista || ''
  );
  const [localDesembarque, setLocalDesembarque] = useState(
    viagemParaEditar?.localDesembarque || ''
  );
  const [frigorificoId, setFrigorificoId] = useState(
    viagemParaEditar?.frigorificoId || ''
  );
  const [cte, setCte] = useState(viagemParaEditar?.cte || '');
  const [minuta, setMinuta] = useState(viagemParaEditar?.minuta || '');

  // Bloco 3: Distância Percorrida
  const [baseKmInformada, setBaseKmInformada] =
    useState<BaseQuilometragemTabela>(
      viagemParaEditar?.baseKmInformada || 'ida_volta'
    );
  const [modoDistancia, setModoDistancia] = useState<ModoDistanciaViagem>(
    viagemParaEditar?.modoDistancia || 'hodometro'
  );
  const [hodometroInicial, setHodometroInicial] = useState(
    viagemParaEditar?.hodometroInicial !== null &&
      viagemParaEditar?.hodometroInicial !== undefined
      ? String(viagemParaEditar.hodometroInicial)
      : ''
  );
  const [hodometroFinal, setHodometroFinal] = useState(
    viagemParaEditar?.hodometroFinal !== null &&
      viagemParaEditar?.hodometroFinal !== undefined
      ? String(viagemParaEditar.hodometroFinal)
      : ''
  );
  const [kmManual, setKmManual] = useState(
    viagemParaEditar?.modoDistancia === 'manual' &&
      viagemParaEditar?.kmInformado > 0
      ? String(viagemParaEditar.kmInformado)
      : ''
  );

  // Bloco 4: Pagador e Tabela de Preços
  const [pagadorChave, setPagadorChave] = useState<string>(() => {
    if (viagemParaEditar) {
      return `${viagemParaEditar.pagadorTipo}:${viagemParaEditar.pagadorId}`;
    }
    if (intermediarios[0]) return `intermediario:${intermediarios[0].id}`;
    if (frigorificos[0]) return `frigorifico:${frigorificos[0].id}`;
    return '';
  });
  const [tabelaSelecionadaId, setTabelaSelecionadaId] = useState<string>(
    viagemParaEditar?.tabelaPrecoId || ''
  );

  // Controle de preservação vs recálculo do valor bruto na edição
  const [usarValorTabelaNaEdicao, setUsarValorTabelaNaEdicao] =
    useState<boolean>(() => !viagemParaEditar?.valorManual);
  const [perguntandoAtualizarValor, setPerguntandoAtualizarValor] =
    useState<boolean>(false);

  const [erroValidacao, setErroValidacao] = useState<string>('');

  const handleSelecionarCaminhao = (novoCaminhaoId: string) => {
    setCaminhaoId(novoCaminhaoId);
    const encontrado = caminhoes.find((c) => c.id === novoCaminhaoId);
    if (encontrado) {
      setMotoristaId(encontrado.motoristaId || '');
    }
  };

  const kmInformadoCalculado = useMemo(() => {
    if (modoDistancia === 'hodometro') {
      const ini = parseNumeroRacional(hodometroInicial);
      const fim = parseNumeroRacional(hodometroFinal);
      if (!isNaN(ini) && !isNaN(fim) && fim > ini) {
        return Number((fim - ini).toFixed(4));
      }
      return 0;
    } else {
      const manual = parseNumeroRacional(kmManual);
      return !isNaN(manual) && manual > 0 ? manual : 0;
    }
  }, [modoDistancia, hodometroInicial, hodometroFinal, kmManual]);

  const kmUmaPerna = useMemo(() => {
    if (kmInformadoCalculado <= 0) return 0;
    return baseKmInformada === 'ida_volta'
      ? Number((kmInformadoCalculado / 2).toFixed(4))
      : kmInformadoCalculado;
  }, [kmInformadoCalculado, baseKmInformada]);

  const pagadorSelecionado = useMemo(() => {
    if (!pagadorChave || !pagadorChave.includes(':')) return null;
    const [tipo, id] = pagadorChave.split(':') as [TipoEntidadeTabela, string];
    return { tipo, id };
  }, [pagadorChave]);

  const opcoesTabelasPagador = useMemo(() => {
    if (!pagadorSelecionado) return [];
    const lista: { label: string; tabela: TabelaPrecoEntidade }[] = [];

    const vigente = obterTabelaPreco(
      pagadorSelecionado.tipo,
      pagadorSelecionado.id
    );
    if (vigente) {
      lista.push({
        label: `Tabela Vigente (desde ${new Date(
          vigente.dataCriacao
        ).toLocaleDateString('pt-BR')} • ${
          vigente.baseKm === 'ida_volta' ? 'Ida e Volta' : 'Só Ida'
        })`,
        tabela: vigente,
      });
    }

    const historico = listarHistoricoTabelas(
      pagadorSelecionado.tipo,
      pagadorSelecionado.id
    );
    historico.forEach((h) => {
      lista.push({
        label: `Arquivada (${new Date(
          h.dataInicioVigencia
        ).toLocaleDateString('pt-BR')} a ${new Date(
          h.dataArquivamento
        ).toLocaleDateString('pt-BR')} — ${h.motivoReajuste})`,
        tabela: h.tabela,
      });
    });

    return lista;
  }, [pagadorSelecionado]);

  const tabelaAtivaParaCalculo = useMemo(() => {
    if (opcoesTabelasPagador.length === 0) return null;
    const encontrada = opcoesTabelasPagador.find(
      (o) => o.tabela.id === tabelaSelecionadaId
    );
    return encontrada ? encontrada.tabela : opcoesTabelasPagador[0].tabela;
  }, [opcoesTabelasPagador, tabelaSelecionadaId]);

  const previsaoTabela = useMemo(() => {
    if (!tabelaAtivaParaCalculo || kmUmaPerna <= 0) return null;
    return calcularFretePelaTabela(tabelaAtivaParaCalculo, kmUmaPerna);
  }, [tabelaAtivaParaCalculo, kmUmaPerna]);

  const previsaoDataRecebimento = useMemo(() => {
    if (!tabelaAtivaParaCalculo || !data) return null;
    return calcularDataRecebimento(tabelaAtivaParaCalculo, data, tipoGado);
  }, [tabelaAtivaParaCalculo, data, tipoGado]);

  // Verifica se o valor calculado pela tabela diverge do valor salvo anteriormente na viagem
  const valorTabelaCalculado = previsaoTabela?.valor ?? 0;
  const haDivergenciaValorNaEdicao =
    isEdicao &&
    viagemParaEditar !== null &&
    Math.abs(valorTabelaCalculado - viagemParaEditar.valorViagem) > 0.009;

  // Define o valor bruto final conforme escolha do usuário (manter valor anterior/manual ou usar tabela)
  const valorBrutoFinal =
    isEdicao && viagemParaEditar && !usarValorTabelaNaEdicao
      ? viagemParaEditar.valorViagem
      : valorTabelaCalculado;

  const percentualAluguelFinal =
    previsaoTabela?.percentualAluguel ??
    (tabelaAtivaParaCalculo?.carretaAlugada?.ativa
      ? tabelaAtivaParaCalculo.carretaAlugada.percentual
      : viagemParaEditar?.percentualAluguelCarreta ?? 0);

  const valorAluguelFinal =
    percentualAluguelFinal > 0
      ? Number(((valorBrutoFinal * percentualAluguelFinal) / 100).toFixed(2))
      : 0;

  const valorLiquidoFinal = Number(
    (valorBrutoFinal - valorAluguelFinal).toFixed(2)
  );

  const efetivarSalvamento = (atualizarValorParaTabela: boolean) => {
    if (!pagadorSelecionado) return;

    const iniNum = parseNumeroRacional(hodometroInicial);
    const fimNum = parseNumeroRacional(hodometroFinal);

    const brutoEscolhido =
      isEdicao && viagemParaEditar && !atualizarValorParaTabela
        ? viagemParaEditar.valorViagem
        : valorTabelaCalculado;

    const aluguelEscolhido =
      percentualAluguelFinal > 0
        ? Number(((brutoEscolhido * percentualAluguelFinal) / 100).toFixed(2))
        : 0;

    const liquidoEscolhido = Number(
      (brutoEscolhido - aluguelEscolhido).toFixed(2)
    );

    const manteveManual =
      isEdicao &&
      viagemParaEditar !== null &&
      !atualizarValorParaTabela &&
      (viagemParaEditar.valorManual ||
        Math.abs(brutoEscolhido - valorTabelaCalculado) > 0.009);

    const regraAplicadaFinal = manteveManual
      ? viagemParaEditar?.regraPrecoAplicada ||
        'Valor bruto mantido manualmente na edição'
      : previsaoTabela?.regraAplicada || 'Sem faixa correspondente na tabela';

    const viagemSalva: Viagem = {
      id: viagemParaEditar?.id || crypto.randomUUID(),
      tipoGado,
      caminhaoId,
      motoristaId,
      data,
      localEmbarque: localEmbarque.trim(),
      pecuarista: pecuarista.trim(),
      localDesembarque: localDesembarque.trim(),
      frigorificoId,
      cte: cte.trim(),
      minuta: minuta.trim(),
      baseKmInformada,
      modoDistancia,
      hodometroInicial:
        modoDistancia === 'hodometro' && !isNaN(iniNum) ? iniNum : null,
      hodometroFinal:
        modoDistancia === 'hodometro' && !isNaN(fimNum) ? fimNum : null,
      kmInformado: kmInformadoCalculado,
      kmUmaPernaCalculado: kmUmaPerna,
      pagadorTipo: pagadorSelecionado.tipo,
      pagadorId: pagadorSelecionado.id,
      tabelaPrecoId: tabelaAtivaParaCalculo?.id || null,
      valorViagem: brutoEscolhido,
      valorManual: manteveManual,
      percentualAluguelCarreta: percentualAluguelFinal,
      valorAluguelCarreta: aluguelEscolhido,
      valorLiquidoViagem: liquidoEscolhido,
      regraPrecoAplicada: regraAplicadaFinal,
      dataPrevistaRecebimento:
        previsaoDataRecebimento?.dataRecebimentoIso || null,
      regraRecebimentoAplicada:
        previsaoDataRecebimento?.descricaoRegra || '',

      // Etapas operacionais (Saída & Chegada e Animais Perdidos)
      statusSaidaChegada: viagemParaEditar?.statusSaidaChegada || 'pendente',
      dataHoraSaida: viagemParaEditar?.dataHoraSaida || null,
      dataHoraChegada: viagemParaEditar?.dataHoraChegada || null,
      statusAnimaisPerdidos:
        viagemParaEditar?.statusAnimaisPerdidos || 'pendente',
      houvePerdaAnimais: viagemParaEditar?.houvePerdaAnimais ?? false,
      quantidadeAnimaisPerdidos:
        viagemParaEditar?.quantidadeAnimaisPerdidos ?? 0,
      valorUnitarioAnimalPerdido:
        viagemParaEditar?.valorUnitarioAnimalPerdido ?? 0,
      valorTotalAnimaisPerdidos:
        viagemParaEditar?.valorTotalAnimaisPerdidos ?? 0,

      dataCriacao: viagemParaEditar?.dataCriacao || new Date().toISOString(),
      dataArquivamento: viagemParaEditar?.dataArquivamento,
    };

    onSalvar(viagemSalva);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao('');

    if (!caminhaoId) {
      setErroValidacao('Selecione o caminhão que realizou a viagem.');
      return;
    }
    if (!data) {
      setErroValidacao('Informe a data da viagem.');
      return;
    }
    if (!localEmbarque.trim()) {
      setErroValidacao('Informe o local de embarque.');
      return;
    }
    if (!pagadorSelecionado) {
      setErroValidacao('Selecione o responsável pelo pagamento.');
      return;
    }
    if (kmInformadoCalculado <= 0) {
      setErroValidacao(
        'Informe uma distância válida (via hodômetro ou manual).'
      );
      return;
    }

    if (isEdicao && haDivergenciaValorNaEdicao) {
      setPerguntandoAtualizarValor(true);
      return;
    }

    efetivarSalvamento(usarValorTabelaNaEdicao);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="relative w-[95vw] h-[92vh] max-w-7xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-brand-contrast flex items-center justify-center shadow-xs shrink-0">
              {isEdicao ? (
                <Pencil className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {isEdicao ? 'Editar Viagem' : 'Nova Viagem'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEdicao
                  ? 'Atualize os dados operacionais ou revise o valor aplicado nesta viagem.'
                  : 'Preencha os dados operacionais e selecione o pagador para calcular o frete e a data de recebimento.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              form="form-nova-viagem"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isEdicao ? 'Salvar Alterações' : 'Salvar Viagem'}
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

        {/* Diálogo de Confirmação ao Salvar Edição com Valor Divergente */}
        {perguntandoAtualizarValor && viagemParaEditar && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setPerguntandoAtualizarValor(false)}
          >
            <div
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Atualizar o valor bruto da viagem?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  O valor bruto registrado atualmente nesta viagem é{' '}
                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                    {formatarMoeda(viagemParaEditar.valorViagem)}
                  </strong>
                  , enquanto o valor calculado pela tabela é{' '}
                  <strong className="font-mono text-brand-600 dark:text-brand-400">
                    {formatarMoeda(valorTabelaCalculado)}
                  </strong>
                  . Deseja atualizar o valor ou manter o atual?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => efetivarSalvamento(false)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <Lock className="w-4 h-4 text-amber-500" />
                    Não atualizar ({formatarMoeda(viagemParaEditar.valorViagem)})
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Salva todas as outras alterações da viagem e mantém o valor bruto atual.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => efetivarSalvamento(true)}
                  className="p-3.5 rounded-xl border border-brand-500 bg-brand-50/60 dark:bg-brand-500/10 hover:bg-brand-50 dark:hover:bg-brand-500/20 text-left space-y-1 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-400">
                    <RefreshCw className="w-4 h-4" />
                    Atualizar ({formatarMoeda(valorTabelaCalculado)})
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Salva as edições e atualiza o valor bruto para o calculado pela tabela.
                  </p>
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPerguntandoAtualizarValor(false)}
                  className="h-8 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Voltar para edição
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Corpo com Scroll */}
        <form
          id="form-nova-viagem"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Coluna Esquerda (8 colunas): Formulário em 4 Blocos */}
          <div className="lg:col-span-8 space-y-6">
            {erroValidacao && (
              <div className="flex items-center gap-2 text-xs font-semibold px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroValidacao}</span>
              </div>
            )}

            {/* BLOCO 1: Tipo de Gado, Caminhão e Motorista */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Truck className="w-4 h-4 text-brand-500" />
                1. Tipo de Carga &amp; Veículo
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Gado *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoGado('boi_gordo')}
                      className={`h-10 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        tipoGado === 'boi_gordo'
                          ? 'bg-brand-500 border-brand-500 text-brand-contrast shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      Boi Gordo
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoGado('boi_magro')}
                      className={`h-10 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        tipoGado === 'boi_magro'
                          ? 'bg-brand-500 border-brand-500 text-brand-contrast shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      Boi Magro
                    </button>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Caminhão *
                  </label>
                  <select
                    required
                    value={caminhaoId}
                    onChange={(e) => handleSelecionarCaminhao(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Selecione um caminhão...</option>
                    {caminhoes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.placa})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Motorista
                  </label>
                  <select
                    value={motoristaId}
                    onChange={(e) => setMotoristaId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Sem motorista</option>
                    {motoristas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} {!m.ativo ? '(Inativo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BLOCO 2: Data, Locais, Frigorífico e Documentos */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-brand-500" />
                2. Rota, Origem/Destino &amp; Documentos
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="md:col-span-8">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Local de Embarque *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fazenda Santa Maria - Penápolis/SP"
                    value={localEmbarque}
                    onChange={(e) => setLocalEmbarque(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pecuarista
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do pecuarista / produtor"
                    value={pecuarista}
                    onChange={(e) => setPecuarista(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Local de Desembarque
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Marfrig Promissão / Fazenda Destino"
                    value={localDesembarque}
                    onChange={(e) => setLocalDesembarque(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Frigorífico Responsável
                  </label>
                  <select
                    value={frigorificoId}
                    onChange={(e) => setFrigorificoId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Nenhum / Não se aplica</option>
                    {frigorificos.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} {f.cidade ? `(${f.cidade}/${f.uf})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    CTe
                  </label>
                  <input
                    type="text"
                    placeholder="Número CTe"
                    value={cte}
                    onChange={(e) => setCte(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Minuta
                  </label>
                  <input
                    type="text"
                    placeholder="Número Minuta"
                    value={minuta}
                    onChange={(e) => setMinuta(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* BLOCO 3: Distância Percorrida */}
            <div className="bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Route className="w-4 h-4 text-brand-500" />
                  3. Distância Percorrida
                </div>

                <div className="inline-flex rounded-lg p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModoDistancia('hodometro')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      modoDistancia === 'hodometro'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Por Hodômetro
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoDistancia('manual')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      modoDistancia === 'manual'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Digitar Manualmente
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBaseKmInformada('ida_volta')}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    baseKmInformada === 'ida_volta'
                      ? 'border-brand-500 bg-white dark:bg-slate-900 ring-2 ring-brand-500/25'
                      : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 text-brand-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Distância Ida e Volta
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      O KM informado abaixo já inclui ida e volta
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBaseKmInformada('so_ida')}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    baseKmInformada === 'so_ida'
                      ? 'border-brand-500 bg-white dark:bg-slate-900 ring-2 ring-brand-500/25'
                      : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40'
                  }`}
                >
                  <ArrowRight className="w-4 h-4 text-brand-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Distância Só Ida (Uma perna)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Apenas o trajeto de ida (origem → destino)
                    </div>
                  </div>
                </button>
              </div>

              {modoDistancia === 'hodometro' ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Hodômetro Inicial (KM) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="Ex: 145200.5"
                      value={hodometroInicial}
                      onChange={(e) => setHodometroInicial(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Hodômetro Final (KM) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="Ex: 145380.5"
                      value={hodometroFinal}
                      onChange={(e) => setHodometroFinal(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <div className="h-10 px-3.5 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Distância:
                      </span>
                      <span className="text-sm font-mono font-bold text-brand-600 dark:text-brand-400">
                        {kmInformadoCalculado > 0
                          ? `${kmInformadoCalculado} km`
                          : '0 km'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Distância Percorrida (KM) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      placeholder="Ex: 180 ou 25.8"
                      value={kmManual}
                      onChange={(e) => setKmManual(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <div className="h-10 px-3.5 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Distância Informada:
                      </span>
                      <span className="text-sm font-mono font-bold text-brand-600 dark:text-brand-400">
                        {kmInformadoCalculado > 0
                          ? `${kmInformadoCalculado} km`
                          : '0 km'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita (4 colunas): Pagador, Tabela e Previsão de Recebimento */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  4. Pagamento &amp; Tabela
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Responsável pelo Pagamento *
                </label>
                <select
                  required
                  value={pagadorChave}
                  onChange={(e) => {
                    setPagadorChave(e.target.value);
                    setTabelaSelecionadaId('');
                  }}
                  className="w-full h-10 px-3 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Selecione quem vai pagar...</option>
                  {intermediarios.length > 0 && (
                    <optgroup label="Intermediários">
                      {intermediarios.map((i) => (
                        <option key={i.id} value={`intermediario:${i.id}`}>
                          {i.nome}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {frigorificos.length > 0 && (
                    <optgroup label="Frigoríficos">
                      {frigorificos.map((f) => (
                        <option key={f.id} value={`frigorifico:${f.id}`}>
                          {f.nome}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tabela de Preços Aplicada
                </label>
                {opcoesTabelasPagador.length === 0 ? (
                  <div className="p-3 rounded-lg text-xs bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300">
                    Nenhuma tabela de preços cadastrada para este pagador.
                  </div>
                ) : (
                  <select
                    value={tabelaAtivaParaCalculo?.id || ''}
                    onChange={(e) => setTabelaSelecionadaId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  >
                    {opcoesTabelasPagador.map((op) => (
                      <option key={op.tabela.id} value={op.tabela.id}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Aviso de Divergência entre Valor Manual / Anterior e Valor da Tabela */}
              {isEdicao &&
                viagemParaEditar &&
                haDivergenciaValorNaEdicao && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-2">
                    <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 leading-snug">
                      O valor salvo (
                      <span className="font-mono">
                        {formatarMoeda(viagemParaEditar.valorViagem)}
                      </span>
                      ) difere do calculado pela tabela (
                      <span className="font-mono">
                        {formatarMoeda(valorTabelaCalculado)}
                      </span>
                      ).
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUsarValorTabelaNaEdicao(false)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          !usarValorTabelaNaEdicao
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        Manter Atual
                      </button>
                      <button
                        type="button"
                        onClick={() => setUsarValorTabelaNaEdicao(true)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          usarValorTabelaNaEdicao
                            ? 'bg-brand-500 border-brand-500 text-brand-contrast'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Usar Tabela
                      </button>
                    </div>
                  </div>
                )}

              {/* Card Destaque: Previsão de Recebimento Detalhada */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-brand-500/30 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-brand-500" />
                    Previsão de Recebimento
                  </span>
                  {isEdicao &&
                    viagemParaEditar &&
                    !usarValorTabelaNaEdicao && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300">
                        Manual mantido
                      </span>
                    )}
                </div>

                {kmInformadoCalculado > 0 && tabelaAtivaParaCalculo ? (
                  previsaoTabela ||
                  (isEdicao &&
                    viagemParaEditar &&
                    !usarValorTabelaNaEdicao) ? (
                    <div className="space-y-3">
                      {/* Valor Bruto da Viagem */}
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Valor Bruto da Viagem
                        </div>
                        <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                          {formatarMoeda(valorBrutoFinal)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                          {isEdicao &&
                          viagemParaEditar &&
                          !usarValorTabelaNaEdicao
                            ? viagemParaEditar.regraPrecoAplicada
                            : previsaoTabela?.regraAplicada}
                        </div>
                      </div>

                      {/* Aluguel Carreta e Valor Líquido */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Aluguel da Carreta ({percentualAluguelFinal}%):
                          </span>
                          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                            {valorAluguelFinal > 0
                              ? `- ${formatarMoeda(valorAluguelFinal)}`
                              : formatarMoeda(0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            Valor Líquido (Bruto - Aluguel):
                          </span>
                          <span className="text-base font-mono font-extrabold text-brand-600 dark:text-brand-400">
                            {formatarMoeda(valorLiquidoFinal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                      A distância informada não está coberta pelas faixas desta tabela.
                    </div>
                  )
                ) : (
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Informe a distância e selecione o pagador para calcular automaticamente os valores da viagem.
                  </div>
                )}

                {/* Data Prevista de Recebimento */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Data Prevista de Recebimento
                  </div>
                  {previsaoDataRecebimento ? (
                    <>
                      <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatarDataBr(
                          previsaoDataRecebimento.dataRecebimentoIso
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {previsaoDataRecebimento.descricaoRegra}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400">
                      {tabelaAtivaParaCalculo
                        ? 'Sem ciclo de pagamento cadastrado para esta data/tipo de gado.'
                        : 'Selecione um pagador com tabela configurada.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}