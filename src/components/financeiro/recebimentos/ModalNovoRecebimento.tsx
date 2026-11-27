import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Wallet,
  Calendar,
  Truck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Fuel,
  Wrench,
  Milestone,
  ReceiptText,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Gauge,
} from 'lucide-react';
import {
  listarIdsDespesasJaAcertadas,
  listarIdsReembolsosEDescontosJaPagos,
  listarIdsViagensJaRecebidas,
  obterSaldoCaminhaoPagadorNaCarteira,
  registrarRecebimento,
} from '../../../storage/recebimentosStorage';
import {
  lerDadosWallet,
  type TipoPagadorWallet,
} from '../../../storage/walletStorage';

interface ModalNovoRecebimentoProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvo?: () => void;
}

type AbaModal = 'viagens' | 'despesas' | 'ajustes';
type TipoPagador = TipoPagadorWallet;
type TipoDespesa = 'abastecimento' | 'manutencao' | 'pedagio';
type NaturezaItem = 'desconto' | 'ressarcimento';

interface CaminhaoOption {
  id: string;
  nome: string;
  placa?: string;
}

interface PagadorOption {
  id: string;
  tipo: TipoPagador;
  nome: string;
}

interface ViagemCandidata {
  id: string;
  data: string;
  caminhaoId: string;
  pagadorTipo: TipoPagador;
  pagadorId: string;
  embarque: string;
  desembarque: string;
  tipoGado: string;
  km: number;
  baseKm: string;
  valorEsperado: number;
}

interface DespesaCandidata {
  id: string;
  registroOriginalId: string;
  tipo: TipoDespesa;
  natureza: NaturezaItem;
  data: string;
  caminhaoId: string;
  descricao: string;
  detalheExtra?: string;
  valor: number;
}

interface MovimentoWalletCandidato {
  id: string;
  data: string;
  descricao: string;
  natureza: NaturezaItem;
  valor: number;
  caminhaoId: string;
  pagadorTipo: TipoPagador;
  pagadorId: string;
  tipoSub?: string;
}

interface AjusteManualForm {
  id: string;
  descricao: string;
  natureza: NaturezaItem;
  valor: string;
}

function arredondar2(valor: number): number {
  return Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
}

function sanitizarValorPositivo(raw: string): string {
  const semNegativo = raw.replace(/-/g, '').replace(/[^0-9.,]/g, '');
  const normalizado = semNegativo.replace(',', '.');
  const partes = normalizado.split('.');
  const inteiroBruto = partes[0] ?? '';
  const decimalBruto = partes.slice(1).join('');

  const inteiroLimpo =
    inteiroBruto === '' ? '0' : inteiroBruto.replace(/^0+(?=\d)/, '');

  if (partes.length > 1) {
    return `${inteiroLimpo}.${decimalBruto.slice(0, 2)}`;
  }
  return inteiroLimpo;
}

function parseValorPositivo(texto: string): number {
  const num = parseFloat(texto.replace(',', '.'));
  if (!Number.isFinite(num) || num < 0) return 0;
  return arredondar2(num);
}

