import { useEffect, useMemo, useState } from 'react';
import { createRoute, Link } from '@tanstack/react-router';
import {
  Truck,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Fuel,
  Wrench,
  Milestone,
  CheckCircle2,
  Clock,
  Beef,
  ChevronRight,
  FileSpreadsheet,
  ClipboardCheck,
  Code2,
} from 'lucide-react';
import { rootRoute } from './root';
import { lerWallet } from '../storage/walletStorage';
import { useDevMode } from '../context/DevModeContext';
import { listarViagens, type Viagem } from '../storage/viagensStorage';
import {
  listarCaminhoes,
  listarFrigorificos,
  listarIntermediarios,
  listarMotoristas,
} from '../storage/cadastrosStorage';
import {
  lerAbastecimentos,
  type Abastecimento,
} from '../storage/abastecimentosStorage';
import { lerManutencoes } from '../storage/manutencoesStorage';
import { lerDespesasPedagios } from '../storage/despesasPedagiosStorage';
import {
  listarIdsDespesasJaAcertadas,
  listarIdsViagensJaRecebidas,
  listarRecebimentos,
} from '../storage/recebimentosStorage';

type PeriodoFiltro = 'mes_atual' | 'ultimos_30' | 'mes_anterior' | 'tudo';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarDataBR(iso?: string | null): string {
  if (!iso) return '—';
  const partes = iso.slice(0, 10).split('-');
  if (partes.length !== 3) return iso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function estaNoPeriodo(dataStr: string | undefined, periodo: PeriodoFiltro): boolean {
  if (periodo === 'tudo' || !dataStr) return true;
  const data = new Date(`${dataStr.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(data.getTime())) return true;

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();

  if (periodo === 'mes_atual') {
    return data.getFullYear() === anoAtual && data.getMonth() === mesAtual;
  }

  if (periodo === 'mes_anterior') {
    const mesAnt = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnt = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    return data.getFullYear() === anoAnt && data.getMonth() === mesAnt;
  }

  if (periodo === 'ultimos_30') {
    const limite = new Date();
    limite.setDate(hoje.getDate() - 30);
    return data >= limite;
  }

  return true;
}

function temItemAcertoPagador(ab: Abastecimento): boolean {
  if (ab.itens && ab.itens.length > 0) {
    return ab.itens.some((item) => {
      const resp =
        item.responsavelPagamento === 'padrao'
          ? ab.responsavelPagamento
          : item.responsavelPagamento;
      return resp === 'frigorifico_desconta' || resp === 'frigorifico_ressarce';
    });
  }
  return (
    ab.responsavelPagamento === 'frigorifico_desconta' ||
    ab.responsavelPagamento === 'frigorifico_ressarce'
  );
}

function IndexPage() {
  const { devMode } = useDevMode();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes_atual');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const atualizar = () => setTick((n) => n + 1);
    window.addEventListener('storage', atualizar);
    window.addEventListener('bt-wallet-updated', atualizar);
    window.addEventListener('bt-recebimentos-updated', atualizar);
    window.addEventListener('bt-abastecimentos-updated', atualizar);
    window.addEventListener('bt-manutencoes-updated', atualizar);
    window.addEventListener('bt-pedagios-updated', atualizar);
    return () => {
      window.removeEventListener('storage', atualizar);
      window.removeEventListener('bt-wallet-updated', atualizar);
      window.removeEventListener('bt-recebimentos-updated', atualizar);
      window.removeEventListener('bt-abastecimentos-updated', atualizar);
      window.removeEventListener('bt-manutencoes-updated', atualizar);
      window.removeEventListener('bt-pedagios-updated', atualizar);
    };
  }, []);

  const dados = useMemo(() => {
    void tick;

    const hojeISO = new Date().toISOString().slice(0, 10);
    const wallet = lerWallet();

    const caminhoes = listarCaminhoes();
    const motoristas = listarMotoristas();
    const frigorificos = listarFrigorificos();
    const intermediarios = listarIntermediarios();

    const mapaCaminhoesCad = new Map(caminhoes.map((c) => [String(c.id), c]));
    const mapaMotoristas = new Map(motoristas.map((m) => [String(m.id), m]));
    const mapaFrigorificos = new Map(frigorificos.map((f) => [String(f.id), f]));
    const mapaIntermediarios = new Map(intermediarios.map((i) => [String(i.id), i]));

    const viagens = listarViagens();
    const abastecimentos = lerAbastecimentos().filter((a) => !a.arquivado);
    const manutencoes = lerManutencoes().filter((m) => !m.arquivada);
    const pedagios = lerDespesasPedagios().filter((p) => !p.arquivado);

    const idsViagensPagas = listarIdsViagensJaRecebidas();
    const idsDespesasAcertadas = listarIdsDespesasJaAcertadas();
    const recebimentos = listarRecebimentos().filter((r) => !r.arquivado);

    const viagensPeriodo = viagens.filter((v) => estaNoPeriodo(v.data, periodo));
    const abastPeriodo = abastecimentos.filter((a) => estaNoPeriodo(a.dataHora, periodo));
    const manutPeriodo = manutencoes.filter((m) => estaNoPeriodo(m.dataHora, periodo));
    const pedagiosPeriodo = pedagios.filter((p) => estaNoPeriodo(p.dataHora, periodo));
    const recebimentosPeriodo = recebimentos.filter((r) =>
      estaNoPeriodo(r.dataPagamento, periodo)
    );

    const faturamentoBruto = viagensPeriodo.reduce((s, v) => s + v.valorViagem, 0);
    const totalAluguelCarreta = viagensPeriodo.reduce(
      (s, v) => s + v.valorAluguelCarreta,
      0
    );
    const faturamentoLiquido = viagensPeriodo.reduce(
      (s, v) => s + v.valorLiquidoViagem,
      0
    );
    const kmRodados = viagensPeriodo.reduce(
      (s, v) => s + (Number(v.kmInformado) || 0),
      0
    );

    const totalAbastecimento = abastPeriodo.reduce((s, a) => s + (a.valorTotal || 0), 0);
    const totalManutencao = manutPeriodo.reduce((s, m) => s + (m.valor || 0), 0);
    const totalPedagios = pedagiosPeriodo.reduce((s, p) => s + (p.valor || 0), 0);
    const totalPerdasAnimais = viagensPeriodo.reduce(
      (s, v) => s + (v.valorTotalAnimaisPerdidos || 0),
      0
    );

    const totalDespesas = totalAbastecimento + totalManutencao + totalPedagios;
    const resultadoOperacional =
      faturamentoLiquido - totalDespesas - totalPerdasAnimais;
    const totalEfetivamenteRecebidoPeriodo = recebimentosPeriodo.reduce(
      (s, r) => s + (r.valorEfetivamentePago || 0),
      0
    );

    const viagensAReceber: Viagem[] = [];
    const viagensAtrasadas: Viagem[] = [];

    for (const v of viagens) {
      if (idsViagensPagas.has(String(v.id))) continue;
      viagensAReceber.push(v);
      if (v.dataPrevistaRecebimento && v.dataPrevistaRecebimento < hojeISO) {
        viagensAtrasadas.push(v);
      }
    }

    const valorTotalAReceber = viagensAReceber.reduce(
      (s, v) => s + v.valorLiquidoViagem,
      0
    );
    const valorTotalAtrasado = viagensAtrasadas.reduce(
      (s, v) => s + v.valorLiquidoViagem,
      0
    );

    const viagensSaidaChegadaPendente = viagens.filter(
      (v) => v.statusSaidaChegada === 'pendente'
    );
    const viagensAnimaisPerdidosPendente = viagens.filter(
      (v) =>
        v.statusSaidaChegada !== 'pendente' &&
        v.statusAnimaisPerdidos === 'pendente'
    );

    const abastPendentesAcerto = abastecimentos.filter(
      (a) => !idsDespesasAcertadas.has(String(a.id)) && temItemAcertoPagador(a)
    ).length;

    const manutPendentesAcerto = manutencoes.filter(
      (m) =>
        !idsDespesasAcertadas.has(String(m.id)) &&
        m.responsavelPagamento !== 'minha_despesa'
    ).length;

    const pedagiosPendentesAcerto = pedagios.filter(
      (p) =>
        !idsDespesasAcertadas.has(String(p.id)) &&
        p.responsavelPagamento !== 'minha_despesa'
    ).length;

    const totalDespesasPendentesAcerto =
      abastPendentesAcerto + manutPendentesAcerto + pedagiosPendentesAcerto;

    const resumoMap = new Map<
      string,
      {
        id: string;
        nome: string;
        placa: string;
        motorista: string;
        viagensCount: number;
        faturamentoLiquido: number;
        despesas: number;
      }
    >();

    caminhoes
      .filter((c) => c.ativo)
      .forEach((c) => {
        resumoMap.set(String(c.id), {
          id: String(c.id),
          nome: c.nome,
          placa: c.placa,
          motorista: mapaMotoristas.get(String(c.motoristaId))?.nome || '',
          viagensCount: 0,
          faturamentoLiquido: 0,
          despesas: 0,
        });
      });

    const garantirCaminhao = (caminhaoId?: string) => {
      const key = caminhaoId ? String(caminhaoId) : 'sem-caminhao';
      if (!resumoMap.has(key)) {
        const cad = mapaCaminhoesCad.get(key);
        resumoMap.set(key, {
          id: key,
          nome: cad?.nome || 'Sem caminhão',
          placa: cad?.placa || '',
          motorista: cad ? mapaMotoristas.get(String(cad.motoristaId))?.nome || '' : '',
          viagensCount: 0,
          faturamentoLiquido: 0,
          despesas: 0,
        });
      }
      return resumoMap.get(key)!;
    };

    viagensPeriodo.forEach((v) => {
      const item = garantirCaminhao(v.caminhaoId);
      item.viagensCount += 1;
      item.faturamentoLiquido += v.valorLiquidoViagem;
    });

    abastPeriodo.forEach((a) => {
      garantirCaminhao(a.caminhaoId).despesas += a.valorTotal || 0;
    });

    manutPeriodo.forEach((m) => {
      garantirCaminhao(m.caminhaoId).despesas += m.valor || 0;
    });

    pedagiosPeriodo.forEach((p) => {
      if (p.caminhaoId) {
        garantirCaminhao(p.caminhaoId).despesas += p.valor || 0;
      }
    });

    const resumoPorCaminhao = Array.from(resumoMap.values()).filter(
      (c) => c.id !== 'sem-caminhao' || c.viagensCount > 0 || c.despesas > 0
    );

    const viagensRecentes = [...viagens]
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 6)
      .map((v) => {
        const pago = idsViagensPagas.has(String(v.id));
        const atrasado =
          !pago &&
          Boolean(v.dataPrevistaRecebimento && v.dataPrevistaRecebimento < hojeISO);

        const pagadorNome =
          v.pagadorTipo === 'intermediario'
            ? mapaIntermediarios.get(String(v.pagadorId))?.nome || 'Intermediário'
            : mapaFrigorificos.get(String(v.pagadorId))?.nome || 'Frigorífico';

        const caminhao = mapaCaminhoesCad.get(String(v.caminhaoId));
        const frigorifico = mapaFrigorificos.get(String(v.frigorificoId));

        return {
          ...v,
          pago,
          atrasado,
          pagadorNome,
          caminhaoNome: caminhao?.nome || '—',
          destinoLabel: v.localDesembarque || frigorifico?.nome || 'Destino',
        };
      });

    const totalAlertas =
      (wallet.saldo < 0 ? 1 : 0) +
      (viagensAtrasadas.length > 0 ? 1 : 0) +
      (totalDespesasPendentesAcerto > 0 ? 1 : 0) +
      (viagensSaidaChegadaPendente.length > 0 ? 1 : 0) +
      (viagensAnimaisPerdidosPendente.length > 0 ? 1 : 0);

    return {
      saldoWallet: wallet.saldo,
      faturamentoBruto,
      totalAluguelCarreta,
      faturamentoLiquido,
      kmRodados,
      totalAbastecimento,
      totalManutencao,
      totalPedagios,
      totalPerdasAnimais,
      totalDespesas,
      resultadoOperacional,
      totalEfetivamenteRecebidoPeriodo,
      viagensPeriodoCount: viagensPeriodo.length,
      viagensAtrasadas,
      valorTotalAtrasado,
      valorTotalAReceber,
      viagensSaidaChegadaPendenteCount: viagensSaidaChegadaPendente.length,
      viagensAnimaisPerdidosPendenteCount: viagensAnimaisPerdidosPendente.length,
      totalDespesasPendentesAcerto,
      totalAlertas,
      resumoPorCaminhao,
      viagensRecentes,
      totaisBrutos: {
        viagens: viagens.length,
        abastecimentos: abastecimentos.length,
        manutencoes: manutencoes.length,
        pedagios: pedagios.length,
        recebimentos: recebimentos.length,
      },
    };
  }, [periodo, tick]);

  const opcoesPeriodo: { id: PeriodoFiltro; label: string }[] = [
    { id: 'mes_atual', label: 'Este Mês' },
    { id: 'ultimos_30', label: '30 Dias' },
    { id: 'mes_anterior', label: 'Mês Anterior' },
    { id: 'tudo', label: 'Todo Período' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Cabeçalho e Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Painel Operacional
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhamento consolidado da frota, fretes, despesas e acertos financeiros.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            {opcoesPeriodo.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setPeriodo(op.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  periodo === op.id
                    ? 'bg-brand-500 text-brand-contrast shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>

          <Link
            to="/viagens"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-brand-contrast text-xs font-semibold shadow-2xs transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            Gerenciar Viagens
          </Link>
        </div>
      </div>

      {/* 4 Cards Principais de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Faturamento */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Faturamento Líquido
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-slate-900 dark:text-white">
            {formatarMoeda(dados.faturamentoLiquido)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Bruto: {formatarMoeda(dados.faturamentoBruto)}</span>
            <span>{dados.viagensPeriodoCount} viagens</span>
          </div>
        </div>

        {/* KPI 2: Despesas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Despesas no Período
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-slate-900 dark:text-white">
            {formatarMoeda(dados.totalDespesas)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1" title="Abastecimentos">
              <Fuel className="w-3 h-3 text-amber-500" />
              {formatarMoeda(dados.totalAbastecimento)}
            </span>
            <span className="inline-flex items-center gap-1" title="Manutenção + Pedágios">
              <Wrench className="w-3 h-3 text-slate-400" />
              {formatarMoeda(dados.totalManutencao + dados.totalPedagios)}
            </span>
          </div>
        </div>

        {/* KPI 3: Resultado Operacional */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resultado Operacional
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-3 text-2xl font-mono font-bold ${
              dados.resultadoOperacional >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatarMoeda(dados.resultadoOperacional)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Aluguel carreta: {formatarMoeda(dados.totalAluguelCarreta)}</span>
            {dados.kmRodados > 0 && (
              <span>{dados.kmRodados.toLocaleString('pt-BR')} km</span>
            )}
          </div>
        </div>

        {/* KPI 4: Fretes a Receber */}
        <Link
          to="/financeiro"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 shadow-2xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fretes a Receber
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-mono font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>{formatarMoeda(dados.valorTotalAReceber)}</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
          </div>
          <div className="mt-2 text-xs">
            {dados.viagensAtrasadas.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {dados.viagensAtrasadas.length} em atraso ({formatarMoeda(dados.valorTotalAtrasado)})
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Recebido no período: {formatarMoeda(dados.totalEfetivamenteRecebidoPeriodo)}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Meio: Desempenho por Caminhão + Alertas e Pendências */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colunas 1-2: Desempenho por Caminhão */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Desempenho por Caminhão
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receita líquida de fretes vs. despesas lançadas por veículo no período
              </p>
            </div>
            <Link
              to="/cadastros"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
            >
              Ver Frota
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {dados.resumoPorCaminhao.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Truck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nenhum caminhão ativo encontrado
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Cadastre os caminhões em Cadastros para acompanhar o resultado por veículo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dados.resumoPorCaminhao.map((cam) => {
                const saldoCam = cam.faturamentoLiquido - cam.despesas;
                const baseBarra = Math.max(cam.faturamentoLiquido, cam.despesas, 1);
                const pctReceita = Math.min(
                  100,
                  Math.round((cam.faturamentoLiquido / baseBarra) * 100)
                );
                const pctDespesa = Math.min(
                  100,
                  Math.round((cam.despesas / baseBarra) * 100)
                );

                return (
                  <div
                    key={cam.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {cam.nome}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {cam.placa ? `${cam.placa}` : 'Sem placa'}
                            {cam.motorista ? ` • ${cam.motorista}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {cam.viagensCount}{' '}
                        {cam.viagensCount === 1 ? 'viagem' : 'viagens'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 dark:text-slate-400">
                            Receita Líquida
                          </span>
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatarMoeda(cam.faturamentoLiquido)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${pctReceita}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 dark:text-slate-400">
                            Despesas
                          </span>
                          <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                            {formatarMoeda(cam.despesas)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-rose-500 transition-all"
                            style={{ width: `${pctDespesa}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Saldo do Veículo
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          saldoCam >= 0
                            ? 'text-slate-900 dark:text-white'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatarMoeda(saldoCam)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Breakdown de despesas */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              to="/despesas"
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center gap-2.5"
            >
              <Fuel className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Abastecimento
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                  {formatarMoeda(dados.totalAbastecimento)}
                </div>
              </div>
            </Link>

            <Link
              to="/despesas"
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center gap-2.5"
            >
              <Wrench className="w-4 h-4 text-sky-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Manutenção
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                  {formatarMoeda(dados.totalManutencao)}
                </div>
              </div>
            </Link>

            <Link
              to="/despesas"
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center gap-2.5"
            >
              <Milestone className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pedágios
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                  {formatarMoeda(dados.totalPedagios)}
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Coluna 3: Alertas e Pendências */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Alertas e Acertos
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {dados.totalAlertas} {dados.totalAlertas === 1 ? 'alerta' : 'alertas'}
              </span>
            </div>

            <div className="space-y-2.5">
              {dados.saldoWallet < 0 && (
                <Link
                  to="/wallet"
                  className="block p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 hover:border-rose-500/50 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-rose-700 dark:text-rose-300">
                        Saldo da Carteira Negativo
                      </div>
                      <p className="text-rose-600/90 dark:text-rose-400 mt-0.5">
                        Saldo atual em {formatarMoeda(dados.saldoWallet)}. Confira os saldos por caminhão e pagador.
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {dados.viagensAtrasadas.length > 0 && (
                <Link
                  to="/financeiro"
                  className="block p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-amber-800 dark:text-amber-300">
                        {dados.viagensAtrasadas.length}{' '}
                        {dados.viagensAtrasadas.length === 1
                          ? 'frete com previsão vencida'
                          : 'fretes com previsão vencida'}
                      </div>
                      <p className="text-amber-700/90 dark:text-amber-400 mt-0.5">
                        Total de {formatarMoeda(dados.valorTotalAtrasado)} aguardando recebimento.
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {dados.totalDespesasPendentesAcerto > 0 && (
                <Link
                  to="/financeiro"
                  className="block p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/25 hover:border-sky-500/50 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Wallet className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-sky-800 dark:text-sky-300">
                        Despesas Pendentes de Acerto
                      </div>
                      <p className="text-sky-700/90 dark:text-sky-400 mt-0.5">
                        {dados.totalDespesasPendentesAcerto}{' '}
                        {dados.totalDespesasPendentesAcerto === 1
                          ? 'lançamento de despesa ainda não entrou em recebimento'
                          : 'lançamentos de despesas ainda não entraram em recebimento'}{' '}
                        para desconto ou ressarcimento no acerto.
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {(dados.viagensSaidaChegadaPendenteCount > 0 ||
                dados.viagensAnimaisPerdidosPendenteCount > 0) && (
                <Link
                  to="/viagens"
                  className="block p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-brand-500/50 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <ClipboardCheck className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Etapas Operacionais Pendentes
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        {dados.viagensSaidaChegadaPendenteCount > 0 &&
                          `${dados.viagensSaidaChegadaPendenteCount} em Saída & Chegada`}
                        {dados.viagensSaidaChegadaPendenteCount > 0 &&
                          dados.viagensAnimaisPerdidosPendenteCount > 0 &&
                          ' • '}
                        {dados.viagensAnimaisPerdidosPendenteCount > 0 &&
                          `${dados.viagensAnimaisPerdidosPendenteCount} em Animais Perdidos`}
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {dados.totalAlertas === 0 && (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Tudo em dia na operação
                  </div>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-1">
                    Sem atrasos de recebimento ou etapas pendentes no momento.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link
              to="/financeiro"
              className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Ir para Recebimentos →
            </Link>
            <Link
              to="/wallet"
              className="font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Abrir Carteira
            </Link>
          </div>
        </div>
      </div>

      {/* Tabela de Viagens Recentes */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Viagens Recentes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Últimos fretes ativos registrados no sistema
            </p>
          </div>
          <Link
            to="/viagens"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
          >
            Ver todas as viagens
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {dados.viagensRecentes.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Beef className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nenhuma viagem registrada ainda
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Lance a primeira viagem para acompanhar faturamento, rotas e previsões de recebimento.
            </p>
            <Link
              to="/viagens"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-brand-contrast text-xs font-semibold transition-colors"
            >
              Ir para Viagens
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4">Data</th>
                  <th className="py-2.5 px-4">Rota / Destino</th>
                  <th className="py-2.5 px-4">Caminhão / Gado</th>
                  <th className="py-2.5 px-4">Pagador</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 pl-4 text-right">Valor Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {dados.viagensRecentes.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatarDataBR(v.data)}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {v.localEmbarque || 'Origem'}{' '}
                      <span className="text-slate-400 mx-1">→</span>
                      {v.destinoLabel}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{v.caminhaoNome}</div>
                      <div className="text-[11px] text-slate-400">
                        {v.tipoGado === 'boi_gordo' ? 'Boi Gordo' : 'Boi Magro'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {v.pagadorNome}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {v.pago ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          Recebido
                        </span>
                      ) : v.atrasado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400">
                          Atrasado ({formatarDataBR(v.dataPrevistaRecebimento)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          Prev. {formatarDataBR(v.dataPrevistaRecebimento)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 pl-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatarMoeda(v.valorLiquidoViagem)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {devMode && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-purple-600 dark:text-purple-400">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Code2 className="w-3.5 h-3.5" />
              DEVMODE:
            </span>
            <span>viagens={dados.totaisBrutos.viagens}</span>
            <span>abast={dados.totaisBrutos.abastecimentos}</span>
            <span>manut={dados.totaisBrutos.manutencoes}</span>
            <span>pedagios={dados.totaisBrutos.pedagios}</span>
            <span>receb={dados.totaisBrutos.recebimentos}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});