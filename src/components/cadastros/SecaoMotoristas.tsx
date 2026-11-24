import { useState } from 'react';
import {
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Code2,
  Wallet,
} from 'lucide-react';
import type { Motorista } from '../../storage/cadastrosStorage';
import {
  ModalEditarMotorista,
  ModalAjudaCustoMotorista,
  ModalEditarJson,
} from '../CadastrosModals';
import { formatarTelefone } from '../../utils/formatters';
import { useDevMode } from '../../context/DevModeContext';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function SecaoMotoristas({
  motoristas,
  onAtualizar,
}: {
  motoristas: Motorista[];
  onAtualizar: (novaLista: Motorista[]) => void;
}) {
  const { devMode } = useDevMode();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [motoristaEmEdicao, setMotoristaEmEdicao] = useState<Motorista | null>(null);
  const [motoristaAjudaCusto, setMotoristaAjudaCusto] = useState<Motorista | null>(null);
  const [motoristaJsonEmEdicao, setMotoristaJsonEmEdicao] = useState<Motorista | null>(null);

  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const novo: Motorista = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      telefone: telefone.trim(),
      ativo,
      ajudaCustoMensal: 0,
    };

    onAtualizar([novo, ...motoristas]);
    setNome('');
    setTelefone('');
    setAtivo(true);
  };

  const handleSalvarEdicao = (atualizado: Motorista) => {
    onAtualizar(
      motoristas.map((m) => (m.id === atualizado.id ? atualizado : m))
    );
    setMotoristaEmEdicao(null);
    setMotoristaAjudaCusto(null);
    setMotoristaJsonEmEdicao(null);
  };

  const excluirMotorista = (id: string) => {
    onAtualizar(motoristas.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleAdicionar}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Motorista *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: João da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Telefone
            </label>
            <input
              type="tel"
              placeholder="(18) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Status
            </label>
            <select
              value={ativo ? 'ativo' : 'inativo'}
              onChange={(e) => setAtivo(e.target.value === 'ativo')}
              className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Motorista
          </button>
        </div>
      </form>

      {motoristas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum motorista cadastrado ainda. Utilize o formulário acima para adicionar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {motoristas.map((m) => (
            <div
              key={m.id}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 p-4 flex items-center justify-between gap-3 shadow-xs transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {m.nome}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                        m.ativo
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {m.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 shrink-0" />
                      {m.telefone || 'Sem telefone informado'}
                    </span>
                    {m.ajudaCustoMensal !== undefined && m.ajudaCustoMensal > 0 && (
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-brand-600 dark:text-brand-400">
                        <Wallet className="w-3 h-3 shrink-0" />
                        Ajuda: {formatarMoeda(m.ajudaCustoMensal)}/mês
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setMotoristaAjudaCusto(m)}
                  title="Definir Ajuda de Custo Mensal"
                  aria-label="Definir Ajuda de Custo Mensal"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                </button>

                {devMode && (
                  <button
                    type="button"
                    onClick={() => setMotoristaJsonEmEdicao(m)}
                    title="Editar JSON (DevMode)"
                    className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMotoristaEmEdicao(m)}
                  title="Editar motorista"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => excluirMotorista(m.id)}
                  title="Excluir motorista"
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {motoristaEmEdicao && (
        <ModalEditarMotorista
          motorista={motoristaEmEdicao}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setMotoristaEmEdicao(null)}
        />
      )}

      {motoristaAjudaCusto && (
        <ModalAjudaCustoMotorista
          motorista={motoristaAjudaCusto}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setMotoristaAjudaCusto(null)}
        />
      )}

      {motoristaJsonEmEdicao && (
        <ModalEditarJson
          titulo={`JSON • ${motoristaJsonEmEdicao.nome}`}
          registro={motoristaJsonEmEdicao}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setMotoristaJsonEmEdicao(null)}
        />
      )}
    </div>
  );
}