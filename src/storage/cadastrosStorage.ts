export interface Motorista {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  ajudaCustoMensal?: number; // Valor fixo mensal pago para despesas da estrada
}

export interface Caminhao {
  id: string;
  nome: string;
  placa: string;
  motoristaId: string;
  ativo: boolean;
}

export type DirecaoPedagio = 'N' | 'S' | 'L' | 'O' | 'N/S' | 'L/O';

export interface Pedagio {
  id: string;
  nome: string;
  rodovia: string;
  km: number;
  cidade: string;
  direcao: DirecaoPedagio;
  latitude: number | null;
  longitude: number | null;
}

export interface Frigorifico {
  id: string;
  nome: string;
  cidade: string;
  uf: string;
  telefone: string;
  contato: string;
  observacoes: string;
}

export interface Intermediario {
  id: string;
  nome: string;
  cidade: string;
  uf: string;
  telefone: string;
  contato: string;
  contatosFinanceiros: string;
  outrosContatos: string;
  observacoes: string;
  ativo: boolean;
}

const KEYS = {
  MOTORISTAS: 'bt_cad_motoristas',
  CAMINHOES: 'bt_cad_caminhoes',
  PEDAGIOS: 'bt_cad_pedagios',
  FRIGORIFICOS: 'bt_cad_frigorificos',
  INTERMEDIARIOS: 'bt_cad_intermediarios',
} as const;

export function listarMotoristas(): Motorista[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.MOTORISTAS) || '[]');
    return Array.isArray(raw)
      ? raw.map((m: Partial<Motorista>) => ({
          id: m.id || crypto.randomUUID(),
          nome: m.nome || '',
          telefone: m.telefone || '',
          ativo: m.ativo ?? true,
          ajudaCustoMensal: Number(m.ajudaCustoMensal) || 0,
        }))
      : [];
  } catch {
    return [];
  }
}

export function salvarMotoristas(lista: Motorista[]): void {
  localStorage.setItem(KEYS.MOTORISTAS, JSON.stringify(lista));
}

export function listarCaminhoes(): Caminhao[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.CAMINHOES) || '[]');
  } catch {
    return [];
  }
}

export function salvarCaminhoes(lista: Caminhao[]): void {
  localStorage.setItem(KEYS.CAMINHOES, JSON.stringify(lista));
}

export function listarPedagios(): Pedagio[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.PEDAGIOS) || '[]');
    return Array.isArray(raw)
      ? raw.map((p: Partial<Pedagio>) => ({
          id: p.id || crypto.randomUUID(),
          nome: p.nome || '',
          rodovia: p.rodovia || '',
          km: Number(p.km) || 0,
          cidade: p.cidade || '',
          direcao: (p.direcao as DirecaoPedagio) || 'N/S',
          latitude:
            p.latitude !== null && p.latitude !== undefined && p.latitude !== ('' as unknown)
              ? Number(p.latitude)
              : null,
          longitude:
            p.longitude !== null && p.longitude !== undefined && p.longitude !== ('' as unknown)
              ? Number(p.longitude)
              : null,
        }))
      : [];
  } catch {
    return [];
  }
}

export function salvarPedagios(lista: Pedagio[]): void {
  localStorage.setItem(KEYS.PEDAGIOS, JSON.stringify(lista));
}

export function listarFrigorificos(): Frigorifico[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.FRIGORIFICOS) || '[]');
  } catch {
    return [];
  }
}

export function salvarFrigorificos(lista: Frigorifico[]): void {
  localStorage.setItem(KEYS.FRIGORIFICOS, JSON.stringify(lista));
}

export function listarIntermediarios(): Intermediario[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.INTERMEDIARIOS) || '[]');
  } catch {
    return [];
  }
}

export function salvarIntermediarios(lista: Intermediario[]): void {
  localStorage.setItem(KEYS.INTERMEDIARIOS, JSON.stringify(lista));
}