import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Milestone,
  Check,
  AlertCircle,
  MapPin,
  ExternalLink,
  ListFilter,
  Type,
  Radio,
  Route,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  type DespesaPedagio,
  type ResponsavelPagamentoPedagio,
  RESPONSAVEIS_PAGAMENTO_PEDAGIO,
  salvarDespesaPedagio,
} from '../../../storage/despesasPedagiosStorage';
import {
  listarCaminhoes,
  listarMotoristas,
  listarPedagios,
} from '../../../storage/cadastrosStorage';
import * as viagensStorage from '../../../storage/viagensStorage';

interface ModalNovoPedagioProps {
  aberto: boolean;
  passagemEdicao?: DespesaPedagio | null;
  caminhaoInicialId?: string;
  viagemInicialId?: string;
  onFechar: () => void;
  onSalvo: () => void;
}

interface ViagemOption {
  id: string;
  data: string;
  caminhaoId: string;
  localEmbarque: string;
  localDesembarque?: string;
  pecuarista?: string;
  minuta?: string;
  dataHoraSaida?: string;
  dataHoraChegada?: string;
  arquivada?: boolean;
}

function obterDataHoraAtualLocal(): string {
  const agora = new Date();
  const offsetMs = agora.getTimezoneOffset() * 60_000;
  return new Date(agora.getTime() - offsetMs).toISOString().slice(0, 16);
}

