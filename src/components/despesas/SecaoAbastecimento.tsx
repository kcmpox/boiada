import { useState, useEffect } from 'react';
import { Fuel, Archive, AlertCircle, Truck } from 'lucide-react';
import * as cadastrosStorage from '../../storage/cadastrosStorage';
import * as viagensStorage from '../../storage/viagensStorage';
import {
  lerAbastecimentos,
  lerViagensConfirmadasSemAbastecimento,
} from '../../storage/abastecimentosStorage';
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
  status?: string;
}

interface ViagemResumo {
  id: string | number;
  caminhaoId?: string | number;
  minuta?: string;
  numeroMinuta?: string;
  arquivada?: boolean;
}

type SecaoAbastecimentoAtiva =
  | { tipo: 'todos' }
  | { tipo: 'arquivados' }
  | { tipo: 'sem-abastecimento' }
  | { tipo: 'caminhao'; caminhaoId: string };

function isCaminhao(item: unknown): item is CaminhaoItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    ('placa' in item || 'apelido' in item || 'nome' in item)
  );
}

function extrairLista<T>(
  modulo: Record<string, unknown>,
  chavesObjeto: string[],
  validador: (item: unknown) => boolean
): T[] {
  for (const valor of Object.values(modulo)) {
    if (typeof valor === 'function' && valor.length === 0) {
      try {
        const res = valor();
        if (Array.isArray(res) && res.length > 0 && validador(res[0])) {
          return res as T[];
        }
        if (res && typeof res === 'object') {
          for (const chave of chavesObjeto) {
            const lista = (res as Record<string, unknown>)[chave];
            if (Array.isArray(lista)) return lista as T[];
          }
        }
      } catch {
        // Ignora funções que exigem argumentos
      }
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (!chave) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(chave) || '');
      if (Array.isArray(parsed) && parsed.length > 0 && validador(parsed[0])) {
        return parsed as T[];
      }
      if (parsed && typeof parsed === 'object') {
        for (const chaveObj of chavesObjeto) {
          const lista = (parsed as Record<string, unknown>)[chaveObj];
          if (Array.isArray(lista)) return lista as T[];
        }
      }
    } catch {
      // Ignora chaves que não são JSON
    }
  }

  return [];
}

function contarViagensSemAbastecimento(): number {
  const viagens = extrairLista<ViagemResumo>(
    viagensStorage as Record<string, unknown>,
    ['viagens'],
    (x) =>
      typeof x === 'object' &&
      x !== null &&
      'id' in x &&
      ('localEmbarque' in x || 'embarque' in x || 'tipoGado' in x)
  );

  const abastecimentos = lerAbastecimentos();
  const idsVinculados = new Set<string>();
  const minutasPorCaminhao = new Set<string>();

  for (const ab of abastecimentos) {
    if (ab.viagemId) {
      idsVinculados.add(String(ab.viagemId));
    }
    if (ab.minutaNumero && ab.caminhaoId) {
      minutasPorCaminhao.add(
        `${String(ab.caminhaoId)}::${ab.minutaNumero.trim().toLowerCase()}`
      );
    }
  }

  const confirmadas = lerViagensConfirmadasSemAbastecimento();
  let pendentes = 0;

  for (const v of viagens) {
    if (v.arquivada) continue;
    const idStr = String(v.id);
    if (idsVinculados.has(idStr)) continue;
    if (confirmadas.has(idStr)) continue;

    const minuta = (v.minuta || v.numeroMinuta || '').trim().toLowerCase();
    if (
      minuta &&
      v.caminhaoId &&
      minutasPorCaminhao.has(`${String(v.caminhaoId)}::${minuta}`)
    ) {
      continue;
    }

    pendentes += 1;
  }

  return pendentes;
}

export function SecaoAbastecimento() {
  const [secao, setSecao] = useState<SecaoAbastecimentoAtiva>({ tipo: 'todos' });
  const [caminhoes, setCaminhoes] = useState<CaminhaoItem[]>([]);
  const [qtdSemAbastecimento, setQtdSemAbastecimento] = useState(0);

  useEffect(() => {
    const carregar = () => {
      const todos = extrairLista<CaminhaoItem>(
        cadastrosStorage as Record<string, unknown>,
        ['caminhoes'],
        (x) => isCaminhao(x) && 'placa' in (x as object)
      );
      const ativos = todos.filter(
        (c) => c.ativo !== false && c.status !== 'inativo'
      );
      setCaminhoes(ativos);
      setQtdSemAbastecimento(contarViagensSemAbastecimento());
    };

    carregar();
    window.addEventListener('storage', carregar);
    return () => window.removeEventListener('storage', carregar);
  }, []);

  const caminhaoSelecionado =
    secao.tipo === 'caminhao'
      ? caminhoes.find((c) => String(c.id) === secao.caminhaoId)
      : undefined;

  const getItemClass = (ativo: boolean) =>
    `w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer ${
      ativo
        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
    }`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Menu Lateral da Seção Abastecimento */}
      <aside className="w-full lg:w-64 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3 flex flex-col gap-5">
        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Geral
          </span>
          <nav className="mt-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setSecao({ tipo: 'todos' })}
              className={getItemClass(secao.tipo === 'todos')}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Fuel className="w-4 h-4 shrink-0" />
                <span className="truncate">Todos os Abastecimentos</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSecao({ tipo: 'arquivados' })}
              className={getItemClass(secao.tipo === 'arquivados')}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Archive className="w-4 h-4 shrink-0" />
                <span className="truncate">Arquivados</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSecao({ tipo: 'sem-abastecimento' })}
              className={getItemClass(secao.tipo === 'sem-abastecimento')}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">Viagens Sem Abastecimentos</span>
              </span>
              {qtdSemAbastecimento > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  {qtdSemAbastecimento}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Por Caminhão ({caminhoes.length})
          </span>
          <nav className="mt-2 flex flex-col gap-1">
            {caminhoes.length === 0 ? (
              <span className="px-3 py-2 text-xs text-slate-500">
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
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Truck className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {rotulo}
                        {caminhao.placa ? ` (${caminhao.placa})` : ''}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </nav>
        </div>
      </aside>

      {/* Área de Conteúdo da Subseção */}
      <div className="flex-1 w-full min-w-0">
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