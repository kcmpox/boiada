import { useState, useEffect, useMemo } from 'react';
import { Wallet, AlertTriangle, Briefcase, Building2 } from 'lucide-react';
import {
  listarFrigorificos,
  listarIntermediarios,
} from '../../storage/cadastrosStorage';
import { TodosRecebimentos } from './recebimentos/TodosRecebimentos';
import { DivergenciasPagadores } from './recebimentos/DivergenciasPagadores';

export interface PagadorRecebimentoItem {
  chave: string;
  tipo: 'intermediario' | 'frigorifico';
  id: string;
  nome: string;
}

type SecaoRecebimentoAtiva =
  | { tipo: 'todos' }
  | { tipo: 'divergencia'; pagadorChave: string };

function lerPagadoresCadastrados(): PagadorRecebimentoItem[] {
  const inters: PagadorRecebimentoItem[] = listarIntermediarios().map((i) => ({
    chave: `intermediario:${i.id}`,
    tipo: 'intermediario',
    id: String(i.id),
    nome: i.nome,
  }));

  const frigs: PagadorRecebimentoItem[] = listarFrigorificos().map((f) => ({
    chave: `frigorifico:${f.id}`,
    tipo: 'frigorifico',
    id: String(f.id),
    nome: f.nome,
  }));

  return [...inters, ...frigs];
}

export function SecaoRecebimentos() {
  const [secao, setSecao] = useState<SecaoRecebimentoAtiva>({ tipo: 'todos' });
  const [pagadores, setPagadores] = useState<PagadorRecebimentoItem[]>(() =>
    lerPagadoresCadastrados()
  );

  useEffect(() => {
    const carregar = () => setPagadores(lerPagadoresCadastrados());
    carregar();
    window.addEventListener('storage', carregar);
    return () => window.removeEventListener('storage', carregar);
  }, []);

  const pagadorSelecionado = useMemo(() => {
    if (secao.tipo !== 'divergencia') return undefined;
    return pagadores.find((p) => p.chave === secao.pagadorChave);
  }, [secao, pagadores]);

  const getItemClass = (ativo: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer ${
      ativo
        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
    }`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Menu Lateral da Seção Recebimentos */}
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
              <Wallet className="w-4 h-4 shrink-0" />
              <span className="truncate">Todos Recebimentos</span>
            </button>
          </nav>
        </div>

        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Divergências ({pagadores.length})</span>
          </span>
          <nav className="mt-2 flex flex-col gap-1">
            {pagadores.length === 0 ? (
              <span className="px-3 py-2 text-xs text-slate-500">
                Nenhum pagador cadastrado
              </span>
            ) : (
              pagadores.map((pagador) => {
                const ativo =
                  secao.tipo === 'divergencia' &&
                  secao.pagadorChave === pagador.chave;
                const Icone =
                  pagador.tipo === 'intermediario' ? Briefcase : Building2;

                return (
                  <button
                    key={pagador.chave}
                    type="button"
                    onClick={() =>
                      setSecao({
                        tipo: 'divergencia',
                        pagadorChave: pagador.chave,
                      })
                    }
                    className={getItemClass(ativo)}
                  >
                    <Icone className="w-4 h-4 shrink-0" />
                    <span className="truncate">{pagador.nome}</span>
                  </button>
                );
              })
            )}
          </nav>
        </div>
      </aside>

      {/* Área de Conteúdo */}
      <div className="flex-1 w-full min-w-0">
        {secao.tipo === 'todos' && <TodosRecebimentos />}
        {secao.tipo === 'divergencia' && (
          <DivergenciasPagadores
            pagadorChave={secao.pagadorChave}
            pagadorTipo={pagadorSelecionado?.tipo}
            pagadorId={pagadorSelecionado?.id}
            nomePagador={pagadorSelecionado?.nome}
          />
        )}
      </div>
    </div>
  );
}