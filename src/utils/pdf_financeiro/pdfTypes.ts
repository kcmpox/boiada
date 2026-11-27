import type { RegistroRecebimento } from '../../storage/recebimentosStorage';

export type TipoRelatorioFinanceiro =
  | 'todos_recebimentos'
  | 'previsao_futura'
  | 'descontos_reembolsos'
  | 'recebimento_especifico';

export type ColunaRecebimentosId =
  | 'dataPagamento'
  | 'pagador'
  | 'caminhao'
  | 'itens'
  | 'valorEsperado'
  | 'liquidoApurado'
  | 'valorRecebido'
  | 'diferenca'
  | 'saldoPagador';

export interface ConfigColunaRecebimento {
  id: ColunaRecebimentosId;
  label: string;
}

export const COLUNAS_TODOS_RECEBIMENTOS: ConfigColunaRecebimento[] = [
  { id: 'dataPagamento', label: 'Data Pgto' },
  { id: 'pagador', label: 'Pagador' },
  { id: 'caminhao', label: 'Caminhão' },
  { id: 'itens', label: 'Itens' },
  { id: 'valorEsperado', label: 'Esperado' },
  { id: 'liquidoApurado', label: 'Líquido Apurado' },
  { id: 'valorRecebido', label: 'Valor Recebido' },
  { id: 'diferenca', label: 'Diferença' },
  { id: 'saldoPagador', label: 'Saldo Pagador' },
];

export interface ItemPrevisaoViagem {
  id: string;
  data: string;
  rota: string;
  caminhao: string;
  pagador: string;
  tipoGado: string;
  valorBruto: number;
  valorAluguel: number;
  valorLiquido: number;
}

export interface ItemPrevisaoDespesa {
  id: string;
  data: string;
  categoria: string;
  descricao: string;
  caminhao: string;
  responsavel: string;
  valor: number;
}

export interface ItemPrevisaoCarteira {
  id: string;
  data: string;
  natureza: 'desconto' | 'ressarcimento';
  descricao: string;
  pagador: string;
  caminhao: string;
  valor: number;
}

export interface DadosPdfTodosRecebimentos {
  tipo: 'todos_recebimentos';
  subtituloFiltros: string;
  colunasVisiveis: ColunaRecebimentosId[];
  recebimentos: RegistroRecebimento[];
}

export interface DadosPdfPrevisaoFutura {
  tipo: 'previsao_futura';
  dataRecebimentoAlvo: string;
  periodoOrigemInicio: string;
  periodoOrigemFim: string;
  regraDescricao: string;
  pagadorFiltroLabel: string;
  viagens: ItemPrevisaoViagem[];
  abastecimentos: ItemPrevisaoDespesa[];
  manutencoes: ItemPrevisaoDespesa[];
  pedagios: ItemPrevisaoDespesa[];
  movimentosCarteira: ItemPrevisaoCarteira[];
}

export interface DadosPdfDescontosReembolsos {
  tipo: 'descontos_reembolsos';
  subtituloFiltros: string;
  itens: ItemPrevisaoCarteira[];
}

export interface DadosPdfRecebimentoEspecifico {
  tipo: 'recebimento_especifico';
  recebimento: RegistroRecebimento;
}

export type PayloadGeracaoPdfFinanceiro =
  | DadosPdfTodosRecebimentos
  | DadosPdfPrevisaoFutura
  | DadosPdfDescontosReembolsos
  | DadosPdfRecebimentoEspecifico;

export type CorRgb = [number, number, number];

export const COR_PRIMARIA: CorRgb = [15, 23, 42]; // slate-900
export const COR_DESTAQUE_PADRAO: CorRgb = [37, 99, 235]; // azul padrão
export const COR_BORDA: CorRgb = [226, 232, 240]; // slate-200
export const COR_FUNDO_SUAVE: CorRgb = [248, 250, 252]; // slate-50
export const COR_TEXTO: CorRgb = [30, 41, 59]; // slate-800
export const COR_TEXTO_SUAVE: CorRgb = [100, 116, 139]; // slate-500

function parseCorParaRgb(entrada?: string | null): CorRgb | null {
  if (!entrada) return null;
  const valor = entrada.trim();

  const hexMatch = valor.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((ch) => ch + ch)
        .join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  const rgbMatch = valor.match(
    /^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})/i
  );
  if (rgbMatch) {
    const clamp = (n: number) => Math.min(255, Math.max(0, n));
    return [
      clamp(Number(rgbMatch[1])),
      clamp(Number(rgbMatch[2])),
      clamp(Number(rgbMatch[3])),
    ];
  }

  return null;
}

export function obterCorDestaqueConfigurada(): CorRgb {
  const chavesPossiveis = [
    'bt_aparencia',
    'bt_config_aparencia',
    'bt_configuracoes',
    'bt_config',
    'bt_settings',
    'bt_theme_config',
  ];

  for (const chave of chavesPossiveis) {
    try {
      const bruto = localStorage.getItem(chave);
      if (!bruto) continue;
      if (bruto.startsWith('#') || bruto.startsWith('rgb')) {
        const direto = parseCorParaRgb(bruto);
        if (direto) return direto;
      }

      const obj = JSON.parse(bruto);
      if (obj && typeof obj === 'object') {
        const candidatos = [
          obj.corDestaque,
          obj.corPrimaria,
          obj.corPrincipal,
          obj.accentColor,
          obj.primaryColor,
          obj.corTema,
          obj.cor,
          obj.aparencia?.corDestaque,
          obj.aparencia?.corPrimaria,
          obj.aparencia?.cor,
        ];
        for (const cand of candidatos) {
          if (typeof cand === 'string') {
            const rgb = parseCorParaRgb(cand);
            if (rgb) return rgb;
          }
        }
      }
    } catch {
      // Ignora entradas não-JSON ou malformadas
    }
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const estilos = getComputedStyle(document.documentElement);
    const variaveisCss = [
      '--color-brand-500',
      '--brand-500',
      '--color-primary',
      '--primary-color',
      '--cor-destaque',
    ];
    for (const nomeVar of variaveisCss) {
      const val = estilos.getPropertyValue(nomeVar);
      const rgb = parseCorParaRgb(val);
      if (rgb) return rgb;
    }
  }

  return COR_DESTAQUE_PADRAO;
}

export function formatarMoedaPdf(valor: number): string {
  const limpo = Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
  return limpo.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatarMoedaComSinalPdf(valor: number): string {
  const limpo = Number.isFinite(valor) ? Number(valor.toFixed(2)) : 0;
  const sinal = limpo > 0 ? '+' : limpo < 0 ? '-' : '';
  return `${sinal}${formatarMoedaPdf(Math.abs(limpo))}`;
}

export function formatarDataBrPdf(iso?: string | null): string {
  if (!iso) return '—';
  const limpo = iso.slice(0, 10);
  const [ano, mes, dia] = limpo.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}