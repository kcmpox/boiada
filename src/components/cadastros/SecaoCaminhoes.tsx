import { useState } from 'react';
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  User,
  Code2,
} from 'lucide-react';
import type { Caminhao, Motorista } from '../../storage/cadastrosStorage';
import {
  ModalEditarCaminhao,
} from './CadastrosModals';
import { ModalEditarJsonCadastro } from '../json_editor/ModalEditarJsonCadastro';
import { useDevMode } from '../../context/DevModeContext';
export function SecaoCaminhoes({
  caminhoes,
  motoristas,
  onAtualizar,
}: {
  caminhoes: Caminhao[];
  motoristas: Motorista[];
  onAtualizar: (novaLista: Caminhao[]) => void;
}) {
  const { devMode } = useDevMode();
  const [nome, setNome] = useState('');
  const [placa, setPlaca] = useState('');
  const [motoristaId, setMotoristaId] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [caminhaoEmEdicao, setCaminhaoEmEdicao] = useState<Caminhao | null>(null);
  const [caminhaoJsonEmEdicao, setCaminhaoJsonEmEdicao] = useState<Caminhao | null>(null);

  const motoristasAtivos = motoristas.filter((m) => m.ativo);

  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !placa.trim()) return;

    const novo: Caminhao = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      placa: placa.trim().toUpperCase(),
      motoristaId,
      ativo,
    };

    onAtualizar([novo, ...caminhoes]);
    setNome('');
    setPlaca('');
    setMotoristaId('');
    setAtivo(true);
  };

  const handleSalvarEdicao = (atualizado: Caminhao) => {
    onAtualizar(
      caminhoes.map((c) => (c.id === atualizado.id ? atualizado : c))
    );
    setCaminhaoEmEdicao(null);
    setCaminhaoJsonEmEdicao(null);
  };

  const excluirCaminhao = (id: string) => {
    onAtualizar(caminhoes.filter((c) => c.id !== id));
  };

  const obterNomeMotorista = (id: string) => {
    if (!id) return 'Sem motorista vinculado';
    const encontrado = motoristas.find((m) => m.id === id);
    return encontrado ? encontrado.nome : 'Motorista removido';
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleAdicionar}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome / Apelido do Caminhão *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mercedes-Benz / Volvo Branco"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Placa *
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="ABC-1D23"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              className="w-full h-10 px-3.5 rounded-lg text-sm font-mono uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Motorista Vinculado
            </label>
            <select
              value={motoristaId}
              onChange={(e) => setMotoristaId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Sem motorista vinculado</option>
              {motoristasAtivos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
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
            Adicionar Caminhão
          </button>
        </div>
      </form>

      {caminhoes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum caminhão cadastrado ainda. Utilize o formulário acima para adicionar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {caminhoes.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {c.nome}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                        c.ativo
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {c.placa}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3 shrink-0" />
                      {obterNomeMotorista(c.motoristaId)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {devMode && (
                  <button
                    type="button"
                    onClick={() => setCaminhaoJsonEmEdicao(c)}
                    title="Editar JSON (DevMode)"
                    className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCaminhaoEmEdicao(c)}
                  title="Editar caminhão"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => excluirCaminhao(c.id)}
                  title="Excluir caminhão"
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {caminhaoEmEdicao && (
        <ModalEditarCaminhao
          caminhao={caminhaoEmEdicao}
          motoristas={motoristas}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setCaminhaoEmEdicao(null)}
        />
      )}

      {caminhaoJsonEmEdicao && (
        <ModalEditarJsonCadastro
          tipo="caminhao"
          registro={caminhaoJsonEmEdicao}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setCaminhaoJsonEmEdicao(null)}
        />
      )}
    </div>
  );
}