function montarUrlMapaOsm(lat: number, lng: number): string {
  const delta = 0.012;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function parseTimestamp(iso?: string): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function formatarDataBr(isoDate: string): string {
  const [ano, mes, dia] = (isoDate || '').split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHoraBr(iso?: string): string {
  if (!iso) return '—';
  const [dataParte, horaParte] = iso.split('T');
  const [ano, mes, dia] = (dataParte || '').split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}${horaParte ? ` às ${horaParte.slice(0, 5)}` : ''}`;
}

function extrairTodasViagens(): ViagemOption[] {
  const mapa = new Map<string, ViagemOption>();
  const storageObj = viagensStorage as Record<string, unknown>;

  const normalizar = (
    raw: unknown,
    forcarArquivada = false
  ): ViagemOption | null => {
    if (!raw || typeof raw !== 'object') return null;
    const v = raw as Record<string, unknown>;
    if (!v.id || !v.data) return null;

    const saida =
      (typeof v.dataHoraSaida === 'string' && v.dataHoraSaida) ||
      (typeof v.saidaDataHora === 'string' && v.saidaDataHora) ||
      (v.dataSaida && v.horaSaida ? `${v.dataSaida}T${v.horaSaida}` : undefined);

    const chegada =
      (typeof v.dataHoraChegada === 'string' && v.dataHoraChegada) ||
      (typeof v.chegadaDataHora === 'string' && v.chegadaDataHora) ||
      (v.dataChegada && v.horaChegada
        ? `${v.dataChegada}T${v.horaChegada}`
        : undefined);

    return {
      id: String(v.id),
      data: String(v.data),
      caminhaoId: v.caminhaoId ? String(v.caminhaoId) : '',
      localEmbarque: String(
        v.localEmbarque || v.embarque || 'Embarque não informado'
      ),
      localDesembarque: v.localDesembarque
        ? String(v.localDesembarque)
        : undefined,
      pecuarista: v.pecuarista ? String(v.pecuarista) : undefined,
      minuta: v.minuta ? String(v.minuta) : undefined,
      dataHoraSaida: saida,
      dataHoraChegada: chegada,
      arquivada: forcarArquivada || Boolean(v.arquivada),
    };
  };

  if (typeof storageObj.listarViagens === 'function') {
    const ativas = storageObj.listarViagens() as unknown[];
    if (Array.isArray(ativas)) {
      for (const item of ativas) {
        const norm = normalizar(item, false);
        if (norm) mapa.set(norm.id, norm);
      }
    }
  }

  if (typeof storageObj.listarViagensArquivadas === 'function') {
    const arqs = storageObj.listarViagensArquivadas() as unknown[];
    if (Array.isArray(arqs)) {
      for (const item of arqs) {
        const norm = normalizar(item, true);
        if (norm && !mapa.has(norm.id)) mapa.set(norm.id, norm);
      }
    }
  }

  if (mapa.size === 0) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.includes('viagens')) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(k) || '');
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const norm = normalizar(item, k.includes('arquiv'));
            if (norm && !mapa.has(norm.id)) mapa.set(norm.id, norm);
          }
        }
      } catch {
        // Ignora
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) => b.data.localeCompare(a.data));
}

export function ModalNovoPedagio({
  aberto,
  passagemEdicao,
  caminhaoInicialId,
  viagemInicialId,
  onFechar,
  onSalvo,
}: ModalNovoPedagioProps) {
  const caminhoes = useMemo(() => listarCaminhoes(), [aberto]);
  const motoristas = useMemo(() => listarMotoristas(), [aberto]);
  const pedagiosCadastrados = useMemo(() => listarPedagios(), [aberto]);
  const todasViagens = useMemo(() => extrairTodasViagens(), [aberto]);

  const [dataHora, setDataHora] = useState('');
  const [caminhaoId, setCaminhaoId] = useState('');
  const [motoristaId, setMotoristaId] = useState('');
  const [modoPedagio, setModoPedagio] = useState<'cadastrado' | 'livre'>(
    'cadastrado'
  );
  const [pedagioSelecionadoId, setPedagioSelecionadoId] = useState('');
  const [textoLivrePedagio, setTextoLivrePedagio] = useState('');
  const [valor, setValor] = useState('');
  const [semParar, setSemParar] = useState(true);
  const [responsavelPagamento, setResponsavelPagamento] =
    useState<ResponsavelPagamentoPedagio>('frigorifico_ressarce');

  const [modoVinculoViagem, setModoVinculoViagem] = useState<
    'horario' | 'lista'
  >('horario');
  const [viagemId, setViagemId] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!aberto) return;
    setErro('');

    if (passagemEdicao) {
      setDataHora(passagemEdicao.dataHora || obterDataHoraAtualLocal());
      setCaminhaoId(passagemEdicao.caminhaoId || '');
      setMotoristaId(passagemEdicao.motoristaId || '');

      if (passagemEdicao.pedagioId) {
        setModoPedagio('cadastrado');
        setPedagioSelecionadoId(passagemEdicao.pedagioId);
        setTextoLivrePedagio('');
      } else {
        setModoPedagio('livre');
        setPedagioSelecionadoId('');
        setTextoLivrePedagio(passagemEdicao.nomePedagio || '');
      }

      setValor(
        passagemEdicao.valor !== undefined ? String(passagemEdicao.valor) : ''
      );
      setSemParar(
        passagemEdicao.semParar !== undefined ? passagemEdicao.semParar : true
      );
      setResponsavelPagamento(
        passagemEdicao.responsavelPagamento || 'frigorifico_ressarce'
      );
      setModoVinculoViagem(passagemEdicao.viagemId ? 'lista' : 'horario');
      setViagemId(passagemEdicao.viagemId || '');
      return;
    }

    const caminhaoPadraoId = caminhaoInicialId || '';
    const caminhaoObj = caminhaoPadraoId
      ? caminhoes.find((c) => c.id === caminhaoPadraoId)
      : undefined;

    setDataHora(obterDataHoraAtualLocal());
    setCaminhaoId(caminhaoPadraoId);
    setMotoristaId(caminhaoObj?.motoristaId || '');
    setModoPedagio(pedagiosCadastrados.length > 0 ? 'cadastrado' : 'livre');
    setPedagioSelecionadoId(pedagiosCadastrados[0]?.id || '');
    setTextoLivrePedagio('');
    setValor('');
    setSemParar(true);
    setResponsavelPagamento('frigorifico_ressarce');
    setModoVinculoViagem(viagemInicialId ? 'lista' : 'horario');
    setViagemId(viagemInicialId || '');
  }, [
    aberto,
    passagemEdicao,
    caminhaoInicialId,
    viagemInicialId,
    caminhoes,
    pedagiosCadastrados,
  ]);

  useEffect(() => {
    if (!aberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, onFechar]);

  const viagensFiltradasCaminhao = useMemo(() => {
    if (!caminhaoId) return todasViagens;
    return todasViagens.filter(
      (v) => String(v.caminhaoId) === String(caminhaoId)
    );
  }, [todasViagens, caminhaoId]);

  // Localiza viagem pelo intervalo exato [dataHoraSaida, dataHoraChegada] ou viagem em andamento no mesmo dia
  const viagemLocalizadaPorHorario = useMemo(() => {
    const tsPassagem = parseTimestamp(dataHora);
    if (tsPassagem === null) return undefined;

    const dataPassagem = dataHora.slice(0, 10);

    // 1. Intervalo exato [saída, chegada]
    const exata = viagensFiltradasCaminhao.find((v) => {
      const tsSaida = parseTimestamp(v.dataHoraSaida);
      const tsChegada = parseTimestamp(v.dataHoraChegada);
      if (tsSaida === null || tsChegada === null) return false;
      return tsPassagem >= tsSaida && tsPassagem <= tsChegada;
    });
    if (exata) return exata;

    // 2. Viagem com saída registrada sem chegada ainda, no mesmo dia
    return viagensFiltradasCaminhao.find((v) => {
      const tsSaida = parseTimestamp(v.dataHoraSaida);
      const tsChegada = parseTimestamp(v.dataHoraChegada);
      if (tsSaida === null || tsChegada !== null) return false;
      return tsPassagem >= tsSaida && v.data === dataPassagem;
    });
  }, [dataHora, viagensFiltradasCaminhao]);

  const pedagioAtualObj = useMemo(() => {
    if (modoPedagio !== 'cadastrado' || !pedagioSelecionadoId) return undefined;
    return pedagiosCadastrados.find(
      (p) => String(p.id) === String(pedagioSelecionadoId)
    );
  }, [modoPedagio, pedagioSelecionadoId, pedagiosCadastrados]);

  const coordenadasAtivas = useMemo(() => {
    if (
      pedagioAtualObj &&
      typeof pedagioAtualObj.latitude === 'number' &&
      !Number.isNaN(pedagioAtualObj.latitude) &&
      typeof pedagioAtualObj.longitude === 'number' &&
      !Number.isNaN(pedagioAtualObj.longitude)
    ) {
      return {
        lat: pedagioAtualObj.latitude,
        lng: pedagioAtualObj.longitude,
      };
    }

    if (
      modoPedagio === 'cadastrado' &&
      passagemEdicao &&
      String(passagemEdicao.pedagioId) === String(pedagioSelecionadoId) &&
      typeof passagemEdicao.latitude === 'number' &&
      typeof passagemEdicao.longitude === 'number'
    ) {
      return {
        lat: passagemEdicao.latitude,
        lng: passagemEdicao.longitude,
      };
    }

    return null;
  }, [pedagioAtualObj, modoPedagio, pedagioSelecionadoId, passagemEdicao]);

  if (!aberto) return null;

  const handleTrocarCaminhao = (novoId: string) => {
    setCaminhaoId(novoId);
    setViagemId('');
    if (!novoId) {
      setMotoristaId('');
      return;
    }
    const encontrado = caminhoes.find((c) => c.id === novoId);
    setMotoristaId(encontrado?.motoristaId || '');
  };

  const formatarRotuloViagem = (v: ViagemOption) => {
    const cam = caminhoes.find((c) => String(c.id) === String(v.caminhaoId));
    const rota = v.localDesembarque
      ? `${v.localEmbarque} → ${v.localDesembarque}`
      : v.localEmbarque;
    return [
      formatarDataBr(v.data),
      rota,
      !caminhaoId && cam ? `${cam.nome} (${cam.placa})` : null,
      v.minuta ? `Minuta ${v.minuta}` : null,
      v.arquivada ? '(Arquivada)' : null,
    ]
      .filter(Boolean)
      .join(' • ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dataHora) {
      setErro('Informe a data e hora da passagem.');
      return;
    }

    let nomePedagioFinal = '';
    let pedagioIdFinal: string | undefined;
    let rodoviaFinal: string | undefined;
    let kmFinal: number | undefined;
    let cidadeFinal: string | undefined;
    let direcaoFinal: string | undefined;
    let latFinal: number | null | undefined;
    let lngFinal: number | null | undefined;

    if (modoPedagio === 'cadastrado') {
      if (!pedagioAtualObj) {
        setErro('Selecione um pedágio cadastrado ou altere para texto livre.');
        return;
      }
      pedagioIdFinal = pedagioAtualObj.id;
      nomePedagioFinal = pedagioAtualObj.nome;
      rodoviaFinal = pedagioAtualObj.rodovia;
      kmFinal = pedagioAtualObj.km;
      cidadeFinal = pedagioAtualObj.cidade;
      direcaoFinal = pedagioAtualObj.direcao;
      latFinal = pedagioAtualObj.latitude;
      lngFinal = pedagioAtualObj.longitude;
    } else {
      if (!textoLivrePedagio.trim()) {
        setErro('Digite o nome ou localização do pedágio.');
        return;
      }
      nomePedagioFinal = textoLivrePedagio.trim();
    }

    const valorNumerico = Number(valor.trim().replace(',', '.'));
    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor de tarifa válido maior que zero.');
      return;
    }

    const viagemVinculadaFinal =
      modoVinculoViagem === 'lista'
        ? viagemId || undefined
        : viagemLocalizadaPorHorario?.id || undefined;

    // Se a viagem escolhida possui caminhão e o campo caminhão estava vazio, preenche automaticamente
    const viagemObjFinal = viagemVinculadaFinal
      ? todasViagens.find((v) => String(v.id) === String(viagemVinculadaFinal))
      : undefined;
    const caminhaoFinal =
      caminhaoId || viagemObjFinal?.caminhaoId || undefined;

    salvarDespesaPedagio({
      id: passagemEdicao?.id,
      dataHora,
      caminhaoId: caminhaoFinal,
      motoristaId: motoristaId || undefined,
      viagemId: viagemVinculadaFinal,
      pedagioId: pedagioIdFinal,
      nomePedagio: nomePedagioFinal,
      rodovia: rodoviaFinal,
      km: kmFinal,
      cidade: cidadeFinal,
      direcao: direcaoFinal,
      latitude: latFinal,
      longitude: lngFinal,
      valor: Number(valorNumerico.toFixed(2)),
      semParar,
      responsavelPagamento,
      arquivado: passagemEdicao?.arquivado ?? false,
    });

    onSalvo();
    onFechar();
  };

  const caminhoesDisponiveis = caminhoes.filter(
    (c) => c.ativo || c.id === caminhaoId
  );
  const motoristasDisponiveis = motoristas.filter(
    (m) => m.ativo || m.id === motoristaId
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-6xl h-[92vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Milestone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {passagemEdicao
                  ? 'Editar Passagem de Pedágio'
                  : 'Nova Passagem de Pedágio'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lance cobranças via Sem Parar ou pagamento avulso em praças de pedágio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo em 2 colunas (Formulário + Mapa) */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6">
            {erro && (
              <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Coluna Esquerda: Campos */}
              <div className="lg:col-span-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Data e Hora *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={dataHora}
                      onChange={(e) => setDataHora(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Valor da Tarifa (R$) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0.01}
                      required
                      placeholder="Ex: 38.40"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* Seleção do Pedágio: Cadastrado ou Texto Livre */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Praça de Pedágio *
                    </label>

                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
                      <button
                        type="button"
                        onClick={() => setModoPedagio('cadastrado')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          modoPedagio === 'cadastrado'
                            ? 'bg-brand-500 text-brand-contrast'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5" />
                        Cadastrado ({pedagiosCadastrados.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoPedagio('livre')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          modoPedagio === 'livre'
                            ? 'bg-brand-500 text-brand-contrast'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Type className="w-3.5 h-3.5" />
                        Texto livre
                      </button>
                    </div>
                  </div>

                  {modoPedagio === 'cadastrado' ? (
                    <div className="space-y-2">
                      <select
                        value={pedagioSelecionadoId}
                        onChange={(e) =>
                          setPedagioSelecionadoId(e.target.value)
                        }
                        className="w-full h-10 px-3 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      >
                        <option value="">
                          {pedagiosCadastrados.length === 0
                            ? 'Nenhum pedágio cadastrado (use Texto livre)'
                            : 'Selecione uma praça cadastrada...'}
                        </option>
                        {pedagiosCadastrados.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} — {p.rodovia} (Km {p.km})
                            {p.cidade ? ` • ${p.cidade}` : ''}
                          </option>
                        ))}
                      </select>

                      {pedagioAtualObj && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 px-1">
                          <span>
                            Rodovia:{' '}
                            <strong className="font-mono text-slate-700 dark:text-slate-300">
                              {pedagioAtualObj.rodovia}
                            </strong>
                          </span>
                          <span>
                            KM:{' '}
                            <strong className="font-mono text-slate-700 dark:text-slate-300">
                              {pedagioAtualObj.km}
                            </strong>
                          </span>
                          {pedagioAtualObj.cidade && (
                            <span>Cidade: {pedagioAtualObj.cidade}</span>
                          )}
                          <span>Direção: {pedagioAtualObj.direcao}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Ex: Praça Presidente Bernardes - SP-270 Km 588"
                      value={textoLivrePedagio}
                      onChange={(e) => setTextoLivrePedagio(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  )}
                </div>

                {/* Caminhão e Motorista (Opcionais) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Caminhão (opcional)
                    </label>
                    <select
                      value={caminhaoId}
                      onChange={(e) => handleTrocarCaminhao(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="">Selecione um caminhão..</option>
                      {caminhoesDisponiveis.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} ({c.placa})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Motorista (opcional)
                    </label>
                    <select
                      value={motoristaId}
                      onChange={(e) => setMotoristaId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="">Sem motorista</option>
                      {motoristasDisponiveis.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Vínculo com Viagem (Pelo horário de saída/chegada ou Lista) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Route className="w-4 h-4 text-brand-500" />
                      Vincular a uma Viagem (opcional)
                    </div>

                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
                      <button
                        type="button"
                        onClick={() => setModoVinculoViagem('horario')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          modoVinculoViagem === 'horario'
                            ? 'bg-brand-500 text-brand-contrast'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Localizar pelo Horário
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoVinculoViagem('lista')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          modoVinculoViagem === 'lista'
                            ? 'bg-brand-500 text-brand-contrast'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5" />
                        Selecionar na Lista
                      </button>
                    </div>
                  </div>

                  {modoVinculoViagem === 'horario' ? (
                    viagemLocalizadaPorHorario ? (
                      <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/10 p-3 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            Viagem localizada pelo horário de saída/chegada
                          </div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {formatarRotuloViagem(viagemLocalizadaPorHorario)}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Saída:{' '}
                            {formatarDataHoraBr(
                              viagemLocalizadaPorHorario.dataHoraSaida
                            )}{' '}
                            • Chegada:{' '}
                            {viagemLocalizadaPorHorario.dataHoraChegada
                              ? formatarDataHoraBr(
                                  viagemLocalizadaPorHorario.dataHoraChegada
                                )
                              : 'Em andamento'}
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-semibold shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Será vinculada
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                        Nenhuma viagem com saída/chegada compatível com{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {formatarDataHoraBr(dataHora)}
                        </strong>
                        . Se desejar, alterne para{' '}
                        <button
                          type="button"
                          onClick={() => setModoVinculoViagem('lista')}
                          className="text-brand-600 dark:text-brand-400 font-semibold underline cursor-pointer"
                        >
                          Selecionar na Lista
                        </button>{' '}
                        ou salve sem viagem para vincular depois.
                      </div>
                    )
                  ) : (
                    <select
                      value={viagemId}
                      onChange={(e) => setViagemId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="">
                        Sem viagem vinculada ({viagensFiltradasCaminhao.length}{' '}
                        disponível(is))
                      </option>
                      {viagensFiltradasCaminhao.map((v) => (
                        <option key={v.id} value={v.id}>
                          {formatarRotuloViagem(v)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Responsável pelo pagamento + Chave Sem Parar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Responsável pelo Pagamento *
                    </label>
                    <select
                      value={responsavelPagamento}
                      onChange={(e) =>
                        setResponsavelPagamento(
                          e.target.value as ResponsavelPagamentoPedagio
                        )
                      }
                      className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    >
                      {RESPONSAVEIS_PAGAMENTO_PEDAGIO.map((resp) => (
                        <option key={resp.valor} value={resp.valor}>
                          {resp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Chave Sem Parar */}
                  <div className="flex items-center justify-between h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-2">
                      <Radio
                        className={`w-4 h-4 ${
                          semParar ? 'text-brand-500' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Cobrança via Sem Parar
                      </span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={semParar}
                      onClick={() => setSemParar((prev) => !prev)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                        semParar
                          ? 'bg-brand-500'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                          semParar ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Mapa da Praça de Pedágio */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="flex-1 min-h-[260px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-white/70 dark:bg-slate-900/70">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      Localização da Praça
                    </div>

                    {coordenadasAtivas && (
                      <a
                        href={`https://www.google.com/maps?q=${coordenadasAtivas.lat},${coordenadasAtivas.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Abrir no Maps
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {coordenadasAtivas ? (
                    <div className="flex-1 flex flex-col">
                      <iframe
                        title="Mapa da praça de pedágio"
                        src={montarUrlMapaOsm(
                          coordenadasAtivas.lat,
                          coordenadasAtivas.lng
                        )}
                        className="w-full flex-1 min-h-[240px] border-0"
                        loading="lazy"
                      />
                      <div className="px-4 py-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        Lat: {coordenadasAtivas.lat} • Lng:{' '}
                        {coordenadasAtivas.lng}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Sem coordenadas disponíveis
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                        {modoPedagio === 'cadastrado'
                          ? 'Cadastre latitude e longitude nesta praça em Cadastros > Pedágios para visualizar o mapa aqui.'
                          : 'Selecione um pedágio cadastrado com coordenadas para exibir a localização no mapa.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé Fixo */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
            <button
              type="button"
              onClick={onFechar}
              className="h-10 px-5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {passagemEdicao ? 'Salvar Alterações' : 'Salvar Passagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}