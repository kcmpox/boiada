export const CHAVES_BACKUP = [
  'bt_caminhoes',
  'bt_motoristas',
  'bt_pedagios',
  'bt_frigorificos',
  'bt_intermediarios',
  'bt_tabelas_preco',
  'bt_viagens',
  'bt_despesas_abastecimentos',
  'bt_manutencoes',
  'bt_pedagios_lancamentos',
  'bt_recebimentos',
  'bt_wallet',
  'bt_wallet_saldos_pagadores',
] as const;

export function exportarBackupJson(): string {
  const payload: Record<string, unknown> = {
    versao: 1,
    exportadoEm: new Date().toISOString(),
    dados: {},
  };

  const dados = payload.dados as Record<string, unknown>;

  for (const chave of CHAVES_BACKUP) {
    const bruto = localStorage.getItem(chave);
    if (bruto === null) continue;
    try {
      dados[chave] = JSON.parse(bruto);
    } catch {
      dados[chave] = bruto;
    }
  }

  return JSON.stringify(payload, null, 2);
}

export function importarBackupJson(jsonTexto: string): void {
  const parsed = JSON.parse(jsonTexto) as {
    dados?: Record<string, unknown>;
  };
  const dados = parsed?.dados && typeof parsed.dados === 'object'
    ? parsed.dados
    : (parsed as Record<string, unknown>);

  for (const chave of CHAVES_BACKUP) {
    if (!(chave in dados)) continue;
    const valor = dados[chave];
    if (valor === undefined) continue;
    localStorage.setItem(
      chave,
      typeof valor === 'string' ? valor : JSON.stringify(valor)
    );
  }

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('bt-recebimentos-updated'));
  window.dispatchEvent(new Event('bt-wallet-updated'));
}