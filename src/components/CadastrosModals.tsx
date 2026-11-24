import { useState } from 'react';
import { Pencil, X, Check, Code2, AlertCircle, Wallet } from 'lucide-react';
import type {
  Motorista,
  Caminhao,
  Pedagio,
  DirecaoPedagio,
  Frigorifico,
  Intermediario,
} from '../storage/cadastrosStorage';
import { formatarTelefone } from '../utils/formatters';

export const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const DIRECOES_PEDAGIO: { valor: DirecaoPedagio; label: string }[] = [
  { valor: 'N', label: 'N (Norte)' },
  { valor: 'S', label: 'S (Sul)' },
  { valor: 'L', label: 'L (Leste)' },
  { valor: 'O', label: 'O (Oeste)' },
  { valor: 'N/S', label: 'N/S (Norte / Sul)' },
  { valor: 'L/O', label: 'L/O (Leste / Oeste)' },
];

// ============================================================================
// POPUP: EDITAR MOTORISTA
// ============================================================================
export function ModalEditarMotorista({
  motorista,
  onSalvar,
  onFechar,
}: {
  motorista: Motorista;
  onSalvar: (motoristaAtualizado: Motorista) => void;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState(motorista.nome);
  const [telefone, setTelefone] = useState(motorista.telefone);
  const [ativo, setAtivo] = useState(motorista.ativo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSalvar({
      ...motorista,
      nome: nome.trim(),
      telefone: telefone.trim(),
      ativo,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Editar Motorista
            </h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Motorista *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
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

          <div>
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

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// POPUP: DEFINIR AJUDA DE CUSTO MENSAL DO MOTORISTA
// ============================================================================
export function ModalAjudaCustoMotorista({
  motorista,
  onSalvar,
  onFechar,
}: {
  motorista: Motorista;
  onSalvar: (motoristaAtualizado: Motorista) => void;
  onFechar: () => void;
}) {
  const [valor, setValor] = useState<string>(
    motorista.ajudaCustoMensal && motorista.ajudaCustoMensal > 0
      ? String(motorista.ajudaCustoMensal)
      : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(valor.trim().replace(',', '.'));
    onSalvar({
      ...motorista,
      ajudaCustoMensal: !isNaN(num) && num > 0 ? Number(num.toFixed(2)) : 0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ajuda de Custo Mensal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {motorista.nome}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Defina o valor fixo pago mensalmente a este motorista para ajudar nas
            despesas da estrada. Deixe em branco ou zero para remover.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Valor Fixo Mensal (R$)
            </label>
            <input
              type="number"
              step="any"
              min={0}
              autoFocus
              placeholder="Ex: 850.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Valor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// POPUP: EDITAR CAMINHÃO
// ============================================================================
export function ModalEditarCaminhao({
  caminhao,
  motoristas,
  onSalvar,
  onFechar,
}: {
  caminhao: Caminhao;
  motoristas: Motorista[];
  onSalvar: (caminhaoAtualizado: Caminhao) => void;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState(caminhao.nome);
  const [placa, setPlaca] = useState(caminhao.placa);
  const [motoristaId, setMotoristaId] = useState(caminhao.motoristaId);
  const [ativo, setAtivo] = useState(caminhao.ativo);

  const motoristasDisponiveis = motoristas.filter(
    (m) => m.ativo || m.id === caminhao.motoristaId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !placa.trim()) return;

    onSalvar({
      ...caminhao,
      nome: nome.trim(),
      placa: placa.trim().toUpperCase(),
      motoristaId,
      ativo,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Editar Caminhão
            </h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome / Apelido do Caminhão *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Placa *
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 rounded-lg text-sm font-mono uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Motorista Vinculado
            </label>
            <select
              value={motoristaId}
              onChange={(e) => setMotoristaId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Sem motorista vinculado</option>
              {motoristasDisponiveis.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} {!m.ativo ? '(Inativo)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// POPUP: EDITAR PEDÁGIO
// ============================================================================
export function ModalEditarPedagio({
  pedagio,
  onSalvar,
  onFechar,
}: {
  pedagio: Pedagio;
  onSalvar: (pedagioAtualizado: Pedagio) => void;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState(pedagio.nome);
  const [rodovia, setRodovia] = useState(pedagio.rodovia);
  const [km, setKm] = useState(pedagio.km ? String(pedagio.km) : '');
  const [cidade, setCidade] = useState(pedagio.cidade);
  const [direcao, setDirecao] = useState<DirecaoPedagio>(pedagio.direcao);
  const [latitude, setLatitude] = useState(
    pedagio.latitude !== null ? String(pedagio.latitude) : ''
  );
  const [longitude, setLongitude] = useState(
    pedagio.longitude !== null ? String(pedagio.longitude) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !rodovia.trim()) return;

    const kmNum = Number(km.trim().replace(',', '.'));
    const latNum = latitude.trim()
      ? Number(latitude.trim().replace(',', '.'))
      : null;
    const lngNum = longitude.trim()
      ? Number(longitude.trim().replace(',', '.'))
      : null;

    onSalvar({
      ...pedagio,
      nome: nome.trim(),
      rodovia: rodovia.trim().toUpperCase(),
      km: !isNaN(kmNum) && kmNum >= 0 ? kmNum : 0,
      cidade: cidade.trim(),
      direcao,
      latitude: latNum !== null && !isNaN(latNum) ? latNum : null,
      longitude: lngNum !== null && !isNaN(lngNum) ? lngNum : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Editar Pedágio
            </h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Pedágio *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Rodovia *
              </label>
              <input
                type="text"
                required
                value={rodovia}
                onChange={(e) => setRodovia(e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 rounded-lg text-sm font-mono uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                KM
              </label>
              <input
                type="number"
                step="any"
                min={0}
                value={km}
                onChange={(e) => setKm(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="col-span-4">
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cidade
            </label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="Ex: -21.4198"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="Ex: -50.0775"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// POPUP: EDITAR FRIGORÍFICO
// ============================================================================
export function ModalEditarFrigorifico({
  frigorifico,
  onSalvar,
  onFechar,
}: {
  frigorifico: Frigorifico;
  onSalvar: (frigorificoAtualizado: Frigorifico) => void;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState(frigorifico.nome);
  const [cidade, setCidade] = useState(frigorifico.cidade);
  const [uf, setUf] = useState(frigorifico.uf);
  const [telefone, setTelefone] = useState(frigorifico.telefone);
  const [contato, setContato] = useState(frigorifico.contato);
  const [observacoes, setObservacoes] = useState(frigorifico.observacoes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSalvar({
      ...frigorifico,
      nome: nome.trim(),
      cidade: cidade.trim(),
      uf: uf.trim().toUpperCase(),
      telefone: telefone.trim(),
      contato: contato.trim(),
      observacoes: observacoes.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Editar Frigorífico
            </h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do Frigorífico *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-9">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                UF
              </label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full h-10 px-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {UFS_BRASIL.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefone
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contato
              </label>
              <input
                type="text"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observações
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full p-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// POPUP: EDITAR INTERMEDIÁRIO
// ============================================================================
export function ModalEditarIntermediario({
  intermediario,
  onSalvar,
  onFechar,
}: {
  intermediario: Intermediario;
  onSalvar: (intermediarioAtualizado: Intermediario) => void;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState(intermediario.nome);
  const [cidade, setCidade] = useState(intermediario.cidade);
  const [uf, setUf] = useState(intermediario.uf);
  const [telefone, setTelefone] = useState(intermediario.telefone);
  const [contato, setContato] = useState(intermediario.contato);
  const [contatosFinanceiros, setContatosFinanceiros] = useState(
    intermediario.contatosFinanceiros
  );
  const [outrosContatos, setOutrosContatos] = useState(
    intermediario.outrosContatos
  );
  const [observacoes, setObservacoes] = useState(intermediario.observacoes);
  const [ativo, setAtivo] = useState(intermediario.ativo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSalvar({
      ...intermediario,
      nome: nome.trim(),
      cidade: cidade.trim(),
      uf: uf.trim().toUpperCase(),
      telefone: telefone.trim(),
      contato: contato.trim(),
      contatosFinanceiros: contatosFinanceiros.trim(),
      outrosContatos: outrosContatos.trim(),
      observacoes: observacoes.trim(),
      ativo,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Editar Intermediário
            </h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 sm:col-span-9">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome / Empresa *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="col-span-12 sm:col-span-3">
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

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-9">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                UF
              </label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full h-10 px-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {UFS_BRASIL.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefone
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contato Principal
              </label>
              <input
                type="text"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Contatos Financeiros (nome - telefone - email, um por linha)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Maria - (18) 99999-1111 - financeiro@trader.com.br"
              value={contatosFinanceiros}
              onChange={(e) => setContatosFinanceiros(e.target.value)}
              className="w-full p-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Outros Contatos
              </label>
              <textarea
                rows={2}
                value={outrosContatos}
                onChange={(e) => setOutrosContatos(e.target.value)}
                className="w-full p-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Observações
              </label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full p-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-y"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// POPUP: EDITAR JSON BRUTO (DEVMODE)
// ============================================================================
export function ModalEditarJson<T extends { id: string }>({
  titulo,
  registro,
  onSalvar,
  onFechar,
}: {
  titulo: string;
  registro: T;
  onSalvar: (registroAtualizado: T) => void;
  onFechar: () => void;
}) {
  const [jsonTexto, setJsonTexto] = useState(() =>
    JSON.stringify(registro, null, 2)
  );
  const [erroJson, setErroJson] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonTexto);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('O conteúdo precisa ser um objeto JSON válido.');
      }
      onSalvar({ ...parsed, id: parsed.id || registro.id });
    } catch (err) {
      setErroJson(
        err instanceof Error ? err.message : 'Sintaxe JSON inválida.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {titulo}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                DevMode • Edição direta no localStorage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <textarea
            rows={12}
            spellCheck={false}
            value={jsonTexto}
            onChange={(e) => {
              setJsonTexto(e.target.value);
              if (erroJson) setErroJson('');
            }}
            className="w-full p-3.5 rounded-xl text-xs font-mono bg-slate-950 text-emerald-400 border border-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 leading-relaxed"
          />

          {erroJson && (
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erroJson}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onFechar}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Aplicar JSON
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}