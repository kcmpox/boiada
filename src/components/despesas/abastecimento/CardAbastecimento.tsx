import {
  Fuel,
  Gauge,
  FileText,
  Route,
  User,
  Pencil,
  Archive,
  RotateCcw,
  Split,
  Code2,
} from 'lucide-react';
import {
  type Abastecimento,
  type ItemAbastecimento,
  type ResponsavelPagamentoAbastecimento,
} from '../../../storage/abastecimentosStorage';
import * as devModeModule from '../../../context/DevModeContext';

export interface GrupoCardAbastecimento {
  chave: string;
  abastecimento: Abastecimento;
  responsavelEfetivo: ResponsavelPagamentoAbastecimento;
  itens: ItemAbastecimento[];
  subtotalBruto: number;
  subtotalDesconto: number;
  subtotalLiquido: number;
  totalGruposNoAbastecimento: number;
}

interface CardAbastecimentoProps {
  grupo: GrupoCardAbastecimento;
  nomeCaminhao: string;
  nomeMotorista?: string;
  rotuloViagem?: string;
  onEditar: (abastecimento: Abastecimento) => void;
  onEditarJson?: (abastecimento: Abastecimento) => void;
  onArquivar?: (abastecimento: Abastecimento) => void;
  onRestaurar?: (abastecimento: Abastecimento) => void;
}

const CONFIG_RESPONSAVEL: Record<
  ResponsavelPagamentoAbastecimento,
  {
    label: string;
    badgeClass: string;
    borderAccent: string;
  }
