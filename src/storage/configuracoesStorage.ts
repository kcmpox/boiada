import {
  aplicarCorSistema,
  carregarCorSalva,
  type BrandColorId,
} from '../theme';

export const CHAVES_CONFIGURACOES = {
  ANOTACOES: 'bt_config_anotacoes',
  ULTIMO_BACKUP: 'bt_config_ultimo_backup',
} as const;

export type ValorBackupItem =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export interface BackupCompletoSistema {
  sistema: 'Elmo.o Boiada';
  dataExportacao: string;
  dados: Record<string, ValorBackupItem>;
}

function tentarParseJson(valor: string): ValorBackupItem {
  const limpo = valor.trim();
  if (!limpo) return valor;

  const pareceJsonEstruturado =
    (limpo.startsWith('{') && limpo.endsWith('}')) ||
    (limpo.startsWith('[') && limpo.endsWith(']'));

  if (!pareceJsonEstruturado) {
    return valor;
  }

  try {
    const parsed = JSON.parse(limpo);
    if (parsed !== null && typeof parsed === 'object') {
      return parsed as ValorBackupItem;
    }
    return valor;
  } catch {
    return valor;
  }
}

function serializarParaLocalStorage(valor: unknown): string | null {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === 'string') return valor;
  return JSON.stringify(valor);
}

// ============================================================================
// APARÊNCIA
// ============================================================================
export function lerCorPrincipal(): BrandColorId {
  return carregarCorSalva();
}

export function salvarCorPrincipal(id: BrandColorId): BrandColorId {
  aplicarCorSistema(id);
  return id;
}

// ============================================================================
// ANOTAÇÕES
// ============================================================================
export function lerAnotacoes(): string {
  return localStorage.getItem(CHAVES_CONFIGURACOES.ANOTACOES) || '';
}

export function salvarAnotacoes(texto: string): void {
  localStorage.setItem(CHAVES_CONFIGURACOES.ANOTACOES, texto);
}

// ============================================================================
// CONTROLE DE DADOS (EXPORTAÇÃO / IMPORTAÇÃO)
// ============================================================================
export function lerDataUltimoBackup(): string | null {
  return localStorage.getItem(CHAVES_CONFIGURACOES.ULTIMO_BACKUP);
}

export function gerarPayloadBackup(): BackupCompletoSistema {
  const dadosExportados: Record<string, ValorBackupItem> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave && chave.startsWith('bt_')) {
      const valor = localStorage.getItem(chave);
      if (valor !== null) {
        dadosExportados[chave] = tentarParseJson(valor);
      }
    }
  }

  const agora = new Date().toISOString();
  localStorage.setItem(CHAVES_CONFIGURACOES.ULTIMO_BACKUP, agora);

  return {
    sistema: 'Elmo.o Boiada',
    dataExportacao: agora,
    dados: dadosExportados,
  };
}

export function importarPayloadBackup(conteudoBruto: string): number {
  const conteudo = JSON.parse(conteudoBruto);

  if (
    !conteudo ||
    typeof conteudo.dados !== 'object' ||
    Array.isArray(conteudo.dados)
  ) {
    throw new Error('Formato de backup inválido.');
  }

  let chavesImportadas = 0;
  Object.entries(conteudo.dados).forEach(([chave, valor]) => {
    if (!chave.startsWith('bt_')) return;
    const serializado = serializarParaLocalStorage(valor);
    if (serializado !== null) {
      localStorage.setItem(chave, serializado);
      chavesImportadas++;
    }
  });

  if (chavesImportadas === 0) {
    throw new Error(
      'Nenhum registro válido com prefixo "bt_" foi encontrado no arquivo.'
    );
  }

  return chavesImportadas;
}