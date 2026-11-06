import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Fuel,
  Truck,
  User,
  Gauge,
  FileText,
  Route,
  Search,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import * as cadastrosStorage from '../../../storage/cadastrosStorage';
import * as viagensStorage from '../../../storage/viagensStorage';
import {
  type Abastecimento,
  type ResponsavelPagamentoAbastecimento,
  type ResponsavelPagamentoItem,
  type ItemAbastecimento,
  obterUltimoHodometroCaminhao,
  obterViagensJaVinculadas,
  salvarAbastecimento,
  atualizarAbastecimento,
} from '../../../storage/abastecimentosStorage';

interface CaminhaoOption {
  id: string | number;
  nome?: string;
  apelido?: string;
  placa?: string;
  motoristaId?: string | number;
  motoristaPadraoId?: string | number;
  motorista_id?: string | number;
  motorista?: string;
  ativo?: boolean;
  status?: string;
}

interface MotoristaOption {
  id: string | number;
  nome: string;
  ativo?: boolean;
  status?: string;
}

interface ViagemOption {
  id: string | number;
  data?: string;
  embarque?: string;
  localEmbarque?: string;
  pecuarista?: string;
  desembarque?: string;
  minuta?: string;
  numeroMinuta?: string;
  caminhaoId?: string | number;
  arquivada?: boolean;
}

interface ItemFormState {
  id: string;
  descricao: string;
  quantidade: string;
  valorUnitario: string;
  desconto: string;
  responsavelPagamento: ResponsavelPagamentoItem;
}

interface ModalNovoAbastecimentoProps {
  aberto: boolean;
  abastecimentoEdicao?: Abastecimento | null;
  onFechar: () => void;
  onSalvo: () => void;
}

const LABEL_RESPONSAVEL: Record<ResponsavelPagamentoAbastecimento, string> = {
  minha_despesa: 'Minha despesa',
  frigorifico_desconta: 'Frigorífico desconta',
  frigorifico_ressarce: 'Frigorífico ressarce',
};

const SUGESTOES_ITENS = [
  'Diesel S10',
  'Diesel S500',
  'Arla 32',
  'Aditivo / Óleo',
];

function extrairLista<T>(
  modulo: Record<string, unknown>,
  chavesObjeto: string[],
  validador: (item: unknown) => boolean
): T[] {
  for (const valor of Object.values(modulo)) {
    if (typeof valor === 'function' && valor.length === 0) {
      try {
        const res = valor();
        if (Array.isArray(res) && res.length > 0 && validador(res[0])) {
          return res as T[];
        }
        if (res && typeof res === 'object') {
          for (const chave of chavesObjeto) {
            const lista = (res as Record<string, unknown>)[chave];
            if (Array.isArray(lista)) return lista as T[];
          }
        }
      } catch {
        // Ignora funções com argumentos
      }
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(k) || '');
      if (Array.isArray(parsed) && parsed.length > 0 && validador(parsed[0])) {
        return parsed as T[];
      }
      if (parsed && typeof parsed === 'object') {
        for (const chave of chavesObjeto) {
          const lista = (parsed as Record<string, unknown>)[chave];
          if (Array.isArray(lista)) return lista as T[];
        }
      }
    } catch {
      // Ignora entradas não-JSON
    }
  }

  return [];
}