> = {
  minha_despesa: {
    label: 'Minha despesa',
    badgeClass:
      'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/25',
    borderAccent: 'border-l-4 border-l-brand-500',
  },
  frigorifico_desconta: {
    label: 'Frigorífico desconta',
    badgeClass:
      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
    borderAccent: 'border-l-4 border-l-amber-500',
  },
  frigorifico_ressarce: {
    label: 'Frigorífico ressarce',
    badgeClass:
      'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25',
    borderAccent: 'border-l-4 border-l-sky-500',
  },
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function agruparAbastecimentosPorResponsavel(
  lista: Abastecimento[]
): GrupoCardAbastecimento[] {
  const resultado: GrupoCardAbastecimento[] = [];

  for (const ab of lista) {
    const itens = ab.itens || [];

    if (itens.length === 0) {
      resultado.push({
        chave: `${ab.id}-${ab.responsavelPagamento}`,
        abastecimento: ab,
        responsavelEfetivo: ab.responsavelPagamento,
        itens: [],
        subtotalBruto: ab.valorTotal || 0,
        subtotalDesconto: 0,
        subtotalLiquido: ab.valorTotal || 0,
        totalGruposNoAbastecimento: 1,
      });
      continue;
    }

    const mapa = new Map<ResponsavelPagamentoAbastecimento, ItemAbastecimento[]>();

    for (const item of itens) {
      const respEfetivo: ResponsavelPagamentoAbastecimento =
        !item.responsavelPagamento || item.responsavelPagamento === 'padrao'
          ? ab.responsavelPagamento
          : item.responsavelPagamento;

      const arr = mapa.get(respEfetivo) || [];
      arr.push(item);
      mapa.set(respEfetivo, arr);
    }

    const totalGrupos = mapa.size;

    for (const [responsavelEfetivo, itensGrupo] of mapa.entries()) {
      let subtotalBruto = 0;
      let subtotalDesconto = 0;
      let subtotalLiquido = 0;

      for (const it of itensGrupo) {
        const brutoItem = it.quantidade * it.valorUnitario;
        subtotalBruto += brutoItem;
        subtotalDesconto += it.desconto || 0;
        subtotalLiquido += it.valorTotal;
      }

      resultado.push({
        chave: `${ab.id}-${responsavelEfetivo}`,
        abastecimento: ab,
        responsavelEfetivo,
        itens: itensGrupo,
        subtotalBruto,
        subtotalDesconto,
        subtotalLiquido,
        totalGruposNoAbastecimento: totalGrupos,
      });
    }
  }

  return resultado;
}

export function CardAbastecimento({
  grupo,
  nomeCaminhao,
  nomeMotorista,
  rotuloViagem,
  onEditar,
  onEditarJson,
  onArquivar,
  onRestaurar,
}: CardAbastecimentoProps) {
  const { abastecimento: ab, responsavelEfetivo, itens } = grupo;
  const cfg = CONFIG_RESPONSAVEL[responsavelEfetivo];

  const mod = devModeModule as Record<string, unknown>;
  const useDevModeHook = mod.useDevMode as
    | (() => { devMode?: boolean; isDevMode?: boolean; enabled?: boolean })
    | undefined;
  const ctxVal =
    typeof useDevModeHook === 'function' ? useDevModeHook() : undefined;
  const isDevMode = Boolean(
    ctxVal?.devMode ?? ctxVal?.isDevMode ?? ctxVal?.enabled
  );

  const dataFormatada = new Date(ab.dataHora).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <article
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-slate-700 ${cfg.borderAccent}`}
    >
      {/* Topo do Card */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              <Fuel className="w-4 h-4 text-brand-500 shrink-0" />
              {nomeCaminhao}
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badgeClass}`}
            >
              {cfg.label}
            </span>

            {grupo.totalGruposNoAbastecimento > 1 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Este abastecimento possui itens divididos entre diferentes responsáveis pelo pagamento"
              >
                <Split className="w-3 h-3" />
                Desmembrado ({grupo.totalGruposNoAbastecimento} partes)
              </span>
            )}
          </div>

          {/* Metadados */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {dataFormatada}
            </span>

            {nomeMotorista && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {nomeMotorista}
              </span>
            )}

            <span className="inline-flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              {ab.hodometro.toLocaleString('pt-BR')} km
              {ab.hodometroEstimado ? ' (anterior)' : ''}
            </span>

            {ab.notaFiscal && (
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                NF: {ab.notaFiscal}
              </span>
            )}

            {(rotuloViagem || ab.minutaNumero || ab.viagemId) && (
              <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                <Route className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <span className="truncate max-w-md">
                  {rotuloViagem ||
                    (ab.minutaNumero
                      ? `Minuta ${ab.minutaNumero}`
                      : 'Viagem vinculada')}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Valor Total do Card + Ações */}
        <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80">
          <div className="text-left lg:text-right">
            <span className="block text-[11px] uppercase tracking-wider text-slate-400">
              Total nesta responsabilidade
            </span>
            <strong className="text-lg font-bold text-slate-900 dark:text-white">
              {formatarMoeda(grupo.subtotalLiquido)}
            </strong>
            {grupo.subtotalDesconto > 0 && (
              <span className="block text-[11px] text-emerald-600 dark:text-emerald-400">
                Desconto: -{formatarMoeda(grupo.subtotalDesconto)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isDevMode && onEditarJson && (
              <button
                type="button"
                onClick={() => onEditarJson(ab)}
                title="Editar JSON (DevMode)"
                className="p-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors cursor-pointer"
              >
                <Code2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onEditar(ab)}
              title="Editar abastecimento completo"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500/40 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {ab.arquivado ? (
              onRestaurar && (
                <button
                  type="button"
                  onClick={() => onRestaurar(ab)}
                  title="Restaurar abastecimento"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )
            ) : (
              onArquivar && (
                <button
                  type="button"
                  onClick={() => onArquivar(ab)}
                  title="Arquivar abastecimento"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Lista de Itens do Card */}
      {itens.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 px-4 sm:px-5 py-3">
          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {itens.map((item) => {
              const sobrescritoNoItem =
                item.responsavelPagamento !== 'padrao' &&
                item.responsavelPagamento !== ab.responsavelPagamento;

              return (
                <div
                  key={item.id}
                  className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.descricao}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {item.quantidade.toLocaleString('pt-BR', {
                        maximumFractionDigits: 2,
                      })}{' '}
                      L × {formatarMoeda(item.valorUnitario)}
                    </span>
                    {sobrescritoNoItem && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Item específico
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    {item.desconto > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        -{formatarMoeda(item.desconto)}
                      </span>
                    )}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatarMoeda(item.valorTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}