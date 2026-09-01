import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export function FuelingAlternativeDialog({ onBack }: { onBack: () => void }) {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader className="items-center text-center">
        <DialogTitle>Novo layout de abastecimento</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <p className="text-muted-foreground">Este novo layout está em construção.</p>
        <label className="flex items-center gap-3 text-sm">
          Voltar ao layout antigo
          <Switch checked={false} onCheckedChange={onBack} aria-label="Voltar ao layout antigo" />
        </label>
      </div>
    </DialogContent>
  );
}
