import {
  Calendar,
  Truck,
  User,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  Code2,
  Milestone,
  Radio,
  MapPin,
  Route,
  Lock,
} from 'lucide-react';
import {
  type DespesaPedagio,
  type ResponsavelPagamentoPedagio,
} from '../../../storage/despesasPedagiosStorage';
import { despesaJaFoiPaga } from '../../../storage/recebimentosStorage';
import { useDevMode } from '../../../context/DevModeContext';

interface CardDespesaPedagioProps {
  passagem: DespesaPedagio;
  nomeCaminhao?: string;
  nomeMotorista?: string;
  rotuloViagem?: string;
  onEditar: (p: DespesaPedagio) => void;
  onEditarJson?: (p: DespesaPedagio) => void;
  onArquivar?: (p: DespesaPedagio) => void;
  onRestaurar?: (p: DespesaPedagio) => void;
  onExcluir: (p: DespesaPedagio) => void;
}

const INFO_RESPONSAVEL: Record<
  ResponsavelPagamentoPedagio,
  { label: string; classe: string }
> = {
  minha_despesa: {
    label: 'Minha despesa',
    classe:
      'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
  },
  frigorifico_desconta: {
    label: 'Frigorífico desconta',
    classe:
      'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  },
  frigorifico_ressarce: {
    label: 'Frigorífico ressarce',
    classe:
      'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  },
};

function formatarDataHoraBr(iso: string): string {
  if (!iso) return '—';
  const [dataParte, horaParte] = iso.split('T');
  const [ano, mes, dia] = (dataParte || '').split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}${horaParte ? ` às ${horaParte.slice(0, 5)}` : ''}`;
}

export function CardDespesaPedagio({
  passagem,
  nomeCaminhao,
  nomeMotorista,
  rotuloViagem,
  onEditar,
  onEditarJson,
  onArquivar,
  onRestaurar,
  onExcluir,
}: CardDespesaPedagioProps) {
  const { devMode } = useDevMode();
  const bloqueadoPorPagamento = despesaJaFoiPaga(passagem.id);
  const respInfo =
    INFO_RESPONSAVEL[passagem.responsavelPagamento] ||
    INFO_RESPONSAVEL.minha_despesa;

  return (
    <article
      className={`rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 sm:p-5 shadow-2xs space-y-3 ${
        passagem.arquivado ? 'opacity-90' : ''
      }`}
    >
      {/* Linha Superior */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                passagem.semParar
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Radio className="w-3 h-3" />
              {passagem.semParar ? 'Sem Parar' : 'Avulso / Manual'}
            </span>

            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${respInfo.classe}`}
            >
              {respInfo.label}
            </span>

            {bloqueadoPorPagamento && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
                title="Este pedágio já foi incluído num recebimento e não pode ser alterado"
              >
                <Lock className="w-3 h-3" />
                Pago
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatarDataHoraBr(passagem.dataHora)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
            {nomeCaminhao && (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                <Truck className="w-3.5 h-3.5 text-brand-500" />
                {nomeCaminhao}
              </span>
            )}

            {nomeMotorista && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {nomeMotorista}
              </span>
            )}

            {(rotuloViagem || passagem.viagemId) && (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <Route className="w-3.5 h-3.5" />
                {rotuloViagem || `Viagem #${passagem.viagemId}`}
              </span>
            )}

            {!nomeCaminhao && !nomeMotorista && !passagem.viagemId && (
              <span className="text-slate-400 italic">
                Sem caminhão ou motorista vinculado
              </span>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        {!bloqueadoPorPagamento && (
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {devMode && onEditarJson && (
              <button
                type="button"
                onClick={() => onEditarJson(passagem)}
                title="Editar JSON (DevMode)"
                className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
              >
                <Code2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onEditar(passagem)}
              title="Editar passagem"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {passagem.arquivado && onRestaurar ? (
              <button
                type="button"
                onClick={() => onRestaurar(passagem)}
                title="Restaurar passagem"
                className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              onArquivar && (
                <button
                  type="button"
                  onClick={() => onArquivar(passagem)}
                  title="Arquivar passagem"
                  className="p-2 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => onExcluir(passagem)}
              title="Excluir passagem"
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Corpo: Praça + Detalhes + Valor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Milestone className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="truncate">{passagem.nomePedagio}</span>
          </div>

          {(passagem.rodovia || passagem.cidade) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pl-6">
              {passagem.rodovia && (
                <span className="font-mono">
                  {passagem.rodovia}
                  {passagem.km !== undefined ? ` • Km ${passagem.km}` : ''}
                </span>
              )}
              {passagem.cidade && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {passagem.cidade}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 sm:text-right">
          <div className="text-[11px] font-semibold uppercase text-slate-400">
            Valor
          </div>
          <div className="text-base font-mono font-extrabold text-brand-600 dark:text-brand-400">
            {passagem.valor.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
        </div>
      </div>
    </article>
  );
}