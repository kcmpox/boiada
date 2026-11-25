import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Truck,
  Calendar,
  MapPin,
  User,
  Wallet,
  Route,
  FileText,
  Trash2,
  Factory,
  Code2,
  Pencil,
  CalendarCheck,
  DollarSign,
  Archive,
} from 'lucide-react';
import {
  listarViagens,
  salvarViagens,
  arquivarViagem,
  type Viagem,
} from '../../storage/viagensStorage';
import {
  listarCaminhoes,
  listarMotoristas,
  listarFrigorificos,
  listarIntermediarios,
} from '../../storage/cadastrosStorage';
import { Paginacao } from '../Paginacao';
import { ModalNovaViagem } from './ModalNovaViagem';
import { ModalEditarValorBrutoViagem } from './ModalEditarValorBrutoViagem';
import { ModalEditarJsonViagem } from '../json_editor/ModalEditarJsonViagem';
import { useDevMode } from '../../context/DevModeContext';

const ITENS_POR_PAGINA = 10;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarDataBr(isoDate: string): string {
  if (!isoDate) return '—';
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

export function SecaoViagensAtivas() {
  const { devMode } = useDevMode();
  const [viagens, setViagens] = useState<Viagem[]>(() => listarViagens());
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalNovaAberta, setModalNovaAberta] = useState(false);
  const [viagemEmEdicao, setViagemEmEdicao] = useState<Viagem | null>(null);
  const [viagemValorBrutoEmEdicao, setViagemValorBrutoEmEdicao] =
    useState<Viagem | null>(null);
  const [viagemJsonEmEdicao, setViagemJsonEmEdicao] = useState<Viagem | null>(
    null
  );

  const caminhoes = useMemo(() => listarCaminhoes(), []);
  const motoristas = useMemo(() => listarMotoristas(), []);
  const frigorificos = useMemo(() => listarFrigorificos(), []);
  const intermediarios = useMemo(() => listarIntermediarios(), []);

  const totalPaginas = Math.max(
    1,
    Math.ceil(viagens.length / ITENS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const viagensPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return viagens.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [viagens, paginaSegura]);

  const handleAdicionarViagem = (nova: Viagem) => {
    const atualizada = [nova, ...viagens];
    setViagens(atualizada);
    salvarViagens(atualizada);
    setPaginaAtual(1);
    setModalNovaAberta(false);
  };

  const handleSalvarEdicaoViagem = (editada: Viagem) => {
    const atualizada = viagens.map((v) =>
      v.id === editada.id ? editada : v
    );
    setViagens(atualizada);
    salvarViagens(atualizada);
    setViagemEmEdicao(null);
    setViagemValorBrutoEmEdicao(null);
    setViagemJsonEmEdicao(null);
  };

  const handleArquivar = (id: string) => {
    const restantes = arquivarViagem(id);
    setViagens(restantes);
  };

  const excluirViagem = (id: string) => {
    const atualizada = viagens.filter((v) => v.id !== id);
    setViagens(atualizada);
    salvarViagens(atualizada);
  };

  const obterCaminhao = (id: string) =>
    caminhoes.find((c) => c.id === id);

  const obterNomeMotorista = (id: string) =>
    motoristas.find((m) => m.id === id)?.nome || 'Sem motorista';

  const obterNomeFrigorifico = (id: string) =>
    frigorificos.find((f) => f.id === id)?.nome || '';

  const obterNomePagador = (v: Viagem) => {
    if (v.pagadorTipo === 'frigorifico') {
      return (
        frigorificos.find((f) => f.id === v.pagadorId)?.nome ||
        'Frigorífico removido'
      );
    }
    return (
      intermediarios.find((i) => i.id === v.pagadorId)?.nome ||
      'Intermediário removido'
    );
  };

  return (
    <div className="space-y-5">
      {/* Barra Superior com Botão Nova Viagem */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {viagens.length === 0
            ? 'Nenhuma viagem registrada.'
            : `${viagens.length} ${
                viagens.length === 1 ? 'viagem registrada' : 'viagens registradas'
              }`}
        </div>

        <button
          type="button"
          onClick={() => setModalNovaAberta(true)}
          className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Viagem
        </button>
      </div>

      {/* Listagem dos Cards de Viagens */}
      {viagens.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Truck className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nenhuma viagem cadastrada ainda
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Clique em <strong>Nova Viagem</strong> acima para lançar o transporte e calcular automaticamente o frete.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {viagensPaginadas.map((v) => {
              const caminhao = obterCaminhao(v.caminhaoId);
              const frigResponsavel = obterNomeFrigorifico(v.frigorificoId);
              const liquido =
                v.valorLiquidoViagem !== undefined
                  ? v.valorLiquidoViagem
                  : v.valorViagem - v.valorAluguelCarreta;

              return (
                <div
                  key={v.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4"
                >
                  {/* Linha Superior: Badges + Data + Rota + Ações */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                            v.tipoGado === 'boi_gordo'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300'
                          }`}
                        >
                          {v.tipoGado === 'boi_gordo' ? 'Boi Gordo' : 'Boi Magro'}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatarDataBr(v.data)}
                        </span>

                        <span className="text-xs text-slate-300 dark:text-slate-700">
                          •
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <Truck className="w-3.5 h-3.5 text-brand-500" />
                          {caminhao
                            ? `${caminhao.nome} (${caminhao.placa})`
                            : 'Caminhão removido'}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <User className="w-3.5 h-3.5" />
                          {obterNomeMotorista(v.motoristaId)}
                        </span>
                      </div>

                      {/* Embarque -> Desembarque */}
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white pt-0.5">
                        <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                        <span>{v.localEmbarque}</span>
                        {v.localDesembarque && (
                          <>
                            <span className="text-slate-400">→</span>
                            <span>{v.localDesembarque}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-1 ml-auto">
                      {v.tipoGado === 'boi_magro' && (
                        <button
                          type="button"
                          onClick={() => setViagemValorBrutoEmEdicao(v)}
                          title="Editar valor bruto (Boi Magro)"
                          aria-label="Editar valor bruto"
                          className="p-2 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}

                      {devMode && (
                        <button
                          type="button"
                          onClick={() => setViagemJsonEmEdicao(v)}
                          title="Editar JSON (DevMode)"
                          className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
                        >
                          <Code2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setViagemEmEdicao(v)}
                        title="Editar viagem"
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleArquivar(v.id)}
                        title="Arquivar viagem"
                        aria-label="Arquivar viagem"
                        className="p-2 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirViagem(v.id)}
                        title="Excluir viagem"
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bloco Financeiro do Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        Valor Bruto
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {formatarMoeda(v.valorViagem)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        Aluguel Carreta ({v.percentualAluguelCarreta}%)
                      </div>
                      <div className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                        {v.valorAluguelCarreta > 0
                          ? `- ${formatarMoeda(v.valorAluguelCarreta)}`
                          : formatarMoeda(0)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        Valor Líquido
                      </div>
                      <div className="text-sm font-mono font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                        {formatarMoeda(liquido)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3 text-emerald-500" />
                        Prev. Recebimento
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {v.dataPrevistaRecebimento
                          ? formatarDataBr(v.dataPrevistaRecebimento)
                          : 'Não definida'}
                      </div>
                    </div>
                  </div>

                  {/* Linha Inferior: Pagador, KM, Frigorífico e Documentos */}
                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Wallet className="w-3.5 h-3.5 text-brand-500" />
                        Pagador: <strong>{obterNomePagador(v)}</strong>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <Route className="w-3.5 h-3.5 text-slate-400" />
                        {v.kmInformado} km (
                        {v.baseKmInformada === 'ida_volta'
                          ? 'Ida e Volta'
                          : 'Só Ida'}
                        )
                      </span>

                      {frigResponsavel && (
                        <span className="inline-flex items-center gap-1.5">
                          <Factory className="w-3.5 h-3.5 text-slate-400" />
                          Frig.: {frigResponsavel}
                        </span>
                      )}

                      {v.pecuarista && <span>Pecuarista: {v.pecuarista}</span>}
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      {v.cte && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <FileText className="w-3 h-3" />
                          CTe: {v.cte}
                        </span>
                      )}
                      {v.minuta && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <FileText className="w-3 h-3" />
                          Minuta: {v.minuta}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Paginacao
            paginaAtual={paginaSegura}
            totalItens={viagens.length}
            itensPorPagina={ITENS_POR_PAGINA}
            onMudarPagina={setPaginaAtual}
          />
        </div>
      )}

      {/* Popup Nova Viagem */}
      {modalNovaAberta && (
        <ModalNovaViagem
          onSalvar={handleAdicionarViagem}
          onFechar={() => setModalNovaAberta(false)}
        />
      )}

      {/* Popup Editar Viagem Completa */}
      {viagemEmEdicao && (
        <ModalNovaViagem
          viagemParaEditar={viagemEmEdicao}
          onSalvar={handleSalvarEdicaoViagem}
          onFechar={() => setViagemEmEdicao(null)}
        />
      )}

      {/* Popup Editar Valor Bruto (Boi Magro) */}
      {viagemValorBrutoEmEdicao && (
        <ModalEditarValorBrutoViagem
          viagem={viagemValorBrutoEmEdicao}
          onSalvar={handleSalvarEdicaoViagem}
          onFechar={() => setViagemValorBrutoEmEdicao(null)}
        />
      )}

      {/* Popup JSON DevMode */}
      <ModalEditarJsonViagem
        viagem={viagemJsonEmEdicao}
        onSalvar={handleSalvarEdicaoViagem}
        onFechar={() => setViagemJsonEmEdicao(null)}
      />
    </div>
  );
}