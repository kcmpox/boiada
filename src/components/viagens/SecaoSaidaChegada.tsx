import { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Truck,
  Calendar,
  MapPin,
  User,
  Check,
  Ban,
  Clock,
  AlertCircle,
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

function formatarDataBr(isoDate: string): string {
  if (!isoDate) return '—';
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

function calcularDuracaoTexto(saida: string, chegada: string): string | null {
  if (!saida || !chegada) return null;
  const inicio = new Date(saida).getTime();
  const fim = new Date(chegada).getTime();
  if (isNaN(inicio) || isNaN(fim) || fim <= inicio) return null;

  const diffMin = Math.floor((fim - inicio) / 60000);
  const dias = Math.floor(diffMin / (60 * 24));
  const horas = Math.floor((diffMin % (60 * 24)) / 60);
  const mins = diffMin % 60;

  const partes: string[] = [];
  if (dias > 0) partes.push(`${dias}d`);
  if (horas > 0) partes.push(`${horas}h`);
  if (mins > 0 || partes.length === 0) partes.push(`${mins}min`);
  return partes.join(' ');
}

interface CardSaidaChegadaItemProps {
  viagem: Viagem;
  caminhaoLabel: string;
  motoristaNome: string;
  onRegistrar: (id: string, dataHoraSaida: string, dataHoraChegada: string) => void;
  onIgnorar: (id: string) => void;
}

function CardSaidaChegadaItem({
  viagem,
  caminhaoLabel,
  motoristaNome,
  onRegistrar,
  onIgnorar,
}: CardSaidaChegadaItemProps) {
  const [saida, setSaida] = useState<string>(
    viagem.data ? `${viagem.data}T06:00` : ''
  );
  const [chegada, setChegada] = useState<string>(
    viagem.data ? `${viagem.data}T14:00` : ''
  );
  const [erro, setErro] = useState<string>('');

  const duracao = calcularDuracaoTexto(saida, chegada);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!saida || !chegada) {
      setErro('Informe o dia e a hora de saída e de chegada.');
      return;
    }

    if (new Date(chegada).getTime() < new Date(saida).getTime()) {
      setErro('A data/hora de chegada não pode ser anterior à saída.');
      return;
    }

    onRegistrar(viagem.id, saida, chegada);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4"
    >
      {/* Cabeçalho do Card */}
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
        </div>

        <button
          type="button"
          onClick={() => onIgnorar(viagem.id)}
          title="Ignorar registro de saída e chegada desta viagem"
          className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Ban className="w-3.5 h-3.5" />
          Ignorar
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Inputs de Dia e Hora de Saída e Chegada */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Dia e Hora de Saída *
          </label>
          <input
            type="datetime-local"
            required
            value={saida}
            onChange={(e) => setSaida(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Dia e Hora de Chegada (Término) *
          </label>
          <input
            type="datetime-local"
            required
            value={chegada}
            onChange={(e) => setChegada(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-2.5">
          {duracao && (
            <div className="h-10 px-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              {duracao}
            </div>
          )}

          <button
            type="submit"
            className="flex-1 h-10 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Salvar Horários
          </button>
        </div>
      </div>
    </form>
  );
}

export function SecaoSaidaChegada({
  onAtualizarContadores,
}: {
  onAtualizarContadores?: () => void;
}) {
  const [viagens, setViagens] = useState<Viagem[]>(() => listarViagens());
  const caminhoes = useMemo(() => listarCaminhoes(), []);
  const motoristas = useMemo(() => listarMotoristas(), []);

  const pendentes = useMemo(
    () => viagens.filter((v) => v.statusSaidaChegada === 'pendente'),
    [viagens]
  );

  const handleRegistrar = (
    id: string,
    dataHoraSaida: string,
    dataHoraChegada: string
  ) => {
    const atualizada = viagens.map((v) =>
      v.id === id
        ? {
            ...v,
            statusSaidaChegada: 'registrado' as const,
            dataHoraSaida,
            dataHoraChegada,
          }
        : v
    );
    setViagens(atualizada);
    salvarViagens(atualizada);
    onAtualizarContadores?.();
  };

  const handleIgnorar = (id: string) => {
    const atualizada = viagens.map((v) =>
      v.id === id
        ? {
            ...v,
            statusSaidaChegada: 'ignorado' as const,
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

  if (pendentes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nenhuma viagem pendente de Saída &amp; Chegada
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Sempre que você cadastrar uma <strong>Nova Viagem</strong>, ela aparecerá aqui para informar os horários ou ser ignorada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {pendentes.length}{' '}
        {pendentes.length === 1
          ? 'viagem aguardando registro de saída e chegada'
          : 'viagens aguardando registro de saída e chegada'}
      </div>

      {pendentes.map((v) => (
        <CardSaidaChegadaItem
          key={v.id}
          viagem={v}
          caminhaoLabel={obterCaminhaoLabel(v.caminhaoId)}
          motoristaNome={obterMotoristaNome(v.motoristaId)}
          onRegistrar={handleRegistrar}
          onIgnorar={handleIgnorar}
        />
      ))}
    </div>
  );
}