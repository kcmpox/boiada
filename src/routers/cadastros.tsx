import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import {
  Database,
  Truck,
  UserCheck,
  Milestone,
  Factory,
  Handshake,
  ChevronRight,
} from 'lucide-react';
import { rootRoute } from './root';
import {
  listarMotoristas,
  salvarMotoristas,
  listarCaminhoes,
  salvarCaminhoes,
  listarPedagios,
  salvarPedagios,
  listarFrigorificos,
  salvarFrigorificos,
  listarIntermediarios,
  salvarIntermediarios,
  type Motorista,
  type Caminhao,
  type Pedagio,
  type Frigorifico,
  type Intermediario,
} from '../storage/cadastrosStorage';
import { SecaoMotoristas } from '../components/cadastros/SecaoMotoristas';
import { SecaoCaminhoes } from '../components/cadastros/SecaoCaminhoes';
import { SecaoPedagios } from '../components/cadastros/SecaoPedagios';
import { SecaoFrigorificos } from '../components/cadastros/SecaoFrigorificos';
import { SecaoIntermediarios } from '../components/cadastros/SecaoIntermediarios';

type CategoriaCadastroId =
  | 'caminhoes'
  | 'motoristas'
  | 'pedagios'
  | 'frigorificos'
  | 'intermediarios';

interface CategoriaCadastro {
  id: CategoriaCadastroId;
  titulo: string;
  subtitulo: string;
  descricaoArea: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIAS: CategoriaCadastro[] = [
  {
    id: 'caminhoes',
    titulo: 'Caminhões',
    subtitulo: 'Veículos, placas e motoristas',
    descricaoArea: 'Gerencie os caminhões boiadeiros da frota da Bacchiega Transporte.',
    icon: Truck,
  },
  {
    id: 'motoristas',
    titulo: 'Motoristas',
    subtitulo: 'Equipe e ajuda de custo mensal',
    descricaoArea: 'Controle a equipe de motoristas responsáveis pelas viagens e suas ajudas de custo.',
    icon: UserCheck,
  },
  {
    id: 'pedagios',
    titulo: 'Pedágios',
    subtitulo: 'Praças, rodovias e coordenadas',
    descricaoArea: 'Cadastre as praças de pedágio recorrentes nas rotas com rodovia, direção e coordenadas.',
    icon: Milestone,
  },
  {
    id: 'frigorificos',
    titulo: 'Frigoríficos',
    subtitulo: 'Unidades e destinos de abate',
    descricaoArea: 'Registre os frigoríficos (ex: Marfrig) e unidades de destino.',
    icon: Factory,
  },
  {
    id: 'intermediarios',
    titulo: 'Intermediários',
    subtitulo: 'Transportadoras e agenciadoras',
    descricaoArea: 'Gerencie as empresas contratantes (ex: Trader Transporte) que repassam os fretes.',
    icon: Handshake,
  },
];

function CadastrosPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaCadastroId>('caminhoes');
  const [motoristas, setMotoristas] = useState<Motorista[]>(() => listarMotoristas());
  const [caminhoes, setCaminhoes] = useState<Caminhao[]>(() => listarCaminhoes());
  const [pedagios, setPedagios] = useState<Pedagio[]>(() => listarPedagios());
  const [frigorificos, setFrigorificos] = useState<Frigorifico[]>(() =>
    listarFrigorificos()
  );
  const [intermediarios, setIntermediarios] = useState<Intermediario[]>(() =>
    listarIntermediarios()
  );

  const handleAtualizarMotoristas = (novaLista: Motorista[]) => {
    setMotoristas(novaLista);
    salvarMotoristas(novaLista);
  };

  const handleAtualizarCaminhoes = (novaLista: Caminhao[]) => {
    setCaminhoes(novaLista);
    salvarCaminhoes(novaLista);
  };

  const handleAtualizarPedagios = (novaLista: Pedagio[]) => {
    setPedagios(novaLista);
    salvarPedagios(novaLista);
  };

  const handleAtualizarFrigorificos = (novaLista: Frigorifico[]) => {
    setFrigorificos(novaLista);
    salvarFrigorificos(novaLista);
  };

  const handleAtualizarIntermediarios = (novaLista: Intermediario[]) => {
    setIntermediarios(novaLista);
    salvarIntermediarios(novaLista);
  };

  const itemAtual =
    CATEGORIAS.find((cat) => cat.id === categoriaAtiva) || CATEGORIAS[0];
  const IconeAtual = itemAtual.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cadastros
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie caminhões, motoristas, pedágios, frigoríficos e intermediários.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 xl:col-span-3 space-y-2">
          {CATEGORIAS.map((cat) => {
            const Icon = cat.icon;
            const ativa = categoriaAtiva === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  ativa
                    ? 'bg-white dark:bg-slate-900 border-brand-500 ring-1 ring-brand-500/30 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      ativa
                        ? 'bg-brand-500 text-brand-contrast shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-semibold truncate ${
                        ativa
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cat.titulo}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {cat.subtitulo}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    ativa
                      ? 'text-brand-600 dark:text-brand-400 translate-x-0.5'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              </button>
            );
          })}
        </aside>

        <section className="lg:col-span-8 xl:col-span-9 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <IconeAtual className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {itemAtual.titulo}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {itemAtual.descricaoArea}
              </p>
            </div>
          </div>

          {categoriaAtiva === 'motoristas' && (
            <SecaoMotoristas
              motoristas={motoristas}
              onAtualizar={handleAtualizarMotoristas}
            />
          )}

          {categoriaAtiva === 'caminhoes' && (
            <SecaoCaminhoes
              caminhoes={caminhoes}
              motoristas={motoristas}
              onAtualizar={handleAtualizarCaminhoes}
            />
          )}

          {categoriaAtiva === 'pedagios' && (
            <SecaoPedagios
              pedagios={pedagios}
              onAtualizar={handleAtualizarPedagios}
            />
          )}

          {categoriaAtiva === 'frigorificos' && (
            <SecaoFrigorificos
              frigorificos={frigorificos}
              onAtualizar={handleAtualizarFrigorificos}
            />
          )}

          {categoriaAtiva === 'intermediarios' && (
            <SecaoIntermediarios
              intermediarios={intermediarios}
              onAtualizar={handleAtualizarIntermediarios}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export const cadastrosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cadastros',
  component: CadastrosPage,
});