function dataHoraAtualLocal(): string {
  const agora = new Date();
  const offset = agora.getTimezoneOffset();
  const local = new Date(agora.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatarRotuloViagem(v: ViagemOption): string {
  const dataFmt = v.data
    ? new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')
    : 'Sem data';
  const local = (v.localEmbarque || v.embarque || '').trim();
  const pecuarista = (v.pecuarista || '').trim();
  const minuta = (v.minuta || v.numeroMinuta || '').trim();

  const localEPecuarista = [local, pecuarista].filter(Boolean).join(' ');

  return [
    dataFmt,
    localEPecuarista || 'Sem local de embarque',
    minuta ? `Minuta ${minuta}` : null,
  ]
    .filter(Boolean)
    .join(' - ');
}

function parseNumero(valor: string): number {
  const limpo = valor.replace(',', '.').trim();
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function calcularValoresItem(item: ItemFormState): {
  bruto: number;
  desconto: number;
  liquido: number;
  modoEspecial: 'direto' | 'unitario' | 'total';
} {
  const qtd = parseNumero(item.quantidade);
  const unit = parseNumero(item.valorUnitario);
  const bruto = qtd * unit;
  const texto = item.desconto.trim();

  if (!texto) {
    return { bruto, desconto: 0, liquido: bruto, modoEspecial: 'direto' };
  }

  if (texto.startsWith('--')) {
    const totalAlvo = parseNumero(texto.slice(2));
    const descontoCalculado = Math.max(0, bruto - totalAlvo);
    return {
      bruto,
      desconto: descontoCalculado,
      liquido: Math.max(0, bruto - descontoCalculado),
      modoEspecial: 'total',
    };
  }

  if (texto.startsWith('-')) {
    const unitarioAlvo = parseNumero(texto.slice(1));
    const novoTotal = qtd * unitarioAlvo;
    const descontoCalculado = Math.max(0, bruto - novoTotal);
    return {
      bruto,
      desconto: descontoCalculado,
      liquido: Math.max(0, bruto - descontoCalculado),
      modoEspecial: 'unitario',
    };
  }

  const descontoDireto = parseNumero(texto);
  return {
    bruto,
    desconto: descontoDireto,
    liquido: Math.max(0, bruto - descontoDireto),
    modoEspecial: 'direto',
  };
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function criarItemVazio(descricao = 'Diesel S10'): ItemFormState {
  return {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    descricao,
    quantidade: '',
    valorUnitario: '',
    desconto: '',
    responsavelPagamento: 'padrao',
  };
}

function resolverMotoristaDoCaminhao(
  caminhao: CaminhaoOption | undefined,
  motoristas: MotoristaOption[]
): string {
  if (!caminhao) return '';

  const idBruto =
    caminhao.motoristaId ?? caminhao.motoristaPadraoId ?? caminhao.motorista_id;

  if (idBruto !== undefined && idBruto !== null && String(idBruto) !== '') {
    const existe = motoristas.find((m) => String(m.id) === String(idBruto));
    if (existe) return String(existe.id);
    return String(idBruto);
  }

  if (caminhao.motorista) {
    const termo = caminhao.motorista.trim().toLowerCase();
    const porNome = motoristas.find(
      (m) => m.nome.trim().toLowerCase() === termo
    );
    if (porNome) return String(porNome.id);
  }

  return '';
}

export function ModalNovoAbastecimento({
  aberto,
  abastecimentoEdicao,
  onFechar,
  onSalvo,
}: ModalNovoAbastecimentoProps) {
  const emEdicao = Boolean(abastecimentoEdicao);

  const [dataHora, setDataHora] = useState(dataHoraAtualLocal);
  const [caminhaoId, setCaminhaoId] = useState('');
  const [motoristaId, setMotoristaId] = useState('');
  const [hodometroInput, setHodometroInput] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [responsavelPagamento, setResponsavelPagamento] =
    useState<ResponsavelPagamentoAbastecimento>('minha_despesa');

  const [modoVinculoViagem, setModoVinculoViagem] = useState<'lista' | 'minuta'>(
    'lista'
  );
  const [viagemId, setViagemId] = useState('');
  const [minutaDigitada, setMinutaDigitada] = useState('');

  const [itens, setItens] = useState<ItemFormState[]>(() => [criarItemVazio()]);
  const [erro, setErro] = useState('');

  const caminhoes = useMemo(
    () =>
      extrairLista<CaminhaoOption>(
        cadastrosStorage as Record<string, unknown>,
        ['caminhoes'],
        (x) => typeof x === 'object' && x !== null && 'placa' in x
      ).filter((c) => c.ativo !== false && c.status !== 'inativo'),
    [aberto]
  );

  const motoristas = useMemo(
    () =>
      extrairLista<MotoristaOption>(
        cadastrosStorage as Record<string, unknown>,
        ['motoristas'],
        (x) =>
          typeof x === 'object' &&
          x !== null &&
          'nome' in x &&
          !('placa' in x) &&
          !('rodovia' in x) &&
          !('uf' in x)
      ).filter((m) => m.ativo !== false && m.status !== 'inativo'),
    [aberto]
  );

  const viagensDisponiveis = useMemo(() => {
    if (!caminhaoId) return [];

    const todas = extrairLista<ViagemOption>(
      viagensStorage as Record<string, unknown>,
      ['viagens'],
      (x) =>
        typeof x === 'object' &&
        x !== null &&
        'id' in x &&
        ('localEmbarque' in x || 'embarque' in x || 'tipoGado' in x)
    );
    const jaVinculadas = obterViagensJaVinculadas(abastecimentoEdicao?.id);

    return todas.filter(
      (v) =>
        !v.arquivada &&
        String(v.caminhaoId) === String(caminhaoId) &&
        !jaVinculadas.has(String(v.id))
    );
  }, [aberto, caminhaoId, abastecimentoEdicao?.id]);

  const ultimoHodometro = useMemo(
    () =>
      caminhaoId
        ? obterUltimoHodometroCaminhao(caminhaoId, abastecimentoEdicao?.id)
        : 0,
    [caminhaoId, abastecimentoEdicao?.id]
  );

  const handleSelecionarCaminhao = (novoId: string) => {
    setCaminhaoId(novoId);
    setViagemId('');
    setMinutaDigitada('');

    const encontrado = caminhoes.find((c) => String(c.id) === novoId);
    const motoristaVinculado = resolverMotoristaDoCaminhao(
      encontrado,
      motoristas
    );
    setMotoristaId(motoristaVinculado);
  };

  const viagemEncontradaPorMinuta = useMemo(() => {
    const termo = minutaDigitada.trim().toLowerCase();
    if (!termo) return undefined;
    return viagensDisponiveis.find((v) => {
      const m = (v.minuta || v.numeroMinuta || '').trim().toLowerCase();
      return m === termo;
    });
  }, [minutaDigitada, viagensDisponiveis]);

  useEffect(() => {
    if (!aberto) return;

    if (abastecimentoEdicao) {
      setDataHora(abastecimentoEdicao.dataHora || dataHoraAtualLocal());
      setCaminhaoId(String(abastecimentoEdicao.caminhaoId || ''));
      setMotoristaId(String(abastecimentoEdicao.motoristaId || ''));
      setHodometroInput(
        abastecimentoEdicao.hodometro > 0
          ? String(abastecimentoEdicao.hodometro)
          : ''
      );
      setNotaFiscal(abastecimentoEdicao.notaFiscal || '');
      setResponsavelPagamento(abastecimentoEdicao.responsavelPagamento);

      if (abastecimentoEdicao.viagemId) {
        setModoVinculoViagem('lista');
        setViagemId(String(abastecimentoEdicao.viagemId));
        setMinutaDigitada(abastecimentoEdicao.minutaNumero || '');
      } else if (abastecimentoEdicao.minutaNumero) {
        setModoVinculoViagem('minuta');
        setViagemId('');
        setMinutaDigitada(abastecimentoEdicao.minutaNumero);
      } else {
        setModoVinculoViagem('lista');
        setViagemId('');
        setMinutaDigitada('');
      }

      if (abastecimentoEdicao.itens && abastecimentoEdicao.itens.length > 0) {
        setItens(
          abastecimentoEdicao.itens.map((it) => ({
            id: it.id,
            descricao: it.descricao,
            quantidade: it.quantidade > 0 ? String(it.quantidade) : '',
            valorUnitario: it.valorUnitario > 0 ? String(it.valorUnitario) : '',
            desconto: it.desconto > 0 ? String(it.desconto) : '',
            responsavelPagamento: it.responsavelPagamento || 'padrao',
          }))
        );
      } else {
        setItens([criarItemVazio('Diesel S10')]);
      }

      setErro('');
      return;
    }

    const primeiroCaminhao = caminhoes[0];
    setDataHora(dataHoraAtualLocal());
    setCaminhaoId(primeiroCaminhao ? String(primeiroCaminhao.id) : '');
    setMotoristaId(resolverMotoristaDoCaminhao(primeiroCaminhao, motoristas));
    setHodometroInput('');
    setNotaFiscal('');
    setResponsavelPagamento('minha_despesa');
    setModoVinculoViagem('lista');
    setViagemId('');
    setMinutaDigitada('');
    setItens([criarItemVazio('Diesel S10')]);
    setErro('');
  }, [aberto, abastecimentoEdicao, caminhoes, motoristas]);

  useEffect(() => {
    if (!aberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, onFechar]);

  const adicionarItem = (descricaoPadrao = 'Diesel S10') => {
    setItens((prev) => [...prev, criarItemVazio(descricaoPadrao)]);
  };

  const atualizarItem = <K extends keyof ItemFormState>(
    id: string,
    campo: K,
    valor: ItemFormState[K]
  ) => {
    setItens((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  };

  const removerItem = (id: string) => {
    setItens((prev) => prev.filter((item) => item.id !== id));
  };

  const opcoesResponsavelItem = useMemo((): Array<{
    value: ResponsavelPagamentoItem;
    label: string;
  }> => {
    const todas: Array<{
      value: ResponsavelPagamentoItem;
      label: string;
    }> = [
      {
        value: 'padrao',
        label: `Padrão (${LABEL_RESPONSAVEL[responsavelPagamento]})`,
      },
      {
        value: 'minha_despesa',
        label: 'Minha despesa',
      },
      {
        value: 'frigorifico_desconta',
        label: 'Frigorífico desconta',
      },
      {
        value: 'frigorifico_ressarce',
        label: 'Frigorífico ressarce',
      },
    ];

    return todas.filter((op) => op.value !== responsavelPagamento);
  }, [responsavelPagamento]);

  const totais = useMemo(() => {
    let bruto = 0;
    let descontos = 0;
    let liquido = 0;

    for (const item of itens) {
      const calc = calcularValoresItem(item);
      bruto += calc.bruto;
      descontos += Math.min(calc.bruto, calc.desconto);
      liquido += calc.liquido;
    }

    return { bruto, descontos, liquido };
  }, [itens]);

  if (!aberto) return null;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataHora) {
      setErro('Informe a data e hora do abastecimento.');
      return;
    }
    if (!caminhaoId) {
      setErro('Selecione o caminhão.');
      return;
    }

    const hodometroInformado = hodometroInput.trim() !== '';
    const valorHodometro = hodometroInformado
      ? Number(hodometroInput.replace(',', '.'))
      : ultimoHodometro;

    if (hodometroInformado && Number.isNaN(valorHodometro)) {
      setErro('Informe um valor válido para o hodômetro.');
      return;
    }

    const itensValidos: ItemAbastecimento[] = itens
      .filter(
        (it) =>
          it.descricao.trim() !== '' &&
          (parseNumero(it.quantidade) > 0 || parseNumero(it.valorUnitario) > 0)
      )
      .map((it) => {
        const calc = calcularValoresItem(it);
        const respFinal: ResponsavelPagamentoItem =
          it.responsavelPagamento === responsavelPagamento
            ? 'padrao'
            : it.responsavelPagamento;

        return {
          id: it.id,
          descricao: it.descricao.trim(),
          quantidade: parseNumero(it.quantidade),
          valorUnitario: parseNumero(it.valorUnitario),
          desconto: calc.desconto,
          valorTotal: calc.liquido,
          responsavelPagamento: respFinal,
        };
      });

    const valorTotalFinal = itensValidos.reduce(
      (acc, item) => acc + item.valorTotal,
      0
    );

    let viagemVinculadaId: string | undefined;
    let minutaFinal: string | undefined;

    if (modoVinculoViagem === 'lista' && viagemId) {
      viagemVinculadaId = viagemId;
      const vObj = viagensDisponiveis.find((v) => String(v.id) === viagemId);
      minutaFinal = vObj?.minuta || vObj?.numeroMinuta;
    } else if (modoVinculoViagem === 'minuta' && minutaDigitada.trim()) {
      minutaFinal = minutaDigitada.trim();
      if (viagemEncontradaPorMinuta) {
        viagemVinculadaId = String(viagemEncontradaPorMinuta.id);
      }
    }

    const payload = {
      dataHora,
      caminhaoId,
      motoristaId: motoristaId || undefined,
      hodometro: valorHodometro,
      hodometroEstimado: !hodometroInformado,
      notaFiscal: notaFiscal.trim() || undefined,
      responsavelPagamento,
      viagemId: viagemVinculadaId,
      minutaNumero: minutaFinal,
      itens: itensValidos,
      valorTotal: valorTotalFinal,
    };

    if (abastecimentoEdicao) {
      atualizarAbastecimento(abastecimentoEdicao.id, payload);
    } else {
      salvarAbastecimento(payload);
    }

    onSalvo();
    onFechar();
  };

  const OPCOES_RESPONSAVEL: Array<{
    id: ResponsavelPagamentoAbastecimento;
    titulo: string;
    descricao: string;
  }> = [
    {
      id: 'minha_despesa',
      titulo: 'Minha despesa',
      descricao: 'Custo operacional assumido pela transportadora.',
    },
    {
      id: 'frigorifico_desconta',
      titulo: 'Frigorífico desconta',
      descricao: 'Abastecimento faturado pelo frigorífico para desconto no frete.',
    },
    {
      id: 'frigorifico_ressarce',
      titulo: 'Frigorífico ressarce',
      descricao: 'Pago pela transportadora com reembolso previsto pelo frigorífico.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-abastecimento"
    >
      <div className="w-[96vw] h-[94vh] max-w-6xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="titulo-modal-abastecimento"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {emEdicao ? 'Editar Abastecimento' : 'Novo Abastecimento'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preencha os dados do cupom/nota, responsável pelo pagamento, vínculo com viagem e itens.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com rolagem */}
        <form
          onSubmit={handleSalvar}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {erro && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">
              {erro}
            </div>
          )}

          {/* Bloco 1: Dados Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Data e Hora *
              </label>
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                <Truck className="w-3.5 h-3.5" />
                Caminhão *
              </label>
              <select
                value={caminhaoId}
                onChange={(e) => handleSelecionarCaminhao(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
              >
                <option value="">Selecione um caminhão...</option>
                {caminhoes.map((c, idx) => {
                  const nome = c.nome || c.apelido || `Caminhão ${idx + 1}`;
                  return (
                    <option key={String(c.id)} value={String(c.id)}>
                      {nome} {c.placa ? `(${c.placa})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                <User className="w-3.5 h-3.5" />
                Motorista
              </label>
              <select
                value={motoristaId}
                onChange={(e) => setMotoristaId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
              >
                <option value="">Sem motorista / Não informado</option>
                {motoristas.map((m) => (
                  <option key={String(m.id)} value={String(m.id)}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" />
                  Hodômetro (km)
                </span>
                <span className="text-[11px] font-normal normal-case text-slate-400">
                  Anterior: {ultimoHodometro.toLocaleString('pt-BR')} km
                </span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={hodometroInput}
                onChange={(e) => setHodometroInput(e.target.value)}
                placeholder={`Vazio usa leitura anterior (${ultimoHodometro} km)`}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                Nota Fiscal / Cupom
              </label>
              <input
                type="text"
                value={notaFiscal}
                onChange={(e) => setNotaFiscal(e.target.value)}
                placeholder="Ex.: NF-e 000.123.456 ou número do cupom fiscal"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Bloco 2: Responsável pelo pagamento */}
          <div className="space-y-2.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Responsável pelo Pagamento (Padrão do Abastecimento) *
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {OPCOES_RESPONSAVEL.map((opcao) => {
                const selecionado = responsavelPagamento === opcao.id;
                return (
                  <label
                    key={opcao.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selecionado
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="responsavelPagamento"
                      value={opcao.id}
                      checked={selecionado}
                      onChange={() => setResponsavelPagamento(opcao.id)}
                      className="mt-1 accent-brand-500 cursor-pointer"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        {opcao.titulo}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {opcao.descricao}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bloco 3: Vínculo com Viagem Específica */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Vincular a uma Viagem Específica (Opcional)
                </span>
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setModoVinculoViagem('lista')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    modoVinculoViagem === 'lista'
                      ? 'bg-brand-500 text-slate-950 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Selecionar na Lista
                </button>
                <button
                  type="button"
                  onClick={() => setModoVinculoViagem('minuta')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    modoVinculoViagem === 'minuta'
                      ? 'bg-brand-500 text-slate-950 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Digitar Nº da Minuta
                </button>
              </div>
            </div>

            {modoVinculoViagem === 'lista' ? (
              <div>
                <select
                  value={viagemId}
                  onChange={(e) => setViagemId(e.target.value)}
                  disabled={!caminhaoId}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 disabled:opacity-50"
                >
                  <option value="">
                    {!caminhaoId
                      ? 'Selecione primeiro um caminhão...'
                      : `Nenhuma viagem selecionada (${viagensDisponiveis.length} disponível(is) para este caminhão)`}
                  </option>
                  {viagensDisponiveis.map((v) => (
                    <option key={String(v.id)} value={String(v.id)}>
                      {formatarRotuloViagem(v)}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Exibe apenas viagens do caminhão selecionado que ainda não possuem abastecimento vinculado.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={minutaDigitada}
                    onChange={(e) => setMinutaDigitada(e.target.value)}
                    disabled={!caminhaoId}
                    placeholder={
                      caminhaoId
                        ? 'Digite o número da minuta da viagem deste caminhão...'
                        : 'Selecione primeiro um caminhão...'
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 disabled:opacity-50"
                  />
                </div>

                {minutaDigitada.trim() !== '' && (
                  <div className="text-xs">
                    {viagemEncontradaPorMinuta ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Viagem disponível localizada:{' '}
                        {formatarRotuloViagem(viagemEncontradaPorMinuta)}
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">
                        Nenhuma viagem disponível deste caminhão encontrada com esta minuta (o número ficará registrado no abastecimento).
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bloco 4: Itens do Abastecimento */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Itens do Abastecimento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  No desconto, digite o valor direto (ex.:{' '}
                  <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    10
                  </code>
                  ),{' '}
                  <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    -10
                  </code>{' '}
                  para novo valor unitário ou{' '}
                  <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    --10
                  </code>{' '}
                  para fechar o valor total do item.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {SUGESTOES_ITENS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => adicionarItem(sug)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-brand-500/40 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-500" />
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {itens.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhum item adicionado. Clique nos botões acima para inserir Diesel S10, Arla 32 ou outro item.
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item, idx) => {
                  const calc = calcularValoresItem(item);
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/70 p-3.5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Item #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerItem(item.id)}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-start">
                        <div className="lg:col-span-3">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Produto / Descrição
                          </label>
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) =>
                              atualizarItem(item.id, 'descricao', e.target.value)
                            }
                            placeholder="Ex.: Diesel S10"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Qtd (Litros)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantidade}
                            onChange={(e) =>
                              atualizarItem(item.id, 'quantidade', e.target.value)
                            }
                            placeholder="0,00"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Valor Unit. (R$)
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.valorUnitario}
                            onChange={(e) =>
                              atualizarItem(
                                item.id,
                                'valorUnitario',
                                e.target.value
                              )
                            }
                            placeholder="0,000"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Desconto (R$)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.desconto}
                            onChange={(e) =>
                              atualizarItem(item.id, 'desconto', e.target.value)
                            }
                            placeholder="10, -unit, --total"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                          />
                          {calc.modoEspecial !== 'direto' && (
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                              Desc.: {formatarMoeda(calc.desconto)}
                            </span>
                          )}
                        </div>

                        <div className="lg:col-span-3">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Responsável pelo Item
                          </label>
                          <select
                            value={item.responsavelPagamento}
                            onChange={(e) =>
                              atualizarItem(
                                item.id,
                                'responsavelPagamento',
                                e.target.value as ResponsavelPagamentoItem
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                          >
                            {opcoesResponsavelItem.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-4 pt-1 border-t border-slate-200/70 dark:border-slate-800/70 text-xs">
                        {calc.desconto > 0 && (
                          <span className="text-slate-400">
                            Bruto: {formatarMoeda(calc.bruto)} • Desconto:{' '}
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              -{formatarMoeda(calc.desconto)}
                            </span>
                          </span>
                        )}
                        <span className="text-slate-500 dark:text-slate-400">
                          Total do item:{' '}
                          <strong className="text-sm text-slate-900 dark:text-white">
                            {formatarMoeda(calc.liquido)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-6 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                Subtotal bruto:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatarMoeda(totais.bruto)}
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Descontos:{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  - {formatarMoeda(totais.descontos)}
                </span>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-200">
                Total líquido:{' '}
                <strong className="text-base font-bold text-brand-600 dark:text-brand-400">
                  {formatarMoeda(totais.liquido)}
                </strong>
              </div>
            </div>
          </div>
        </form>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {emEdicao ? 'Salvar Alterações' : 'Salvar Abastecimento'}
          </button>
        </div>
      </div>
    </div>
  );
}