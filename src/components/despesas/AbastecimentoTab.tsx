import { useState, useMemo } from 'react';
import { Fuel, Archive, AlertCircle, Truck } from 'lucide-react';
import * as cadastrosStorage from '../../storage/cadastrosStorage';
import { TodosAbastecimentos } from './abastecimento/TodosAbastecimentos';
import { AbastecimentosArquivados } from './abastecimento/AbastecimentosArquivados';
import { ViagensSemAbastecimentos } from './abastecimento/ViagensSemAbastecimentos';
import { AbastecimentosCaminhao } from './abastecimento/AbastecimentosCaminhao';

interface CaminhaoItem {
  id: string | number;
  nome?: string;
  apelido?: string;
  placa?: string;
  ativo?: boolean;
}

type SecaoAtiva =
  | { tipo: 'todos' }
  | { tipo: 'arquivados' }
  | { tipo: 'sem-abastecimento' }
  | { tipo: 'caminhao'; caminhaoId: string };

function lerCaminhoes(): CaminhaoItem[] {
  const storage = cadastrosStorage as Record<string, unknown>;
  const fn =
    storage.getCaminhoes ||
    storage.loadCadastros ||
    storage.getCadastros ||
    storage.carregarCadastros;

  if (typeof fn === 'function') {
    const res = fn();
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object' && 'caminhoes' in res) {
      const lista = (res as { caminhoes?: CaminhaoItem[] }).caminhoes;
      if (Array.isArray(lista)) return lista;
    }
  }
  return [];
}

export function AbastecimentoTab() {
  const [secao, setSecao] = useState<SecaoAtiva>({ tipo: 'todos' });

  const caminhoes = useMemo(
    () => lerCaminhoes().filter((c) => c.ativo !== false),
    []
  );

  const caminhaoSelecionado =
    secao.tipo === 'caminhao'
      ? caminhoes.find((c) => String(c.id) === secao.caminhaoId)
      : undefined;

  const getItemClass = (ativo: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
      ativo
        ? 'bg-amber-500 text-zinc-950 font-semibold'
        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
    }`;

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Menu Lateral da Aba Abastecimento */}
      <aside className="w-full md:w-64 shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-3 flex flex-col gap-5">
        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Geral
          </span>
          <nav className="mt-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setSecao({ tipo: 'todos' })}
              className={getItemClass(secao.tipo === 'todos')}
            >
              <Fuel className="w-4 h-4 shrink-0" />
              <span className="truncate">Todos os Abastecimentos</span>
            </button>

            <button
              type="button"
              onClick={() => setSecao({ tipo: 'arquivados' })}
              className={getItemClass(secao.tipo === 'arquivados')}
            >
              <Archive className="w-4 h-4 shrink-0" />
              <span className="truncate">Arquivados</span>
            </button>

            <button
              type="button"
              onClick={() => setSecao({ tipo: 'sem-abastecimento' })}
              className={getItemClass(secao.tipo === 'sem-abastecimento')}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">Viagens Sem Abastecimentos</span>
            </button>
          </nav>
        </div>

        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Por Caminhão ({caminhoes.length})
          </span>
          <nav className="mt-2 flex flex-col gap-1">
            {caminhoes.length === 0 ? (
              <span className="px-3 py-2 text-xs text-zinc-500">
                Nenhum caminhão cadastrado
              </span>
            ) : (
              caminhoes.map((caminhao, index) => {
                const idStr = String(caminhao.id);
                const ativo =
                  secao.tipo === 'caminhao' && secao.caminhaoId === idStr;
                const rotulo =
                  caminhao.nome ||
                  caminhao.apelido ||
                  `Caminhão Cadastrado ${index + 1}`;

                return (
                  <button
                    key={idStr}
                    type="button"
                    onClick={() =>
                      setSecao({ tipo: 'caminhao', caminhaoId: idStr })
                    }
                    className={getItemClass(ativo)}
                  >
                    <Truck className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {rotulo}
                      {caminhao.placa ? ` (${caminhao.placa})` : ''}
                    </span>
                  </button>
                );
              })
            )}
          </nav>
        </div>
      </aside>

      {/* Área de Conteúdo da Seção */}
      <div className="flex-1 w-full">
        {secao.tipo === 'todos' && <TodosAbastecimentos />}
        {secao.tipo === 'arquivados' && <AbastecimentosArquivados />}
        {secao.tipo === 'sem-abastecimento' && <ViagensSemAbastecimentos />}
        {secao.tipo === 'caminhao' && (
          <AbastecimentosCaminhao
            caminhaoId={secao.caminhaoId}
            nome={caminhaoSelecionado?.nome || caminhaoSelecionado?.apelido}
            placa={caminhaoSelecionado?.placa}
          />
        )}
      </div>
    </div>
  );
}