export type BrandColorId = 'amber' | 'blue' | 'emerald' | 'red' | 'orange';

export interface BrandPalette {
  id: BrandColorId;
  nome: string;
  preview: string;
  vars: Record<string, string>;
}

export const PALETAS_CORES: BrandPalette[] = [
  {
    id: 'amber',
    nome: 'Âmbar (Padrão)',
    preview: '#f59e0b',
    vars: {
      '--brand-50': '#fffbeb',
      '--brand-100': '#fef3c7',
      '--brand-400': '#fbbf24',
      '--brand-500': '#f59e0b',
      '--brand-600': '#d97706',
      '--brand-800': '#92400e',
      '--brand-contrast': '#0f172a',
    },
  },
  {
    id: 'blue',
    nome: 'Azul Frota',
    preview: '#2563eb',
    vars: {
      '--brand-50': '#eff6ff',
      '--brand-100': '#dbeafe',
      '--brand-400': '#60a5fa',
      '--brand-500': '#2563eb',
      '--brand-600': '#1d4ed8',
      '--brand-800': '#1e40af',
      '--brand-contrast': '#ffffff',
    },
  },
  {
    id: 'emerald',
    nome: 'Verde Campo',
    preview: '#10b981',
    vars: {
      '--brand-50': '#ecfdf5',
      '--brand-100': '#d1fae5',
      '--brand-400': '#34d399',
      '--brand-500': '#10b981',
      '--brand-600': '#059669',
      '--brand-800': '#065f46',
      '--brand-contrast': '#0f172a',
    },
  },
  {
    id: 'red',
    nome: 'Vermelho Boiadeiro',
    preview: '#dc2626',
    vars: {
      '--brand-50': '#fef2f2',
      '--brand-100': '#fee2e2',
      '--brand-400': '#f87171',
      '--brand-500': '#dc2626',
      '--brand-600': '#b91c1c',
      '--brand-800': '#991b1b',
      '--brand-contrast': '#ffffff',
    },
  },
  {
    id: 'orange',
    nome: 'Laranja Estrada',
    preview: '#ea580c',
    vars: {
      '--brand-50': '#fff7ed',
      '--brand-100': '#ffedd5',
      '--brand-400': '#fb923c',
      '--brand-500': '#ea580c',
      '--brand-600': '#c2410c',
      '--brand-800': '#9a3412',
      '--brand-contrast': '#ffffff',
    },
  },
];

export function aplicarCorSistema(id: BrandColorId) {
  const paleta = PALETAS_CORES.find((p) => p.id === id) || PALETAS_CORES[0];
  const root = document.documentElement;

  Object.entries(paleta.vars).forEach(([chave, valor]) => {
    root.style.setProperty(chave, valor);
  });

  localStorage.setItem('bt_brand_color', paleta.id);
}

export function carregarCorSalva(): BrandColorId {
  const salva = localStorage.getItem('bt_brand_color') as BrandColorId | null;
  const valida = PALETAS_CORES.some((p) => p.id === salva) ? salva! : 'amber';
  aplicarCorSistema(valida);
  return valida;
}