function formatarMoeda(valor: number): string {
  return arredondar2(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarKm(km: number): string {
  return `${km.toLocaleString('pt-BR', {
    minimumFractionDigits: km % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 2,
  })} km`;
}

function formatarDataBr(iso: string): string {
  if (!iso) return '-';
  const limpo = iso.slice(0, 10);
  const partes = limpo.split('-');
  if (partes.length !== 3) return iso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function lerArrayChave(chave: string): Record<string, unknown>[] {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return [];
    const parsed = JSON.parse(bruto);
    if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
    if (parsed && typeof parsed === 'object') {
      for (const prop of ['itens', 'items', 'dados', 'lista', 'registros']) {
        const val = (parsed as Record<string, unknown>)[prop];
        if (Array.isArray(val)) return val as Record<string, unknown>[];
      }
    }
    return [];
  } catch {
    return [];
  }
}

function lerPrimeiraChaveNaoVazia(chaves: string[]): Record<string, unknown>[] {
  for (const chave of chaves) {
    const lista = lerArrayChave(chave);
    if (lista.length > 0) return lista;
  }
  return [];
}

function lerMovimentosWalletAbertos(
  idsJaPagos: Set<string>
): MovimentoWalletCandidato[] {
  const wallet = lerDadosWallet();
  const movimentos: MovimentoWalletCandidato[] = [];

  for (const d of wallet.descontos) {
    if (d.arquivado || d.pagoEmRecebimentoId || idsJaPagos.has(String(d.id))) {
      continue;
    }
    if (!d.caminhaoId || !d.pagadorId) continue;
    const val = Math.abs(Number(d.valor ?? 0));
    if (!Number.isFinite(val) || val <= 0) continue;

    movimentos.push({
      id: String(d.id),
      data: String(d.data ?? d.criadoEm ?? '').slice(0, 10),
      descricao: String(d.descricao ?? 'Desconto'),
      natureza: 'desconto',
      valor: arredondar2(val),
      caminhaoId: String(d.caminhaoId),
      pagadorTipo: d.pagadorTipo,
      pagadorId: String(d.pagadorId),
      tipoSub: d.tipo ? String(d.tipo) : undefined,
    });
  }

  for (const r of wallet.reembolsos) {
    if (r.arquivado || r.pagoEmRecebimentoId || idsJaPagos.has(String(r.id))) {
      continue;
    }
    if (!r.caminhaoId || !r.pagadorId) continue;
    const val = Math.abs(Number(r.valor ?? 0));
    if (!Number.isFinite(val) || val <= 0) continue;

    movimentos.push({
      id: String(r.id),
      data: String(r.data ?? r.criadoEm ?? '').slice(0, 10),
      descricao: String(r.descricao ?? 'Reembolso'),
      natureza: 'ressarcimento',
      valor: arredondar2(val),
      caminhaoId: String(r.caminhaoId),
      pagadorTipo: r.pagadorTipo,
      pagadorId: String(r.pagadorId),
      tipoSub: r.tipo ? String(r.tipo) : undefined,
    });
  }

  return movimentos;
}

function resolverNaturezaDespesa(
  raw: Record<string, unknown>
): NaturezaItem | null {
  const resp = String(raw.responsavelPagamento ?? '').trim();
  if (resp === 'minha_despesa') return null;
  if (
    resp === 'frigorifico_ressarce' ||
    resp === 'ressarcimento' ||
    resp === 'reembolso'
  ) {
    return 'ressarcimento';
  }
  if (resp === 'frigorifico_desconta' || resp === 'desconto') {
    return 'desconto';
  }

  const natDireta = String(raw.natureza ?? raw.tipoAcerto ?? '').trim();
  if (natDireta === 'ressarcimento' || natDireta === 'reembolso') {
    return 'ressarcimento';
  }
  if (natDireta === 'desconto') return 'desconto';

  return 'desconto';
}

function extrairDespesasCandidatas(
  registros: Record<string, unknown>[],
  tipo: TipoDespesa,
  idsAcertadas: Set<string>
): DespesaCandidata[] {
  const resultado: DespesaCandidata[] = [];

  const obterDescricaoBase = (reg: Record<string, unknown>): string => {
    if (tipo === 'abastecimento') {
      return String(reg.posto || reg.descricao || 'Abastecimento');
    }
    if (tipo === 'manutencao') {
      return String(reg.descricao || reg.servico || 'Manutenção');
    }
    return String(reg.praca || reg.nome || reg.descricao || 'Pedágio');
  };

  const obterDetalhePai = (reg: Record<string, unknown>): string | undefined => {
    if (tipo === 'abastecimento') {
      return reg.notaFiscal ? `NF ${String(reg.notaFiscal)}` : undefined;
    }
    if (tipo === 'pedagio') {
      const rodovia = reg.rodovia ? String(reg.rodovia) : undefined;
      const kmPraca =
        reg.km !== undefined && reg.km !== null && String(reg.km) !== ''
          ? `KM ${String(reg.km)}`
          : undefined;
      const juntado = [rodovia, kmPraca].filter(Boolean).join(' • ');
      return juntado || undefined;
    }
    return undefined;
  };

  for (const reg of registros) {
    if (reg.arquivado) continue;
    const regId = String(reg.id ?? '');
    if (!regId) continue;

    const respPai = String(reg.responsavelPagamento ?? '').trim();
    const dataReg = String(reg.data ?? reg.dataHora ?? '').slice(0, 10);
    const camId = String(reg.caminhaoId ?? '');
    const detalhePai = obterDetalhePai(reg);
    const itensRaw = Array.isArray(reg.itens)
      ? (reg.itens as Record<string, unknown>[])
      : [];

    if (itensRaw.length > 0) {
      itensRaw.forEach((it, idx) => {
        const respItemRaw = String(it.responsavelPagamento ?? 'padrao').trim();
        const respEfetivo =
          !respItemRaw || respItemRaw === 'padrao' ? respPai : respItemRaw;
        if (respEfetivo === 'minha_despesa') return;

        const natureza = resolverNaturezaDespesa({
          ...it,
          responsavelPagamento: respEfetivo,
        });
        if (!natureza) return;

        const itemId = String(it.id ?? `${idx}`);
        const candidatoId = `${regId}::${itemId}`;
        if (
          idsAcertadas.has(candidatoId) ||
          idsAcertadas.has(itemId) ||
          idsAcertadas.has(regId)
        ) {
          return;
        }

        const qtd = Number(it.quantidade ?? 0);
        const unit = Number(it.valorUnitario ?? 0);
        const descItem = Number(it.desconto ?? 0);
        const valorItem =
          it.valorTotal !== undefined && it.valorTotal !== null
            ? Number(it.valorTotal)
            : tipo === 'abastecimento'
              ? Math.max(0, qtd * unit - descItem)
              : Number(it.valor ?? 0);

        const detalheItem =
          tipo === 'abastecimento'
            ? [
                qtd > 0
                  ? `${qtd.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`
                  : null,
                unit > 0 ? `${formatarMoeda(unit)}/L` : null,
                detalhePai,
              ]
                .filter(Boolean)
                .join(' • ') || undefined
            : detalhePai;

        resultado.push({
          id: candidatoId,
          registroOriginalId: regId,
          tipo,
          natureza,
          data: dataReg,
          caminhaoId: camId,
          descricao: String(it.descricao || obterDescricaoBase(reg)),
          detalheExtra: detalheItem,
          valor: arredondar2(valorItem),
        });
      });
    } else {
      if (respPai === 'minha_despesa') continue;
      const natureza = resolverNaturezaDespesa(reg);
      if (!natureza || idsAcertadas.has(regId)) continue;

      resultado.push({
        id: regId,
        registroOriginalId: regId,
        tipo,
        natureza,
        data: dataReg,
        caminhaoId: camId,
        descricao: obterDescricaoBase(reg),
        detalheExtra: detalhePai,
        valor: arredondar2(Number(reg.valorTotal ?? reg.valor ?? 0)),
      });
    }
  }

  return resultado;
}

export function ModalNovoRecebimento({
  aberto,
  onFechar,
  onSalvo,
}: ModalNovoRecebimentoProps) {
  const hojeIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [dataPagamento, setDataPagamento] = useState<string>(hojeIso);
  const [caminhaoId, setCaminhaoId] = useState<string>('');
  const [pagadorChave, setPagadorChave] = useState<string>('');

  const [abaAtiva, setAbaAtiva] = useState<AbaModal>('viagens');
  const [filtroTipoDespesa, setFiltroTipoDespesa] = useState<
    'todas' | TipoDespesa
  >('todas');

  const [viagensSelecionadas, setViagensSelecionadas] = useState<
    Record<string, string>
  >({});
  const [despesasSelecionadas, setDespesasSelecionadas] = useState<
    Record<string, string>
  >({});
  const [movimentosWalletSelecionados, setMovimentosWalletSelecionados] =
    useState<Record<string, string>>({});
  const [ajustesManuais, setAjustesManuais] = useState<AjusteManualForm[]>([]);
  const [novoAjusteDesc, setNovoAjusteDesc] = useState('');
  const [novoAjusteNatureza, setNovoAjusteNatureza] =
    useState<NaturezaItem>('desconto');
  const [novoAjusteValor, setNovoAjusteValor] = useState('');

  const [compensarSaldoAnterior, setCompensarSaldoAnterior] =
    useState<boolean>(true);
  const [valorEfetivoInput, setValorEfetivoInput] = useState<string>('0');
  const [observacoes, setObservacoes] = useState<string>('');
  const [erroValidacao, setErroValidacao] = useState<string>('');

  const {
    caminhoes,
    pagadores,
    todasViagens,
    todasDespesas,
    movimentosWallet,
  } = useMemo(() => {
    if (!aberto) {
      return {
        caminhoes: [] as CaminhaoOption[],
        pagadores: [] as PagadorOption[],
        todasViagens: [] as ViagemCandidata[],
        todasDespesas: [] as DespesaCandidata[],
        movimentosWallet: [] as MovimentoWalletCandidato[],
      };
    }

    const listaCaminhoes: CaminhaoOption[] = lerArrayChave('bt_cad_caminhoes')
      .filter((c) => c.ativo !== false)
      .map((c) => ({
        id: String(c.id ?? ''),
        nome: String(c.apelido || c.nome || c.modelo || 'Caminhão'),
        placa: c.placa ? String(c.placa) : undefined,
      }))
      .filter((c) => Boolean(c.id));

    const listaPagadores: PagadorOption[] = [
      ...lerArrayChave('bt_cad_intermediarios')
        .filter((i) => i.ativo !== false && i.id !== undefined)
        .map((i) => ({
          id: String(i.id),
          tipo: 'intermediario' as const,
          nome: `${String(i.nome || 'Intermediário')} (Intermediário)`,
        })),
      ...lerArrayChave('bt_cad_frigorificos')
        .filter((f) => f.ativo !== false && f.id !== undefined)
        .map((f) => ({
          id: String(f.id),
          tipo: 'frigorifico' as const,
          nome: `${String(f.nome || 'Frigorífico')} (Frigorífico)`,
        })),
    ];

    const idsViagensPagas = listarIdsViagensJaRecebidas();
    const listaViagens: ViagemCandidata[] = lerArrayChave('bt_viagens_ativas')
      .filter((v) => !v.arquivada && !idsViagensPagas.has(String(v.id ?? '')))
      .map((v) => {
        const respTipo: TipoPagador =
          v.pagadorTipo === 'frigorifico' ||
          v.responsavelPagamentoTipo === 'frigorifico'
            ? 'frigorifico'
            : 'intermediario';

        const respId = String(
          v.pagadorId ??
            v.responsavelPagamentoId ??
            (respTipo === 'intermediario'
              ? v.intermediarioId
              : v.frigorificoId) ??
            ''
        );

        const bruto = Number(
          v.valorViagem ?? v.valorBruto ?? v.valorFrete ?? v.valor ?? 0
        );
        const aluguel = Number(v.valorAluguelCarreta ?? 0);
        const esperado =
          v.valorLiquidoViagem !== undefined && v.valorLiquidoViagem !== null
            ? Number(v.valorLiquidoViagem)
            : v.valorLiquido !== undefined && v.valorLiquido !== null
              ? Number(v.valorLiquido)
              : bruto - aluguel;

        const kmRaw = Number(
          v.kmInformado ?? v.kmUmaPernaCalculado ?? v.km ?? 0
        );

        return {
          id: String(v.id ?? ''),
          data: String(v.data ?? v.dataViagem ?? '').slice(0, 10),
          caminhaoId: String(v.caminhaoId ?? ''),
          pagadorTipo: respTipo,
          pagadorId: respId,
          embarque: String(
            v.localEmbarque || v.embarque || v.origem || 'Origem'
          ),
          desembarque: String(
            v.localDesembarque || v.desembarque || v.destino || 'Destino'
          ),
          tipoGado: v.tipoGado === 'boi_magro' ? 'Boi Magro' : 'Boi Gordo',
          km: Number.isFinite(kmRaw) ? kmRaw : 0,
          baseKm: v.baseKmInformada === 'ida_volta' ? 'Ida/Volta' : '1 Perna',
          valorEsperado: arredondar2(esperado),
        };
      })
      .filter((v) => Boolean(v.id));

    const idsDespesasAcertadas = listarIdsDespesasJaAcertadas();
    const rawAbast = lerArrayChave('bt_despesas_abastecimentos');
    const rawManut = lerArrayChave('bt_despesas_manutencoes');
    const rawPedag = lerPrimeiraChaveNaoVazia([
      'bt_despesas_pedagios',
      'bt_pedagios_lancamentos',
      'bt_pedagios',
    ]);

    const idsAjustesPagos = listarIdsReembolsosEDescontosJaPagos();
    const movimentosWalletAbertos = lerMovimentosWalletAbertos(idsAjustesPagos);

    return {
      caminhoes: listaCaminhoes,
      pagadores: listaPagadores,
      todasViagens: listaViagens,
      todasDespesas: [
        ...extrairDespesasCandidatas(
          rawAbast,
          'abastecimento',
          idsDespesasAcertadas
        ),
        ...extrairDespesasCandidatas(
          rawManut,
          'manutencao',
          idsDespesasAcertadas
        ),
        ...extrairDespesasCandidatas(
          rawPedag,
          'pedagio',
          idsDespesasAcertadas
        ),
      ],
      movimentosWallet: movimentosWalletAbertos,
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    setDataPagamento(hojeIso);
    setCaminhaoId(caminhoes[0]?.id || '');
    setPagadorChave(
      pagadores[0] ? `${pagadores[0].tipo}:${pagadores[0].id}` : ''
    );
    setAbaAtiva('viagens');
    setFiltroTipoDespesa('todas');
    setViagensSelecionadas({});
    setDespesasSelecionadas({});
    setMovimentosWalletSelecionados({});
    setAjustesManuais([]);
    setNovoAjusteDesc('');
    setNovoAjusteValor('');
    setCompensarSaldoAnterior(true);
    setValorEfetivoInput('0');
    setObservacoes('');
    setErroValidacao('');
  }, [aberto, hojeIso, caminhoes, pagadores]);

  useEffect(() => {
    setViagensSelecionadas({});
    setDespesasSelecionadas({});
    setMovimentosWalletSelecionados({});
    setErroValidacao('');
  }, [dataPagamento, caminhaoId, pagadorChave]);

  useEffect(() => {
    if (!aberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, onFechar]);

  const pagadorSelecionado = useMemo(() => {
    if (!pagadorChave) return null;
    const idx = pagadorChave.indexOf(':');
    if (idx === -1) return null;
    const tipo = pagadorChave.slice(0, idx) as TipoPagador;
    const id = pagadorChave.slice(idx + 1);
    return (
      pagadores.find(
        (p) => p.tipo === tipo && String(p.id) === String(id)
      ) || null
    );
  }, [pagadorChave, pagadores]);

  const caminhaoSelecionado = useMemo(
    () => caminhoes.find((c) => String(c.id) === String(caminhaoId)) || null,
    [caminhaoId, caminhoes]
  );

  const saldoAnteriorPagador = useMemo(() => {
    if (!caminhaoId || !pagadorSelecionado) return 0;
    return arredondar2(
      obterSaldoCaminhaoPagadorNaCarteira(
        caminhaoId,
        pagadorSelecionado.tipo,
        pagadorSelecionado.id
      )
    );
  }, [caminhaoId, pagadorSelecionado]);

  const viagensElegiveis = useMemo(() => {
    if (!dataPagamento || !caminhaoId || !pagadorSelecionado) return [];
    return todasViagens
      .filter((v) => {
        if (v.data && v.data > dataPagamento) return false;
        if (String(v.caminhaoId) !== String(caminhaoId)) return false;
        if (v.pagadorTipo !== pagadorSelecionado.tipo) return false;
        if (String(v.pagadorId) !== String(pagadorSelecionado.id)) return false;
        return true;
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [todasViagens, dataPagamento, caminhaoId, pagadorSelecionado]);

  const despesasDoCaminhaoNoPeriodo = useMemo(() => {
    if (!dataPagamento || !caminhaoId) return [];
    return todasDespesas
      .filter((d) => {
        if (d.data && d.data > dataPagamento) return false;
        if (String(d.caminhaoId) !== String(caminhaoId)) return false;
        return true;
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [todasDespesas, dataPagamento, caminhaoId]);

  const despesasElegiveis = useMemo(() => {
    if (filtroTipoDespesa === 'todas') return despesasDoCaminhaoNoPeriodo;
    return despesasDoCaminhaoNoPeriodo.filter(
      (d) => d.tipo === filtroTipoDespesa
    );
  }, [despesasDoCaminhaoNoPeriodo, filtroTipoDespesa]);

  const movimentosWalletElegiveis = useMemo(() => {
    if (!dataPagamento || !caminhaoId || !pagadorSelecionado) return [];
    return movimentosWallet
      .filter((m) => {
        if (m.data && m.data > dataPagamento) return false;
        if (String(m.caminhaoId) !== String(caminhaoId)) return false;
        if (m.pagadorTipo !== pagadorSelecionado.tipo) return false;
        if (String(m.pagadorId) !== String(pagadorSelecionado.id)) return false;
        return true;
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [movimentosWallet, dataPagamento, caminhaoId, pagadorSelecionado]);

  const qtdAjustesSelecionados =
    Object.keys(movimentosWalletSelecionados).length + ajustesManuais.length;

  const resumo = useMemo(() => {
    let totalViagens = 0;
    let totalViagensEsperado = 0;

    for (const v of viagensElegiveis) {
      if (viagensSelecionadas[v.id] !== undefined) {
        const val = parseValorPositivo(viagensSelecionadas[v.id]);
        totalViagens = arredondar2(totalViagens + val);
        totalViagensEsperado = arredondar2(
          totalViagensEsperado + arredondar2(v.valorEsperado)
        );
      }
    }

    let totalRessarcimentos = 0;
    let totalRessarcimentosEsperado = 0;
    let totalDescontos = 0;
    let totalDescontosEsperado = 0;

    const acumularItem = (
      natureza: NaturezaItem,
      valorConsiderado: number,
      valorOriginal: number
    ) => {
      if (natureza === 'ressarcimento') {
        totalRessarcimentos = arredondar2(
          totalRessarcimentos + valorConsiderado
        );
        totalRessarcimentosEsperado = arredondar2(
          totalRessarcimentosEsperado + valorOriginal
        );
      } else {
        totalDescontos = arredondar2(totalDescontos + valorConsiderado);
        totalDescontosEsperado = arredondar2(
          totalDescontosEsperado + valorOriginal
        );
      }
    };

    for (const d of despesasDoCaminhaoNoPeriodo) {
      const valorTexto = despesasSelecionadas[d.id];
      if (valorTexto !== undefined) {
        acumularItem(
          d.natureza,
          parseValorPositivo(valorTexto),
          arredondar2(d.valor)
        );
      }
    }

    for (const m of movimentosWalletElegiveis) {
      const valorTexto = movimentosWalletSelecionados[m.id];
      if (valorTexto !== undefined) {
        acumularItem(
          m.natureza,
          parseValorPositivo(valorTexto),
          arredondar2(m.valor)
        );
      }
    }

    for (const aj of ajustesManuais) {
      const num = parseValorPositivo(aj.valor);
      acumularItem(aj.natureza, num, num);
    }

    const ajusteSaldoAnterior = compensarSaldoAnterior
      ? arredondar2(saldoAnteriorPagador)
      : 0;

    const valorEsperadoAcerto = arredondar2(
      totalViagensEsperado +
        totalRessarcimentosEsperado -
        totalDescontosEsperado +
        ajusteSaldoAnterior
    );

    const subtotalCiclo = arredondar2(
      totalViagens + totalRessarcimentos - totalDescontos
    );

    const liquidoCalculado = arredondar2(subtotalCiclo + ajusteSaldoAnterior);
    const diferencaAcerto = arredondar2(
      liquidoCalculado - valorEsperadoAcerto
    );

    const valorEfetivamentePagoNum = parseValorPositivo(valorEfetivoInput);

    const saldoNaoCompensado = compensarSaldoAnterior
      ? 0
      : arredondar2(saldoAnteriorPagador);

    const novoSaldoPagador = arredondar2(
      liquidoCalculado - valorEfetivamentePagoNum + saldoNaoCompensado
    );

    return {
      qtdViagens: Object.keys(viagensSelecionadas).length,
      qtdDespesas: Object.keys(despesasSelecionadas).length,
      qtdAjustes: qtdAjustesSelecionados,
      totalViagens,
      totalViagensEsperado,
      totalRessarcimentos,
      totalDescontos,
      valorEsperadoAcerto,
      liquidoCalculado,
      diferencaAcerto,
      valorEfetivamentePagoNum,
      novoSaldoPagador,
    };
  }, [
    viagensElegiveis,
    viagensSelecionadas,
    despesasDoCaminhaoNoPeriodo,
    despesasSelecionadas,
    movimentosWalletElegiveis,
    movimentosWalletSelecionados,
    ajustesManuais,
    qtdAjustesSelecionados,
    compensarSaldoAnterior,
    saldoAnteriorPagador,
    valorEfetivoInput,
  ]);

  const toggleSelecao = (
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    id: string,
    valorPadrao: number
  ) => {
    setter((prev) => {
      const proximo = { ...prev };
      if (proximo[id] !== undefined) {
        delete proximo[id];
      } else {
        proximo[id] = arredondar2(Math.max(0, valorPadrao)).toFixed(2);
      }
      return proximo;
    });
  };

  const adicionarAjusteManual = () => {
    const desc = novoAjusteDesc.trim();
    const val = parseValorPositivo(novoAjusteValor);
    if (!desc || val <= 0) return;

    setAjustesManuais((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        descricao: desc,
        natureza: novoAjusteNatureza,
        valor: val.toFixed(2),
      },
    ]);
    setNovoAjusteDesc('');
    setNovoAjusteValor('');
  };

  const handleSalvar = () => {
    setErroValidacao('');
    if (!dataPagamento) {
      setErroValidacao('Informe a data do pagamento.');
      return;
    }
    if (!caminhaoSelecionado) {
      setErroValidacao('Selecione o caminhão.');
      return;
    }
    if (!pagadorSelecionado) {
      setErroValidacao('Selecione quem pagou.');
      return;
    }
    if (
      resumo.qtdViagens === 0 &&
      resumo.qtdDespesas === 0 &&
      resumo.qtdAjustes === 0
    ) {
      setErroValidacao(
        'Selecione ao menos uma viagem, despesa, desconto ou reembolso para registrar o recebimento.'
      );
      return;
    }

    const viagensPayload = viagensElegiveis
      .filter((v) => viagensSelecionadas[v.id] !== undefined)
      .map((v) => ({
        viagemId: v.id,
        dataViagem: v.data,
        descricaoRota: `${v.embarque} → ${v.desembarque}`,
        tipoGado: v.tipoGado,
        valorEsperado: arredondar2(v.valorEsperado),
        valorRecebido: parseValorPositivo(viagensSelecionadas[v.id]),
      }));

    const despesasPayload = despesasDoCaminhaoNoPeriodo
      .filter((d) => despesasSelecionadas[d.id] !== undefined)
      .map((d) => ({
        despesaId: d.id,
        tipo: d.tipo,
        data: d.data,
        descricao: d.detalheExtra
          ? `${d.descricao} (${d.detalheExtra})`
          : d.descricao,
        natureza: d.natureza,
        valorOriginal: arredondar2(d.valor),
        valorConsiderado: parseValorPositivo(despesasSelecionadas[d.id]),
      }));

    const avulsosPayload = [
      ...movimentosWalletElegiveis
        .filter((m) => movimentosWalletSelecionados[m.id] !== undefined)
        .map((m) => ({
          id: m.id,
          descricao: m.descricao,
          natureza: m.natureza,
          valorOriginal: arredondar2(m.valor),
          valor: parseValorPositivo(movimentosWalletSelecionados[m.id]),
        })),
      ...ajustesManuais.map((a) => {
        const num = parseValorPositivo(a.valor);
        return {
          id: a.id,
          descricao: a.descricao,
          natureza: a.natureza,
          valorOriginal: num,
          valor: num,
        };
      }),
    ];

    registrarRecebimento({
      dataPagamento,
      caminhaoId: caminhaoSelecionado.id,
      caminhaoNome: caminhaoSelecionado.nome,
      pagadorTipo: pagadorSelecionado.tipo,
      pagadorId: pagadorSelecionado.id,
      pagadorNome: pagadorSelecionado.nome,
      viagens: viagensPayload,
      despesas: despesasPayload,
      avulsos: avulsosPayload,
      saldoAnteriorPagador,
      compensouSaldoAnterior: compensarSaldoAnterior,
      totalViagensEsperado: resumo.totalViagensEsperado,
      totalViagens: resumo.totalViagens,
      totalRessarcimentos: resumo.totalRessarcimentos,
      totalDescontos: resumo.totalDescontos,
      valorEsperadoAcerto: resumo.valorEsperadoAcerto,
      liquidoCalculado: resumo.liquidoCalculado,
      diferencaAcerto: resumo.diferencaAcerto,
      valorEfetivamentePago: resumo.valorEfetivamentePagoNum,
      novoSaldoPagador: resumo.novoSaldoPagador,
      observacoes: observacoes.trim() || undefined,
    });

    onSalvo?.();
    onFechar();
  };

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-novo-recebimento"
      onClick={onFechar}
    >
      <div
        className="w-[95vw] h-[92vh] max-w-7xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="titulo-modal-novo-recebimento"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                Novo Recebimento
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conferência de viagens, despesas vinculadas, descontos/reembolsos abertos e saldo por caminhão na carteira
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar janela"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra Fixa de Filtros */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                1. Data do Pagamento (Corte)
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <Truck className="w-3.5 h-3.5 text-brand-500" />
                2. Caminhão
              </label>
              <select
                value={caminhaoId}
                onChange={(e) => setCaminhaoId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                <Building2 className="w-3.5 h-3.5 text-brand-500" />
                3. Quem Pagou (Pagador)
              </label>
              <select
                value={pagadorChave}
                onChange={(e) => setPagadorChave(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {pagadores.length === 0 ? (
                  <option value="">Nenhum pagador cadastrado</option>
                ) : (
                  pagadores.map((p) => (
                    <option key={`${p.tipo}:${p.id}`} value={`${p.tipo}:${p.id}`}>
                      {p.nome}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Corpo Principal */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAbaAtiva('viagens')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  abaAtiva === 'viagens'
                    ? 'bg-brand-500 text-brand-contrast shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Viagens ({resumo.qtdViagens}/{viagensElegiveis.length})
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva('despesas')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  abaAtiva === 'despesas'
                    ? 'bg-brand-500 text-brand-contrast shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <ReceiptText className="w-3.5 h-3.5" />
                Despesas Vinculadas ({resumo.qtdDespesas})
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva('ajustes')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  abaAtiva === 'ajustes'
                    ? 'bg-brand-500 text-brand-contrast shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Descontos e Reembolsos ({resumo.qtdAjustes})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {abaAtiva === 'viagens' && (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>
                      Mostrando viagens até{' '}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {formatarDataBr(dataPagamento)}
                      </strong>{' '}
                      deste caminhão e pagador. Marque apenas as pagas agora.
                    </span>
                  </div>

                  {viagensElegiveis.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      Nenhuma viagem pendente encontrada para este caminhão e pagador até {formatarDataBr(dataPagamento)}.
                    </div>
                  ) : (
                    viagensElegiveis.map((v) => {
                      const marcada = viagensSelecionadas[v.id] !== undefined;
                      const valorDigitado = marcada
                        ? parseValorPositivo(viagensSelecionadas[v.id])
                        : v.valorEsperado;
                      const diff = arredondar2(
                        valorDigitado - v.valorEsperado
                      );

                      return (
                        <div
                          key={v.id}
                          className={`rounded-xl border p-4 transition-all ${
                            marcada
                              ? 'border-brand-500/60 bg-brand-50/40 dark:bg-brand-500/10 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={marcada}
                                onChange={() =>
                                  toggleSelecao(
                                    setViagensSelecionadas,
                                    v.id,
                                    v.valorEsperado
                                  )
                                }
                                className="mt-1 w-4 h-4 rounded accent-brand-500 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {formatarDataBr(v.data)}
                                  </span>
                                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {v.tipoGado}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                                    <Gauge className="w-3 h-3 text-slate-400" />
                                    {v.km > 0 ? formatarKm(v.km) : '— km'}
                                    <span className="text-[10px] text-slate-400">
                                      ({v.baseKm})
                                    </span>
                                  </span>
                                </div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                                  {v.embarque} → {v.desembarque}
                                </div>
                              </div>
                            </label>

                            <div className="flex items-center gap-3 sm:justify-end shrink-0">
                              <div className="text-right">
                                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                                  Esperado
                                </div>
                                <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
                                  {formatarMoeda(v.valorEsperado)}
                                </div>
                              </div>

                              {marcada && (
                                <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                                  <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-brand-600 dark:text-brand-400 font-semibold">
                                      Recebido (R$)
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={viagensSelecionadas[v.id]}
                                      onKeyDown={(e) => {
                                        if (e.key === '-') e.preventDefault();
                                      }}
                                      onChange={(e) =>
                                        setViagensSelecionadas((prev) => ({
                                          ...prev,
                                          [v.id]: sanitizarValorPositivo(
                                            e.target.value
                                          ),
                                        }))
                                      }
                                      className="w-32 h-9 px-2.5 rounded-lg border border-brand-500/50 bg-white dark:bg-slate-950 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                  </div>

                                  <div className="pt-4">
                                    {Math.abs(diff) < 0.01 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        OK
                                      </span>
                                    ) : (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-semibold ${
                                          diff < 0
                                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                            : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                        }`}
                                      >
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        {diff > 0 ? '+' : ''}
                                        {formatarMoeda(diff)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {abaAtiva === 'despesas' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      A natureza (desconto ou ressarcimento) já vem do lançamento. Marque apenas os itens que entram neste recebimento.
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(
                        [
                          { id: 'todas', label: 'Todas' },
                          { id: 'abastecimento', label: 'Abastec.' },
                          { id: 'manutencao', label: 'Manut.' },
                          { id: 'pedagio', label: 'Pedágios' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFiltroTipoDespesa(f.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            filtroTipoDespesa === f.id
                              ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {despesasElegiveis.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      Nenhum item elegível de abastecimento, manutenção ou pedágio encontrado para este caminhão até {formatarDataBr(dataPagamento)}.
                    </div>
                  ) : (
                    despesasElegiveis.map((d) => {
                      const valorSelecionado = despesasSelecionadas[d.id];
                      const marcada = valorSelecionado !== undefined;

                      const IconeTipo =
                        d.tipo === 'abastecimento'
                          ? Fuel
                          : d.tipo === 'manutencao'
                            ? Wrench
                            : Milestone;

                      return (
                        <div
                          key={d.id}
                          className={`rounded-xl border p-3.5 transition-all ${
                            marcada
                              ? 'border-brand-500/60 bg-brand-50/40 dark:bg-brand-500/10'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={marcada}
                                onChange={() =>
                                  toggleSelecao(
                                    setDespesasSelecionadas,
                                    d.id,
                                    d.valor
                                  )
                                }
                                className="w-4 h-4 rounded accent-brand-500 cursor-pointer shrink-0"
                              />
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                                <IconeTipo className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                                  <span className="font-mono">
                                    {formatarDataBr(d.data)}
                                  </span>
                                  <span>•</span>
                                  <span className="capitalize">{d.tipo}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      d.natureza === 'ressarcimento'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}
                                  >
                                    {d.natureza === 'ressarcimento'
                                      ? 'Ressarcimento (+)'
                                      : 'Desconto (−)'}
                                  </span>
                                  {d.detalheExtra && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-slate-500 dark:text-slate-400">
                                        {d.detalheExtra}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {d.descricao}
                                </div>
                              </div>
                            </label>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="text-right">
                                <div className="text-[10px] uppercase text-slate-400">
                                  Valor Item
                                </div>
                                <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                                  {d.natureza === 'ressarcimento' ? '+' : '−'}
                                  {formatarMoeda(d.valor)}
                                </div>
                              </div>

                              {marcada && (
                                <div className="pl-2.5 border-l border-slate-200 dark:border-slate-700">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={valorSelecionado}
                                    onKeyDown={(e) => {
                                      if (e.key === '-') e.preventDefault();
                                    }}
                                    onChange={(e) =>
                                      setDespesasSelecionadas((prev) => ({
                                        ...prev,
                                        [d.id]: sanitizarValorPositivo(
                                          e.target.value
                                        ),
                                      }))
                                    }
                                    className="w-28 h-9 px-2.5 rounded-lg border border-brand-500/50 bg-white dark:bg-slate-950 text-sm font-mono font-bold text-slate-900 dark:text-white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {abaAtiva === 'ajustes' && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Lançar desconto ou reembolso avulso neste recebimento
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <input
                        type="text"
                        placeholder="Ex.: Reembolso de guia / Desconto combinado..."
                        value={novoAjusteDesc}
                        onChange={(e) => setNovoAjusteDesc(e.target.value)}
                        className="sm:col-span-6 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                      />
                      <select
                        value={novoAjusteNatureza}
                        onChange={(e) =>
                          setNovoAjusteNatureza(
                            e.target.value as NaturezaItem
                          )
                        }
                        className="sm:col-span-3 h-10 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
                      >
                        <option value="desconto">Desconto (−)</option>
                        <option value="ressarcimento">Reembolso (+)</option>
                      </select>
                      <div className="sm:col-span-3 flex gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Valor R$"
                          value={novoAjusteValor}
                          onKeyDown={(e) => {
                            if (e.key === '-') e.preventDefault();
                          }}
                          onChange={(e) =>
                            setNovoAjusteValor(
                              sanitizarValorPositivo(e.target.value)
                            )
                          }
                          className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
                        />
                        <button
                          type="button"
                          onClick={adicionarAjusteManual}
                          className="h-10 px-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-brand-contrast text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>

                  {ajustesManuais.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Avulsos lançados neste fechamento ({ajustesManuais.length})
                      </div>
                      {ajustesManuais.map((aj) => (
                        <div
                          key={aj.id}
                          className="flex items-center justify-between px-4 py-3 rounded-xl border border-brand-500/40 bg-brand-50/30 dark:bg-brand-500/10"
                        >
                          <div className="flex items-center gap-2.5">
                            {aj.natureza === 'ressarcimento' ? (
                              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-rose-500" />
                            )}
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {aj.descricao}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                aj.natureza === 'ressarcimento'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {aj.natureza === 'ressarcimento'
                                ? 'Reembolso (+)'
                                : 'Desconto (−)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                              {aj.natureza === 'ressarcimento' ? '+' : '−'}{' '}
                              {formatarMoeda(parseValorPositivo(aj.valor))}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setAjustesManuais((prev) =>
                                  prev.filter((item) => item.id !== aj.id)
                                )
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-brand-500" />
                        Descontos e Reembolsos Abertos na Carteira até{' '}
                        {formatarDataBr(dataPagamento)}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Somente itens não pagos deste caminhão e pagador
                      </span>
                    </div>

                    {movimentosWalletElegiveis.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        Nenhum desconto ou reembolso aberto na carteira para este caminhão e pagador até {formatarDataBr(dataPagamento)}.
                      </div>
                    ) : (
                      movimentosWalletElegiveis.map((m) => {
                        const valorSel = movimentosWalletSelecionados[m.id];
                        const marcada = valorSel !== undefined;

                        return (
                          <div
                            key={m.id}
                            className={`rounded-xl border p-3.5 transition-all ${
                              marcada
                                ? 'border-brand-500/60 bg-brand-50/40 dark:bg-brand-500/10'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={marcada}
                                  onChange={() =>
                                    toggleSelecao(
                                      setMovimentosWalletSelecionados,
                                      m.id,
                                      m.valor
                                    )
                                  }
                                  className="w-4 h-4 rounded accent-brand-500 cursor-pointer shrink-0"
                                />
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                  {m.natureza === 'ressarcimento' ? (
                                    <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <ArrowUpRight className="w-4 h-4 text-rose-500" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                                    <span className="font-mono">
                                      {formatarDataBr(m.data)}
                                    </span>
                                    <span>•</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        m.natureza === 'ressarcimento'
                                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                      }`}
                                    >
                                      {m.natureza === 'ressarcimento'
                                        ? 'Reembolso (+)'
                                        : 'Desconto (−)'}
                                    </span>
                                    {m.tipoSub && (
                                      <span className="text-[10px] font-mono text-slate-400">
                                        [{m.tipoSub}]
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {m.descricao}
                                  </div>
                                </div>
                              </label>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <div className="text-right">
                                  <div className="text-[10px] uppercase text-slate-400">
                                    Carteira
                                  </div>
                                  <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                                    {m.natureza === 'ressarcimento' ? '+' : '−'}
                                    {formatarMoeda(m.valor)}
                                  </div>
                                </div>

                                {marcada && (
                                  <div className="pl-2.5 border-l border-slate-200 dark:border-slate-700">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={valorSel}
                                      onKeyDown={(e) => {
                                        if (e.key === '-') e.preventDefault();
                                      }}
                                      onChange={(e) =>
                                        setMovimentosWalletSelecionados(
                                          (prev) => ({
                                            ...prev,
                                            [m.id]: sanitizarValorPositivo(
                                              e.target.value
                                            ),
                                          })
                                        )
                                      }
                                      className="w-28 h-9 px-2.5 rounded-lg border border-brand-500/50 bg-white dark:bg-slate-950 text-sm font-mono font-bold text-slate-900 dark:text-white"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-96 bg-slate-50/80 dark:bg-slate-900/60 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resumo e Conferência do Acerto
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Valor Esperado (itens marcados)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatarMoeda(resumo.valorEsperadoAcerto)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Valor Recebido (líquido apurado)</span>
                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                    {formatarMoeda(resumo.liquidoCalculado)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Diferença
                  </span>

                  {Math.abs(resumo.diferencaAcerto) < 0.01 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      R$ 0,00 (Bateu)
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                        resumo.diferencaAcerto < 0
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {resumo.diferencaAcerto > 0 ? '+' : ''}
                      {formatarMoeda(resumo.diferencaAcerto)}
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`rounded-xl border p-3.5 ${
                  saldoAnteriorPagador > 0
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : saldoAnteriorPagador < 0
                      ? 'border-rose-500/30 bg-rose-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Saldo na Carteira (Caminhão + Pagador)
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      saldoAnteriorPagador > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : saldoAnteriorPagador < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500'
                    }`}
                  >
                    {saldoAnteriorPagador > 0 ? '+' : ''}
                    {formatarMoeda(saldoAnteriorPagador)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {saldoAnteriorPagador > 0
                    ? 'Você tem crédito acumulado a receber deste pagador neste caminhão.'
                    : saldoAnteriorPagador < 0
                      ? 'Você possui saldo devedor anterior com este pagador neste caminhão.'
                      : 'Nenhum crédito ou dívida anterior pendente para este caminhão e pagador.'}
                </p>

                {saldoAnteriorPagador !== 0 && (
                  <label className="mt-2.5 flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compensarSaldoAnterior}
                      onChange={(e) =>
                        setCompensarSaldoAnterior(e.target.checked)
                      }
                      className="rounded accent-brand-500 cursor-pointer"
                    />
                    Compensar este saldo neste recebimento
                  </label>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Viagens ({resumo.qtdViagens})</span>
                  <span className="font-mono font-semibold">
                    {formatarMoeda(resumo.totalViagens)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Reembolsos / Ressarcimentos</span>
                  <span className="font-mono font-semibold">
                    + {formatarMoeda(resumo.totalRessarcimentos)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                  <span>Descontos</span>
                  <span className="font-mono font-semibold">
                    − {formatarMoeda(resumo.totalDescontos)}
                  </span>
                </div>

                {compensarSaldoAnterior && saldoAnteriorPagador !== 0 && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                    <span>Saldo anterior compensado</span>
                    <span className="font-mono font-semibold">
                      {saldoAnteriorPagador > 0 ? '+' : ''}
                      {formatarMoeda(saldoAnteriorPagador)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                  <span>Líquido Apurado nos Itens</span>
                  <span className="font-mono text-sm text-slate-900 dark:text-white">
                    {formatarMoeda(resumo.liquidoCalculado)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Valor Efetivamente Recebido (R$)
                  </label>
                  {valorEfetivoInput !== '0' && (
                    <button
                      type="button"
                      onClick={() => setValorEfetivoInput('0')}
                      className="text-[11px] text-brand-500 hover:underline cursor-pointer"
                    >
                      Zerar
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={valorEfetivoInput}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'Subtract') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) =>
                    setValorEfetivoInput(sanitizarValorPositivo(e.target.value))
                  }
                  onBlur={() =>
                    setValorEfetivoInput(
                      String(parseValorPositivo(valorEfetivoInput))
                    )
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />

                <div className="flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-slate-500 dark:text-slate-400">
                    Novo saldo deste caminhão e pagador na carteira:{' '}
                    <strong
                      className={`font-mono ${
                        resumo.novoSaldoPagador > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : resumo.novoSaldoPagador < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {resumo.novoSaldoPagador > 0 ? '+' : ''}
                      {formatarMoeda(resumo.novoSaldoPagador)}
                    </strong>
                    {resumo.novoSaldoPagador > 0 && ' (crédito a receber)'}
                    {resumo.novoSaldoPagador < 0 && ' (dívida para abater)'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Observações (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex.: PIX recebido no Banco do Brasil..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
              </div>
            </div>

            {erroValidacao && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {erroValidacao}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            As viagens e ajustes não marcados permanecem abertos para o próximo recebimento.
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onFechar}
              className="h-10 px-4 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSalvar}
              className="h-10 px-5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs transition-colors cursor-pointer"
            >
              Confirmar Recebimento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}