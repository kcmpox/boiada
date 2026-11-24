import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Truck,
  Calendar,
  MapPin,
  User,
  Check,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  listarViagens,
  salvarViagens,
  type Viagem,
} from '../../storage/viagensStorage';
import {
  listarCaminhoes,
  listarMotoristas,
} from '../../storage/cadastrosStorage';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarDataHoraBr(isoDateTime: string | null): string {
  if (!isoDateTime) return '—';
  const [dataParte, horaParte] = isoDateTime.split('T');
  if (!dataParte) return isoDateTime;
  const [ano, mes, dia] = dataParte.split('-');
  return `${dia}/${mes}/${ano}${horaParte ? ` às ${horaParte}` : ''}`;
}

function formatarDataBr(isoDate: string): string {
  if (!isoDate) return '—';
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

interface CardAnimaisPerdidosItemProps {
  viagem: Viagem;
  caminhaoLabel: string;
  motoristaNome: string;
  onConfirmar: (
    id: string,
    houvePerda: boolean,
    quantidade: number,
    valorUnitario: number
  ) => void;
}

function CardAnimaisPerdidosItem({
  viagem,
  caminhaoLabel,
  motoristaNome,
  onConfirmar,
}: CardAnimaisPerdidosItemProps) {
  const [houvePerda, setHouvePerda] = useState<boolean>(false);
  const [quantidade, setQuantidade] = useState<string>('1');
  const [valorUnitario, setValorUnitario] = useState<string>('');

  const qtdNum = Number(quantidade);
  const valNum = Number(valorUnitario.trim().replace(',', '.'));
  const totalPrejuizo =
    houvePerda && !isNaN(qtdNum) && qtdNum > 0 && !isNaN(valNum) && valNum >= 0
      ? Number((qtdNum * valNum).toFixed(2))
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!houvePerda) {
      onConfirmar(viagem.id, false, 0, 0);
      return;
    }

    if (isNaN(qtdNum) || qtdNum <= 0 || isNaN(valNum) || valNum < 0) {
      return;
    }

    onConfirmar(
      viagem.id,
      true,
      Math.floor(qtdNum),
      Number(valNum.toFixed(2))
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4"
    >
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                viagem.tipoGado === 'boi_gordo'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                  : 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300'
              }`}
            >
              {viagem.tipoGado === 'boi_gordo' ? 'Boi Gordo' : 'Boi Magro'}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatarDataBr(viagem.data)}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Truck className="w-3.5 h-3.5 text-brand-500" />
              {caminhaoLabel}
            </span>

            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <User className="w-3.5 h-3.5" />
              {motoristaNome}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white pt-0.5">
            <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
            <span>{viagem.localEmbarque}</span>
            {viagem.localDesembarque && (
              <>
                <span className="text-slate-400">→</span>
                <span>{viagem.localDesembarque}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-500" />
              Saída: {formatarDataHoraBr(viagem.dataHoraSaida)}
            </span>
            <span>•</span>
            <span>Chegada: {formatarDataHoraBr(viagem.dataHoraChegada)}</span>
          </div>
        </div>
      </div>

      {/* Pergunta: Houve perda de animais? */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Houve perda de algum animal nesta viagem?
          </span>

          <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setHouvePerda(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                !houvePerda
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Não houve perda
            </button>
            <button
              type="button"
              onClick={() => setHouvePerda(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                houvePerda
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Sim, houve perda
            </button>
          </div>
        </div>

        {houvePerda && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end p-4 rounded-xl bg-red-50/60 dark:bg-red-500/5 border border-red-200/80 dark:border-red-500/20">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Qtd. Animais Perdidos *
              </label>
              <input
                type="number"
                min={1}
                step={1}
                required
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor de Cada Animal (R$) *
              </label>
              <input
                type="number"
                step="any"
                min={0}
                required
                placeholder="Ex: 3800.00"
                value={valorUnitario}
                onChange={(e) => setValorUnitario(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="sm:col-span-5">
              <div className="h-10 px-3.5 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Total da Perda:
                </span>
                <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">
                  {formatarMoeda(totalPrejuizo)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Concluir Conferência
          </button>
        </div>
      </div>
    </form>
  );
}

export function SecaoAnimaisPerdidos({
  onAtualizarContadores,
}: {
  onAtualizarContadores?: () => void;
}) {
  const [viagens, setViagens] = useState<Viagem[]>(() => listarViagens());
  const caminhoes = useMemo(() => listarCaminhoes(), []);
  const motoristas = useMemo(() => listarMotoristas(), []);

  // Aparecem aqui viagens que já registraram Saída & Chegada e ainda estão pendentes de conferência
  const pendentesConferencia = useMemo(
    () =>
      viagens.filter(
        (v) =>
          v.statusSaidaChegada === 'registrado' &&
          v.statusAnimaisPerdidos === 'pendente'
      ),
    [viagens]
  );

  const handleConfirmar = (
    id: string,
    houvePerda: boolean,
    quantidade: number,
    valorUnitario: number
  ) => {
    const total = houvePerda
      ? Number((quantidade * valorUnitario).toFixed(2))
      : 0;

    const atualizada = viagens.map((v) =>
      v.id === id
        ? {
            ...v,
            statusAnimaisPerdidos: 'concluido' as const,
            houvePerdaAnimais: houvePerda,
            quantidadeAnimaisPerdidos: quantidade,
            valorUnitarioAnimalPerdido: valorUnitario,
            valorTotalAnimaisPerdidos: total,
          }
        : v
    );

    setViagens(atualizada);
    salvarViagens(atualizada);
    onAtualizarContadores?.();
  };

  const obterCaminhaoLabel = (id: string) => {
    const c = caminhoes.find((item) => item.id === id);
    return c ? `${c.nome} (${c.placa})` : 'Caminhão removido';
  };

  const obterMotoristaNome = (id: string) =>
    motoristas.find((m) => m.id === id)?.nome || 'Sem motorista';

  if (pendentesConferencia.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nenhuma viagem pendente de conferência de animais
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Após registrar o dia e a hora de saída e chegada na guia{' '}
          <strong>Saída &amp; Chegada</strong>, a viagem aparecerá aqui para
          informar se houve perda de animais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {pendentesConferencia.length}{' '}
        {pendentesConferencia.length === 1
          ? 'viagem aguardando conferência de animais'
          : 'viagens aguardando conferência de animais'}
      </div>

      {pendentesConferencia.map((v) => (
        <CardAnimaisPerdidosItem
          key={v.id}
          viagem={v}
          caminhaoLabel={obterCaminhaoLabel(v.caminhaoId)}
          motoristaNome={obterMotoristaNome(v.motoristaId)}
          onConfirmar={handleConfirmar}
        />
      ))}
    </div>
  );
}