import { useState } from 'react';
import {
  Milestone,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Code2,
  Compass,
  Navigation,
} from 'lucide-react';
import type { Pedagio, DirecaoPedagio } from '../../storage/cadastrosStorage';
import {
  ModalEditarPedagio,
  DIRECOES_PEDAGIO,
} from './CadastrosModals';
import { ModalEditarJsonCadastro } from '../json_editor/ModalEditarJsonCadastro';
import { useDevMode } from '../../context/DevModeContext';

export function SecaoPedagios({
  pedagios,
  onAtualizar,
}: {
  pedagios: Pedagio[];
  onAtualizar: (novaLista: Pedagio[]) => void;
}) {
  const { devMode } = useDevMode();
  const [nome, setNome] = useState('');
  const [rodovia, setRodovia] = useState('');
  const [km, setKm] = useState('');
  const [cidade, setCidade] = useState('');
  const [direcao, setDirecao] = useState<DirecaoPedagio>('N/S');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [pedagioEmEdicao, setPedagioEmEdicao] = useState<Pedagio | null>(null);
  const [pedagioJsonEmEdicao, setPedagioJsonEmEdicao] = useState<Pedagio | null>(null);

  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !rodovia.trim()) return;

    const kmNum = Number(km.trim().replace(',', '.'));
    const latNum = latitude.trim()
      ? Number(latitude.trim().replace(',', '.'))
      : null;
    const lngNum = longitude.trim()
      ? Number(longitude.trim().replace(',', '.'))
      : null;

    const novo: Pedagio = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      rodovia: rodovia.trim().toUpperCase(),
      km: !isNaN(kmNum) && kmNum >= 0 ? kmNum : 0,
      cidade: cidade.trim(),
      direcao,
      latitude: latNum !== null && !isNaN(latNum) ? latNum : null,
      longitude: lngNum !== null && !isNaN(lngNum) ? lngNum : null,
    };

    onAtualizar([novo, ...pedagios]);
    setNome('');
    setRodovia('');
    setKm('');
    setCidade('');
    setDirecao('N/S');
    setLatitude('');
    setLongitude('');
  };

  const handleSalvarEdicao = (atualizado: Pedagio) => {
    onAtualizar(
      pedagios.map((p) => (p.id === atualizado.id ? atualizado : p))
    );
    setPedagioEmEdicao(null);
    setPedagioJsonEmEdicao(null);
  };

  const excluirPedagio = (id: string) => {
    onAtualizar(pedagios.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleAdicionar}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Pedágio *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Praça Penápolis / Glicério"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Rodovia *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: SP-300"
              value={rodovia}
              onChange={(e) => setRodovia(e.target.value.toUpperCase())}
              className="w-full h-10 px-3.5 rounded-lg text-sm font-mono uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              KM
            </label>
            <input
              type="number"
              step="any"
              min={0}
              placeholder="Ex: 485.4"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Direção
            </label>
            <select
              value={direcao}
              onChange={(e) => setDirecao(e.target.value as DirecaoPedagio)}
              className="w-full h-10 px-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              {DIRECOES_PEDAGIO.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cidade
            </label>
            <input
              type="text"
              placeholder="Ex: Penápolis"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="Ex: -21.4198"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="Ex: -50.0775"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Pedágio
          </button>
        </div>
      </form>

      {pedagios.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum pedágio cadastrado ainda. Utilize o formulário acima para adicionar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {pedagios.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-start justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
                  <Milestone className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {p.nome}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                      <Compass className="w-3 h-3 text-brand-500" />
                      {p.direcao}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-mono font-semibold">
                      {p.rodovia} {p.km > 0 ? `• KM ${p.km}` : ''}
                    </span>
                    {p.cidade && (
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {p.cidade}
                      </span>
                    )}
                  </div>

                  {(p.latitude !== null || p.longitude !== null) && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                      <Navigation className="w-3 h-3 shrink-0 text-slate-400" />
                      <span>
                        {p.latitude !== null ? p.latitude : '—'},{' '}
                        {p.longitude !== null ? p.longitude : '—'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {devMode && (
                  <button
                    type="button"
                    onClick={() => setPedagioJsonEmEdicao(p)}
                    title="Editar JSON (DevMode)"
                    className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPedagioEmEdicao(p)}
                  title="Editar pedágio"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => excluirPedagio(p.id)}
                  title="Excluir pedágio"
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pedagioEmEdicao && (
        <ModalEditarPedagio
          pedagio={pedagioEmEdicao}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setPedagioEmEdicao(null)}
        />
      )}
	  
	  {pedagioJsonEmEdicao && (
        <ModalEditarJsonCadastro
          tipo="pedagio"
          registro={pedagioJsonEmEdicao}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setPedagioJsonEmEdicao(null)}
        />
      )}
    </div>
  );
}