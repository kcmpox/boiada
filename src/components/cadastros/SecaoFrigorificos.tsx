import { useState } from 'react';
import {
  Factory,
  Plus,
  Pencil,
  Trash2,
  Phone,
  User,
  Code2,
  MapPin,
  FileText,
  Table2,
  History,
} from 'lucide-react';
import type { Frigorifico } from '../../storage/cadastrosStorage';
import type { TipoEntidadeTabela } from '../../storage/tabelasPrecoStorage';
import {
  ModalEditarFrigorifico,
  UFS_BRASIL,
} from './CadastrosModals';
import { ModalEditarJsonCadastro } from '../json_editor/ModalEditarJsonCadastro';
import { ModalTabelaPrecos } from './tabelas/ModalTabelaPrecos';
import { ModalHistoricoTabelas } from './tabelas/ModalHistoricoTabelas';
import { formatarTelefone } from '../../utils/formatters';
import { useDevMode } from '../../context/DevModeContext';

interface AlvoTabelaModal {
  tipo: TipoEntidadeTabela;
  id: string;
  nome: string;
}

export function SecaoFrigorificos({
  frigorificos,
  onAtualizar,
}: {
  frigorificos: Frigorifico[];
  onAtualizar: (novaLista: Frigorifico[]) => void;
}) {
  const { devMode } = useDevMode();
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('SP');
  const [telefone, setTelefone] = useState('');
  const [contato, setContato] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [frigorificoEmEdicao, setFrigorificoEmEdicao] = useState<Frigorifico | null>(null);
  const [frigorificoJsonEmEdicao, setFrigorificoJsonEmEdicao] = useState<Frigorifico | null>(null);
  const [tabelaAberta, setTabelaAberta] = useState<AlvoTabelaModal | null>(null);
  const [historicoAberto, setHistoricoAberto] = useState<AlvoTabelaModal | null>(null);

  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const novo: Frigorifico = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      cidade: cidade.trim(),
      uf: uf.trim().toUpperCase(),
      telefone: telefone.trim(),
      contato: contato.trim(),
      observacoes: observacoes.trim(),
    };

    onAtualizar([novo, ...frigorificos]);
    setNome('');
    setCidade('');
    setUf('SP');
    setTelefone('');
    setContato('');
    setObservacoes('');
  };

  const handleSalvarEdicao = (atualizado: Frigorifico) => {
    onAtualizar(
      frigorificos.map((f) => (f.id === atualizado.id ? atualizado : f))
    );
    setFrigorificoEmEdicao(null);
    setFrigorificoJsonEmEdicao(null);
  };

  const excluirFrigorifico = (id: string) => {
    onAtualizar(frigorificos.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleAdicionar}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Frigorífico *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Marfrig - Unidade Promissão"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cidade
            </label>
            <input
              type="text"
              placeholder="Ex: Promissão"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              UF
            </label>
            <select
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              {UFS_BRASIL.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Telefone
            </label>
            <input
              type="tel"
              placeholder="(14) 3541-0000"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Contato
            </label>
            <input
              type="text"
              placeholder="Nome do responsável / setor"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observações
            </label>
            <input
              type="text"
              placeholder="Horário de desembarque, portaria, etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Frigorífico
          </button>
        </div>
      </form>

      {frigorificos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum frigorífico cadastrado ainda. Utilize o formulário acima para adicionar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {frigorificos.map((f) => (
            <div
              key={f.id}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 p-4 flex items-start justify-between gap-3 shadow-xs transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
                  <Factory className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {f.nome}
                  </div>
                  {(f.cidade || f.uf) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {[f.cidade, f.uf].filter(Boolean).join(' - ')}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {f.telefone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        {f.telefone}
                      </span>
                    )}
                    {f.contato && (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3 shrink-0" />
                        {f.contato}
                      </span>
                    )}
                  </div>
                  {f.observacoes && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{f.observacoes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() =>
                      setTabelaAberta({
                        tipo: 'frigorifico',
                        id: f.id,
                        nome: f.nome,
                      })
                    }
                    title="Ver Tabela de Preços"
                    aria-label="Ver Tabela de Preços"
                    className="p-2 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors cursor-pointer"
                  >
                    <Table2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setHistoricoAberto({
                        tipo: 'frigorifico',
                        id: f.id,
                        nome: f.nome,
                      })
                    }
                    title="Histórico de Tabelas"
                    aria-label="Histórico de Tabelas"
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>

                {devMode && (
                  <button
                    type="button"
                    onClick={() => setFrigorificoJsonEmEdicao(f)}
                    title="Editar JSON (DevMode)"
                    className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFrigorificoEmEdicao(f)}
                  title="Editar frigorífico"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => excluirFrigorifico(f.id)}
                  title="Excluir frigorífico"
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {frigorificoEmEdicao && (
        <ModalEditarFrigorifico
          frigorifico={frigorificoEmEdicao}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setFrigorificoEmEdicao(null)}
        />
      )}

      {frigorificoJsonEmEdicao && (
        <ModalEditarJsonCadastro
          tipo="frigorifico"
          registro={frigorificoJsonEmEdicao}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setFrigorificoJsonEmEdicao(null)}
        />
      )}

      {tabelaAberta && (
        <ModalTabelaPrecos
          entidadeTipo={tabelaAberta.tipo}
          entidadeId={tabelaAberta.id}
          entidadeNome={tabelaAberta.nome}
          onFechar={() => setTabelaAberta(null)}
        />
      )}

      {historicoAberto && (
        <ModalHistoricoTabelas
          entidadeTipo={historicoAberto.tipo}
          entidadeId={historicoAberto.id}
          entidadeNome={historicoAberto.nome}
          onFechar={() => setHistoricoAberto(null)}
        />
      )}
    </div>
  );
}