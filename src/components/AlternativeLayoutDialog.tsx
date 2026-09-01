import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

export function AlternativeLayoutDialog({ open, title, onBack }: { open: boolean; title: string; onBack: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onBack()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-32 flex-col items-center justify-center gap-5 text-center">
          <p className="text-muted-foreground">Este novo layout está em construção.</p>
          <label className="flex items-center gap-2 text-sm">
            Voltar ao layout antigo
            <Switch checked={false} onCheckedChange={(checked) => checked && onBack()} aria-label="Voltar ao layout antigo" />
          </label>
        </div>
      </DialogContent>
    </Dialog>
  )
}
