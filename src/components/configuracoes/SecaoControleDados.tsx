import { useRef, useState } from 'react';
import { Download, Upload, Check, AlertCircle, FolderSync } from 'lucide-react';
import {
  gerarPayloadBackup,
  importarPayloadBackup,
} from '../../storage/configuracoesStorage';

export function SecaoControleDados() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mensagem, setMensagem] = useState<{
    tipo: 'sucesso' | 'erro';
    texto: string;
  } | null>(null);

  const handleExportarDados = () => {
    try {
      const payload = gerarPayloadBackup();

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dataFormatada = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `bacchiega-backup-${dataFormatada}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMensagem({
        tipo: 'sucesso',
        texto: 'Backup exportado com sucesso!',
      });
    } catch {
      setMensagem({
        tipo: 'erro',
        texto: 'Não foi possível exportar os dados.',
      });
    }
  };

  const handleImportarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importarPayloadBackup(event.target?.result as string);

        setMensagem({
          tipo: 'sucesso',
          texto: 'Dados importados! Recarregando aplicação...',
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch {
        setMensagem({
          tipo: 'erro',
          texto: 'Arquivo inválido. Selecione um backup JSON válido do sistema.',
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(arquivo);
  };

  return (
    <div className="space-y-5">
      {/* Card: Backup do LocalStorage */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Backup e Restauração de Dados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Exporte todos os cadastros, viagens, despesas e configurações em um arquivo{' '}
            <code className="text-brand-600 dark:text-brand-400">.json</code> ou restaure uma
            cópia salva anteriormente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportarDados}
            className="h-9 px-4 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-brand-contrast shadow-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar Dados (.json)
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Importar Dados (.json)
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportarArquivo}
            className="hidden"
          />
        </div>

        {mensagem && (
          <div
            className={`flex items-center gap-2 text-xs font-medium px-3.5 py-2.5 rounded-lg border ${
              mensagem.tipo === 'sucesso'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
            }`}
          >
            {mensagem.tipo === 'sucesso' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{mensagem.texto}</span>
          </div>
        )}
      </div>

      {/* Placeholder para a Pasta de Fotos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3">
          <FolderSync className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Pasta Local de Imagens
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
          O vínculo com a pasta do PC (File System Access API) será conectado aqui.
        </p>
      </div>
    </div>
  );
}