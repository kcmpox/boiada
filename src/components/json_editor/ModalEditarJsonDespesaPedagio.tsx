import { useState, useEffect, useMemo } from 'react';
import { X, Code2, Check, Wand2, AlertCircle } from 'lucide-react';
import {
  type DespesaPedagio,
  salvarDespesaPedagioJson,
} from '../../storage/despesasPedagiosStorage';
import { listarCaminhoes } from '../../storage/cadastrosStorage';

interface ModalEditarJsonDespesaPedagioProps {
  passagem: DespesaPedagio | null;
  onFechar: () => void;
  onSalvo: () => void;
}

function formatarDataHoraBr(iso?: string): string {
  if (!iso) return '';
  const [dataParte, horaParte] = iso.split('T');
  const [ano, mes, dia] = (dataParte || '').split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}${horaParte ? ` ${horaParte.slice(0, 5)}` : ''}`;
}

export function ModalEditarJsonDespesaPedagio({
  passagem,
  onFechar,
  onSalvo,
}: ModalEditarJsonDespesaPedagioProps) {
  const [textoJson, setTextoJson] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!passagem) return;
    setTextoJson(JSON.stringify(passagem, null, 2));
    setErro('');
  }, [passagem]);

  useEffect(() => {
    if (!passagem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [passagem, onFechar]);

  const identificacaoLegivel = useMemo(() => {
    if (!passagem) return '';

    const caminhoes = listarCaminhoes();
    const caminhao = passagem.caminhaoId
      ? caminhoes.find((c) => String(c.id) === String(passagem.caminhaoId))
      : undefined;

    const dataFmt = formatarDataHoraBr(passagem.dataHora);
    const rotuloCaminhao = caminhao
      ? `${caminhao.nome}${caminhao.placa ? ` (${caminhao.placa})` : ''}`
      : '';
    const valorFmt =
      typeof passagem.valor === 'number'
        ? passagem.valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })
        : '';

    return [dataFmt, passagem.nomePedagio, rotuloCaminhao, valorFmt]
      .filter(Boolean)
      .join(' • ');
  }, [passagem]);

  if (!passagem) return null;

  const formatarJson = () => {
    try {
      const parsed = JSON.parse(textoJson);
      setTextoJson(JSON.stringify(parsed, null, 2));
      setErro('');
    } catch (e) {
      setErro(
        `JSON inválido: ${e instanceof Error ? e.message : 'erro de sintaxe'}`
      );
    }
  };

  const handleSalvar = () => {
    try {
      const parsed = JSON.parse(textoJson);

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setErro('O JSON precisa representar um objeto de passagem válido.');
        return;
      }

      if (!parsed.dataHora || !parsed.nomePedagio) {
        setErro('Os campos "dataHora" e "nomePedagio" são obrigatórios.');
        return;
      }

      if (typeof parsed.valor !== 'number' || Number.isNaN(parsed.valor)) {
        setErro('O campo "valor" precisa ser um número válido.');
        return;
      }

      salvarDespesaPedagioJson(passagem.id, parsed as DespesaPedagio);
      onSalvo();
      onFechar();
    } catch (e) {
      setErro(
        `Não foi possível salvar — JSON inválido: ${
          e instanceof Error ? e.message : 'verifique a sintaxe'
        }`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-json-pedagio"
    >
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="titulo-modal-json-pedagio"
                  className="text-base font-bold text-slate-900 dark:text-white truncate"
                >
                  Editar JSON da Passagem de Pedágio
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                  DevMode
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                {identificacaoLegivel ? (
                  <>
                    <strong className="font-semibold">
                      {identificacaoLegivel}
                    </strong>
                    <span className="text-slate-400 dark:text-slate-500">
                      {' '}
                      • ID:{' '}
                      <code className="font-mono text-[11px]">
                        {passagem.id}
                      </code>
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    ID: <code className="font-mono">{passagem.id}</code>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={formatarJson}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Formatar indentação do JSON"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Formatar
            </button>

            <button
              type="button"
              onClick={onFechar}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto">
          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <textarea
            value={textoJson}
            onChange={(e) => setTextoJson(e.target.value)}
            spellCheck={false}
            rows={18}
            className="w-full flex-1 font-mono text-xs leading-relaxed p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 resize-y"
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Salvar JSON
          </button>
        </div>
      </div>
    </div>
  );
}