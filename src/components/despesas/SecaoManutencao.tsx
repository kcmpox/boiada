import { useState, useEffect } from 'react';
import { Wrench, Archive, Truck } from 'lucide-react';
import * as cadastrosStorage from '../../storage/cadastrosStorage';
import { TodasManutencoes } from './manutencao/TodasManutencoes';
import { ManutencoesArquivadas } from './manutencao/ManutencoesArquivadas';
import { ManutencoesCaminhao } from './manutencao/ManutencoesCaminhao';

interface CaminhaoItem {
  id: string | number;
  nome?: string;
  apelido?: string;
  placa?: string;
  ativo?: boolean;
  status?: string;
}

type SecaoManutencaoAtiva =
  | { tipo: 'todas' }
  | { tipo: 'arquivadas' }
  | { tipo: 'caminhao'; caminhaoId: string };

function isCaminhao(item: unknown): item is CaminhaoItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    ('placa' in item || 'apelido' in item || 'nome' in item)
  );
}

function lerCaminhoes(): CaminhaoItem[] {
  const storage = cadastrosStorage as Record<string, unknown>;

  for (const valor of Object.values(storage)) {
    if (typeof valor === 'function' && valor.length === 0) {
      try {
        const res = valor();
        if (Array.isArray(res) && (res.length === 0 || isCaminhao(res[0]))) {
          if (res.length > 0 && 'placa' in res[0]) return res;
        }
        if (res && typeof res === 'object' && 'caminhoes' in res) {
          const lista = (res as { caminhoes?: unknown }).caminhoes;
          if (Array.isArray(lista)) return lista as CaminhaoItem[];
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
      if (Array.isArray(parsed) && parsed.length > 0 && 'placa' in parsed[0]) {
        return parsed;
      }
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.caminhoes)) {
        return parsed.caminhoes;
      }
    } catch {
      // Ignora chaves que não são JSON
    }
  }

  return [];
}

export function SecaoManutencao() {
  const [secao, setSecao] = useState<SecaoManutencaoAtiva>({ tipo: 'todas' });
  const [caminhoes, setCaminhoes] = useState<CaminhaoItem[]>([]);

  useEffect(() => {
    const carregar = () => {
      const todos = lerCaminhoes();
      const ativos = todos.filter(
        (c) => c.ativo !== false && c.status !== 'inativo'
      );
      setCaminhoes(ativos);
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
    `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer ${
      ativo
        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
    }`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Menu Lateral da Seção Manutenção */}
      <aside className="w-full lg:w-64 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3 flex flex-col gap-5">
        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Geral
          </span>
          <nav className="mt-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setSecao({ tipo: 'todas' })}
              className={getItemClass(secao.tipo === 'todas')}
            >
              <Wrench className="w-4 h-4 shrink-0" />
              <span className="truncate">Todas as Manutenções</span>
            </button>

            <button
              type="button"
              onClick={() => setSecao({ tipo: 'arquivadas' })}
              className={getItemClass(secao.tipo === 'arquivadas')}
            >
              <Archive className="w-4 h-4 shrink-0" />
              <span className="truncate">Arquivadas</span>
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

      {/* Área de Conteúdo da Subseção */}
      <div className="flex-1 w-full min-w-0">
        {secao.tipo === 'todas' && <TodasManutencoes />}
        {secao.tipo === 'arquivadas' && <ManutencoesArquivadas />}
        {secao.tipo === 'caminhao' && (
          <ManutencoesCaminhao
            caminhaoId={secao.caminhaoId}
            nome={caminhaoSelecionado?.nome || caminhaoSelecionado?.apelido}
            placa={caminhaoSelecionado?.placa}
          />
        )}
      </div>
    </div>
  );
}