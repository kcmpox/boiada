import {
  aplicarCorSistema,
  carregarCorSalva,
  type BrandColorId,
} from '../theme';

export const CHAVES_CONFIGURACOES = {
  ANOTACOES: 'bt_config_anotacoes',
  ULTIMO_BACKUP: 'bt_config_ultimo_backup',
} as const;

export interface BackupCompletoSistema {
  sistema: 'Bacchiega Transporte';
  dataExportacao: string;
  dados: Record<string, string>;
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
  const dadosExportados: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave && chave.startsWith('bt_')) {
      const valor = localStorage.getItem(chave);
      if (valor !== null) {
        dadosExportados[chave] = valor;
      }
    }
  }

  const agora = new Date().toISOString();
  localStorage.setItem(CHAVES_CONFIGURACOES.ULTIMO_BACKUP, agora);

  return {
    sistema: 'Bacchiega Transporte',
    dataExportacao: agora,
    dados: dadosExportados,
  };
}

export function importarPayloadBackup(conteudoBruto: string): number {
  const conteudo = JSON.parse(conteudoBruto);

  if (!conteudo || typeof conteudo.dados !== 'object' || Array.isArray(conteudo.dados)) {
    throw new Error('Formato de backup inválido.');
  }

  let chavesImportadas = 0;
  Object.entries(conteudo.dados).forEach(([chave, valor]) => {
    if (chave.startsWith('bt_') && typeof valor === 'string') {
      localStorage.setItem(chave, valor);
      chavesImportadas++;
    }
  });

  if (chavesImportadas === 0) {
    throw new Error('Nenhum registro válido com prefixo "bt_" foi encontrado no arquivo.');
  }

  return chavesImportadas;
}