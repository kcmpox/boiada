import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommissionsSection } from "@/components/sections/CommissionsSection";
import { AdjustmentsSection } from "@/components/sections/AdjustmentsSection";
import { Banknote as BanknoteIcon, Users as UsersIcon, Scale as ScaleIcon, History, Building2 } from "lucide-react";
import {
  usePayments,
  useActiveTrips,
  useFuelings,
  useExpenses,
  useTolls,
  useTrucks,
  useDrivers,
  useSettings,
  useOtherDeductionReimbursements,
  uid,
  formatBRL,
  formatDateBR,
  RENT_PERCENT,
  DESTINATION_LABELS,
  type Payment,
  type Trip,
  type Fueling,
  type Expense,
  type Toll,
  type Destination,
  type OtherDeductionReimbursement,
} from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AlternativeLayoutDialog } from "@/components/AlternativeLayoutDialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calendar, FileDown, Banknote, Code as Code2, Download, Upload, FileText, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  buildPdfDoc,
  previewPdf,
  pdfKpiRow,
  pdfSectionTitle,
  pdfTableLayout,
  PDF_COLORS,
  th,
} from "@/lib/pdf-theme";
import { fuelResponsibility } from "@/components/sections/FuelingsSection";
import { JsonEditorDialog } from "@/components/JsonEditorDialog";

export const Route = createFileRoute("/recebimentos")({
  head: () => ({
    meta: [
      { title: "Recebimentos — Boiada" },
      {
        name: "description",
        content: "Controle os recebimentos da frigorífico, viagens e descontos.",
      },
    ],
  }),
  component: ReceiptsPage,
});

type ReceiptSectionKey = "historico" | "bataguassu" | "cassilandia" | "outrosDescontos" | "outrosReembolsos";

const RECEIPT_NAV_ITEMS = [
  { key: "historico" as const, label: "Histórico", desc: "Todos os pagamentos", icon: History },
  { key: "bataguassu" as const, label: "Bataguassu", desc: "Incongruências do frigorífico", icon: Building2 },
  { key: "cassilandia" as const, label: "Cassilândia", desc: "Incongruências do frigorífico", icon: Building2 },
  { key: "outrosDescontos" as const, label: "Outros Descontos", desc: "Abatimentos adicionais", icon: ScaleIcon },
  { key: "outrosReembolsos" as const, label: "Outros Reembolsos", desc: "Reembolsos adicionais", icon: ScaleIcon },
];

function ReceiptsPage() {
  const [section, setSection] = useState<ReceiptSectionKey>("historico");
  const active = RECEIPT_NAV_ITEMS.find((item) => item.key === section)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recebimentos</h1>
          <p className="mt-1 text-muted-foreground">
            Acertos com a frigorífico: viagens, aluguel da carreta e despesas.
          </p>
        </div>
      </div>
  <Tabs defaultValue="recebimentos" className="space-y-6">
  <TabsList className="h-10"><TabsTrigger value="recebimentos" className="px-4"><BanknoteIcon className="mr-1.5 h-4 w-4" /> Recebimentos</TabsTrigger><TabsTrigger value="ajustes" className="px-4"><ScaleIcon className="mr-1.5 h-4 w-4" /> Ajustes</TabsTrigger><TabsTrigger value="comissoes" className="px-4"><UsersIcon className="mr-1.5 h-4 w-4" /> Comissões</TabsTrigger></TabsList>
  <TabsContent value="recebimentos">
  <div className="grid gap-6 md:grid-cols-[260px_1fr]">
  <nav className="md:sticky md:top-6 md:self-start">
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
            {RECEIPT_NAV_ITEMS.map((item) => { const Icon = item.icon; const isActive = section === item.key; return (
              <button key={item.key} onClick={() => setSection(item.key)} className={cn("group flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all md:min-w-0 md:flex-none", isActive ? "border-primary/30 bg-primary/5 shadow-sm" : "border-transparent hover:border-border hover:bg-muted/50")}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0"><span className={cn("block truncate text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>{item.label}</span><span className="hidden truncate text-xs text-muted-foreground md:block">{item.desc}</span></span>
              </button>
            ); })}
          </div>
        </nav>
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-2 md:hidden"><span className="text-sm font-medium text-muted-foreground">{active.desc}</span></div>
          {section === "historico" && <ReceiptsTab />}
          {section === "bataguassu" && <ConstructionNotice title="Bataguassu" />}
          {section === "cassilandia" && <ConstructionNotice title="Cassilândia" />}
          {section === "outrosDescontos" && <ConstructionNotice title="Outros Descontos" />}
          {section === "outrosReembolsos" && <ConstructionNotice title="Outros Reembolsos" />}
        </div>
      </div>
  </TabsContent>
  <TabsContent value="ajustes" className="space-y-6"><AdjustmentsSection /></TabsContent>
  <TabsContent value="comissoes" className="space-y-6"><CommissionsSection /></TabsContent>
  </Tabs>
    </div>
  );
}

function OtherDeductionsSection() {
  const [records, setRecords] = useOtherDeductionReimbursements();
  const [trucks] = useTrucks();
  const [trips] = useActiveTrips();
  const [fuelings] = useFuelings();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), truckId: "", destination: "bataguassu" as Destination, tripId: "", fuelingId: "", type: "acrescimo" as OtherDeductionReimbursement["type"], amount: "", description: "" });
  const reset = () => setForm({ date: new Date().toISOString().slice(0, 10), truckId: "", destination: "bataguassu", tripId: "", fuelingId: "", type: "acrescimo", amount: "", description: "" });
  const save = (event: React.FormEvent) => { event.preventDefault(); const amount = Number(form.amount); if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0) return toast.error("Informe um valor positivo e uma descrição."); setRecords((prev) => [{ id: uid(), date: form.date, truckId: form.truckId || undefined, destination: form.destination, tripId: form.tripId || undefined, fuelingId: form.fuelingId || undefined, type: form.type, amount, description: form.description.trim(), createdAt: new Date().toISOString() }, ...prev]); setOpen(false); reset(); toast.success("Registro salvo."); };
  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Outros Descontos & Reembolsos</h2><p className="text-sm text-muted-foreground">Registre valores acrescentados ou abatidos pelo frigorífico.</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo registro</Button></DialogTrigger><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Novo desconto ou reembolso</DialogTitle><DialogDescription>Relacione o valor ao recebimento quando aplicável.</DialogDescription></DialogHeader><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><div><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} /></div><div><Label>Tipo</Label><Select value={form.type} onValueChange={(value) => update("type", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="acrescimo">Acréscimo</SelectItem><SelectItem value="abatimento">Abatimento</SelectItem></SelectContent></Select></div><div><Label>Caminhão</Label><Select value={form.truckId} onValueChange={(value) => update("truckId", value)}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{trucks.map((truck) => <SelectItem key={truck.id} value={truck.id}>{truck.plate} — {truck.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Destino</Label><Select value={form.destination} onValueChange={(value) => update("destination", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bataguassu">Bataguassu</SelectItem><SelectItem value="cassilandia">Cassilândia</SelectItem></SelectContent></Select></div><div><Label>Viagem vinculada</Label><Select value={form.tripId} onValueChange={(value) => update("tripId", value)}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{trips.filter((trip) => !form.truckId || trip.truckId === form.truckId).map((trip) => <SelectItem key={trip.id} value={trip.id}>{formatDateBR(trip.date)} — {trip.minuta || trip.cte || trip.id.slice(0, 8)}</SelectItem>)}</SelectContent></Select></div><div><Label>Abastecimento vinculado</Label><Select value={form.fuelingId} onValueChange={(value) => update("fuelingId", value)}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{fuelings.filter((fueling) => !form.truckId || fueling.truckId === form.truckId).map((fueling) => <SelectItem key={fueling.id} value={fueling.id}>{formatDateBR(fueling.date)} — {fueling.id.slice(0, 8)}</SelectItem>)}</SelectContent></Select></div><div><Label>Valor</Label><Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => update("amount", e.target.value)} required /></div><div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Explique o motivo do acréscimo ou abatimento" required /></div><DialogFooter className="sm:col-span-2"><Button type="submit">Salvar registro</Button></DialogFooter></form></DialogContent></Dialog></div><Card><div className="divide-y divide-border">{records.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum desconto ou reembolso registrado.</p> : records.map((record) => <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{record.description}</p><p className="text-xs text-muted-foreground">{formatDateBR(record.date)} • {DESTINATION_LABELS[record.destination]}{record.tripId ? " • viagem vinculada" : ""}{record.fuelingId ? " • abastecimento vinculado" : ""}</p></div><Badge variant={record.type === "acrescimo" ? "default" : "destructive"}>{record.type === "acrescimo" ? "+" : "-"} {formatBRL(record.amount)}</Badge></div>)}</div></Card></div>;
}

function ConstructionNotice({ title }: { title: string }) {
  return (
    <Card className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
      <Building2 className="h-10 w-10 text-muted-foreground" />
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-muted-foreground">Esta página está em construção.</p>
      </div>
    </Card>
  );
}

function totalFuel(f: Fueling) {
  const itemsTotal = f.items.reduce(
    (s, i) => s + i.quantity * i.unitPrice - (i.discount || 0),
    0,
  );
  return Math.max(0, itemsTotal - (f.generalDiscount || 0));
}

function ReceiptsTab() {
  const [payments, setPayments] = usePayments();
  const [trips] = useActiveTrips();
  const [fuelings, setFuelings] = useFuelings();
  const [expenses] = useExpenses();
  const [tolls] = useTolls();
  const [trucks] = useTrucks();
  const [drivers] = useDrivers();
  const [settings] = useSettings();
  const [open, setOpen] = useState(false);
  const [jsonEditItem, setJsonEditItem] = useState<Payment | null>(null);
  const [jsonEditOpen, setJsonEditOpen] = useState(false);

  const sorted = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)),
    [payments],
  );

  const totalReceived = useMemo(() => sorted.reduce((s, p) => s + p.receivedValue, 0), [sorted]);

  const remove = (id: string) => {
    if (
      !window.confirm("Excluir este recebimento? As viagens e despesas voltarão a ficar em aberto.")
    )
      return;
    setPayments((prev) => prev.filter((p) => p.id !== id));
    toast.success("Recebimento removido");
  };

  const generatePDF = async (p: Payment) => {
    try {
      const selTrips = trips.filter((t) => p.tripIds.includes(t.id));
      const selFuel = fuelings.filter((f) => p.fuelingIds.includes(f.id));
      const selExp = expenses.filter((e) => p.expenseIds.includes(e.id));
      const selTolls = tolls.filter((t) => p.tollIds.includes(t.id));

      const content: unknown[] = [
        pdfKpiRow([
          { label: "Bruto viagens", value: formatBRL(p.grossValue) },
          { label: "Aluguel", value: `- ${formatBRL(p.rentValue)}`, color: PDF_COLORS.muted },
          {
            label: "Descontos",
            value: `- ${formatBRL(p.deductedValue)}`,
            color: PDF_COLORS.danger,
          },
          { label: "Recebido", value: formatBRL(p.receivedValue), color: PDF_COLORS.primaryDark },
        ]),
      ];

      // Viagens
      content.push(pdfSectionTitle("Viagens"));
      content.push({
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "*", "*", "auto", "auto"],
          body: [
            [
              th("Data"),
              th("Caminhão"),
              th("Origem"),
              th("Destino"),
              th("Valor viagem"),
              th("Recebido"),
            ],
            ...selTrips
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((t) => {
                const truck = trucks.find((x) => x.id === t.truckId);
                const recv = p.tripReceivedValues?.[t.id];
                return [
                  formatDateBR(t.date),
                  truck ? `${truck.name} (${truck.plate})` : "—",
                  t.origin,
                  t.destination ?? "—",
                  formatBRL(t.finalValue),
                  recv != null ? formatBRL(recv) : "—",
                ];
              }),
            [
              {
                text: `Subtotal (${selTrips.length})`,
                colSpan: 5,
                alignment: "right",
                bold: true,
                color: PDF_COLORS.primaryDark,
              },
              {},
              { text: formatBRL(p.grossValue), bold: true, color: PDF_COLORS.primaryDark },
            ],
          ],
        },
        layout: pdfTableLayout,
        fontSize: 9,
      });

      content.push({
        text: `Aluguel da carreta (${(p.rentPercent * 100).toFixed(0)}% do bruto): - ${formatBRL(p.rentValue)}`,
        margin: [0, 10, 0, 0],
        bold: true,
        color: PDF_COLORS.muted,
      });

      // Combustível
      if (selFuel.length) {
        content.push(pdfSectionTitle("Combustíveis"));
        content.push({
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "*", "auto", "auto"],
            body: [
              [th("Data"), th("Caminhão"), th("Motorista"), th("Tipo"), th("Valor")],
              ...selFuel
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((f) => {
                  const truck = trucks.find((x) => x.id === f.truckId);
                  const driver = drivers.find((d) => d.id === f.driverId);
                  const r = fuelResponsibility(f);
                  return [
                    formatDateBR(f.date),
                    truck ? `${truck.name} (${truck.plate})` : "—",
                    driver?.name ?? "-",
                    r === "ressarcir" ? "Ressarce" : "Desconta",
                    formatBRL(totalFuel(f)),
                  ];
                }),
            ],
          },
          layout: pdfTableLayout,
          fontSize: 9,
        });
      }

      // Manutenção
      if (selExp.length) {
        content.push(pdfSectionTitle("Manutenções"));
        content.push({
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "*", "auto", "auto"],
            body: [
              [th("Data"), th("Caminhão"), th("Descrição"), th("Tipo"), th("Valor")],
              ...selExp
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((e) => {
                  const truck = trucks.find((x) => x.id === e.truckId);
                  return [
                    formatDateBR(e.date),
                    truck ? `${truck.name} (${truck.plate})` : "—",
                    `${e.category}${e.description ? " — " + e.description : ""}`,
                    e.responsibility === "ressarcir" ? "Ressarce" : "Desconta",
                    formatBRL(e.value),
                  ];
                }),
            ],
          },
          layout: pdfTableLayout,
          fontSize: 9,
        });
      }

      // Pedágios
      if (selTolls.length) {
        content.push(pdfSectionTitle("Pedágios"));
        content.push({
          table: {
            headerRows: 1,
            widths: ["auto", "*", "auto", "auto", "auto"],
            body: [
              [th("Data"), th("Pedágio"), th("Sem Parar"), th("Tipo"), th("Valor")],
              ...selTolls
                .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
                .map((t) => [
                  formatDateBR(t.dateTime),
                  t.tollName,
                  t.semParar ? "Sim" : "Não",
                  t.responsibility === "ressarcir" ? "Ressarce" : "Desconta",
                  formatBRL(t.value),
                ]),
            ],
          },
          layout: pdfTableLayout,
          fontSize: 9,
        });
      }

      // Resumo
      content.push(pdfSectionTitle("Resumo financeiro"));
      content.push({
        table: {
          widths: ["*", "auto"],
          body: [
            ["Valor bruto (viagens)", formatBRL(p.grossValue)],
            [`Ressarcimentos`, `+ ${formatBRL(p.reimbursedValue)}`],
            [
              `Aluguel da carreta (${(p.rentPercent * 100).toFixed(0)}%)`,
              `- ${formatBRL(p.rentValue)}`,
            ],
            ["Descontos (combustível + manutenção + pedágios)", `- ${formatBRL(p.deductedValue)}`],
            [
              { text: "Valor esperado", bold: true },
              { text: formatBRL(p.expectedValue), bold: true },
            ],
            [
              { text: "Valor recebido", bold: true, color: PDF_COLORS.primaryDark },
              { text: formatBRL(p.receivedValue), bold: true, color: PDF_COLORS.primaryDark },
            ],
            [
              { text: "Diferença", italics: true },
              { text: formatBRL(p.receivedValue - p.expectedValue), italics: true },
            ],
          ],
        },
        layout: pdfTableLayout,
        fontSize: 10,
      });

      if (p.notes) {
        content.push(pdfSectionTitle("Observações"));
        content.push({ text: p.notes, fontSize: 10 });
      }

      await previewPdf(
        buildPdfDoc({
          title: "Recebimento",
          subtitle: `Data: ${formatDateBR(p.date)}`,
          content,
        }),
        `recebimento-${p.date}.pdf`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    }
  };

  const totalExpected = useMemo(
    () => sorted.reduce((s, p) => s + p.expectedValue, 0),
    [sorted],
  );
  const totalDiff = totalReceived - totalExpected;
  const avgReceived = sorted.length > 0 ? totalReceived / sorted.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-1 h-4 w-4" /> Novo recebimento
              </Button>
            </DialogTrigger>
            <ReceiptDialog onSaved={() => setOpen(false)} />
          </Dialog>
          <ImportReceiptButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recebimentos
          </p>
          <p className="mt-2 text-2xl font-bold">{sorted.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">registro(s) no total</p>
        </Card>
        <Card className="p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total recebido
          </p>
          <p className="mt-2 text-2xl font-bold text-primary">{formatBRL(totalReceived)}</p>
          <p className="mt-1 text-xs text-muted-foreground">acumulado</p>
        </Card>
        <Card className="p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ticket médio
          </p>
          <p className="mt-2 text-2xl font-bold">{formatBRL(avgReceived)}</p>
          <p className="mt-1 text-xs text-muted-foreground">por recebimento</p>
        </Card>
        <Card className="p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Diferença
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              totalDiff >= 0 ? "text-emerald-600" : "text-destructive"
            }`}
          >
            {totalDiff >= 0 ? "+" : "-"} {formatBRL(Math.abs(totalDiff))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">recebido vs esperado</p>
        </Card>
      </div>

      {sorted.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Banknote className="h-7 w-7 text-primary" />
          </div>
          <p className="text-lg font-semibold">Nenhum recebimento registrado</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Clique em "Novo recebimento" para registrar o primeiro acerto com a frigorífico.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((p) => {
            const diff = p.receivedValue - p.expectedValue;
            const isPositive = diff >= 0;
            return (
              <Card
                key={p.id}
                className="overflow-hidden border-l-4 shadow-soft transition-all hover:shadow-md"
                style={{ borderLeftColor: isPositive ? "rgb(5 150 105)" : "rgb(220 38 38)" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDateBR(p.date)}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="secondary" className="font-medium">
                        {p.tripIds.length} viagem(ns)
                      </Badge>
                      {p.fuelingIds.length > 0 && (
                        <Badge variant="outline">{p.fuelingIds.length} combustível(is)</Badge>
                      )}
                      {p.expenseIds.length > 0 && (
                        <Badge variant="outline">{p.expenseIds.length} manutenção(ões)</Badge>
                      )}
                      {p.tollIds.length > 0 && (
                        <Badge variant="outline">{p.tollIds.length} pedágio(s)</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">Bruto</span>
                        <p className="font-semibold">{formatBRL(p.grossValue)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ressarcimentos</span>
                        <p className="font-semibold text-emerald-600">
                          + {formatBRL(p.reimbursedValue)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Aluguel + Descontos</span>
                        <p className="font-semibold text-destructive">
                          - {formatBRL(p.rentValue + p.deductedValue)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Esperado</span>
                        <p className="font-semibold">{formatBRL(p.expectedValue)}</p>
                      </div>
                    </div>
                    {p.notes && (
                      <p className="whitespace-pre-wrap rounded-md bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                        {p.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Recebido
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {formatBRL(p.receivedValue)}
                      </p>
                      <p
                        className={`mt-0.5 flex items-center justify-end gap-1 text-xs font-medium ${
                          isPositive ? "text-emerald-600" : "text-destructive"
                        }`}
                      >
                        {isPositive ? "+" : "-"} {formatBRL(Math.abs(diff))}
                        <span className="text-muted-foreground">vs esperado</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePDF(p)}
                        title="Gerar PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      {settings.editorMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Editar JSON"
                          onClick={() => {
                            setJsonEditItem(p);
                            setJsonEditOpen(true);
                          }}
                        >
                          <Code2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <JsonEditorDialog
        open={jsonEditOpen}
        onOpenChange={setJsonEditOpen}
        title={`Editar recebimento — ${jsonEditItem?.date ?? ""}`}
        data={jsonEditItem}
        onSave={(updated) => {
          if (jsonEditItem && updated && typeof updated === "object") {
            setPayments((prev) =>
              prev.map((p) => (p.id === jsonEditItem.id ? ({ ...p, ...updated } as Payment) : p)),
            );
          }
        }}
      />
    </div>
  );
}

function ReceiptDialog({ onSaved }: { onSaved: () => void }) {
  const [payments, setPayments] = usePayments();
  const [trips, setTrips] = useActiveTrips();
  const [fuelings, setFuelings] = useFuelings();
  const [expenses] = useExpenses();
  const [tolls] = useTolls();
  const [trucks] = useTrucks();
  const [settings] = useSettings();
  const [alternativeLayout, setAlternativeLayout] = useState(false);
  const [truckFilter, setTruckFilter] = useState<string>("__all__");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [destFilter, setDestFilter] = useState<string>("__all__");
  const [editingMinuta, setEditingMinuta] = useState<string | null>(null);
  const [minutaInput, setMinutaInput] = useState("");
  const [editingCte, setEditingCte] = useState<string | null>(null);
  const [cteInput, setCteInput] = useState("");

  const lockedTrips = useMemo(() => new Set(payments.flatMap((p) => p.tripIds)), [payments]);
  const lockedFuel = useMemo(() => new Set(payments.flatMap((p) => p.fuelingIds)), [payments]);
  const lockedExp = useMemo(() => new Set(payments.flatMap((p) => p.expenseIds)), [payments]);
  const lockedTolls = useMemo(() => new Set(payments.flatMap((p) => p.tollIds)), [payments]);

  const matchTruck = (id?: string) =>
    truckFilter === "__all__" ? true : truckFilter === "__none__" ? !id : id === truckFilter;
  const matchDate = (d: string) => {
    const ymd = d.slice(0, 10);
    if (dateFrom && ymd < dateFrom) return false;
    const effectiveDateTo = date || dateTo;
    if (effectiveDateTo && ymd > effectiveDateTo) return false;
    return true;
  };
  const matchDest = (d?: Destination) => {
    if (destFilter === "__all__") return true;
    return d === destFilter;
  };

  const openTrips = useMemo(
    () =>
      trips
        .filter(
          (t) =>
            !lockedTrips.has(t.id) &&
            matchTruck(t.truckId) &&
            matchDate(t.date) &&
            matchDest(t.destination),
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [trips, lockedTrips, truckFilter, dateFrom, dateTo, destFilter],
  );
  const openFuel = useMemo(
    () =>
      fuelings
        .filter(
          (f) =>
            !lockedFuel.has(f.id) &&
            fuelResponsibility(f) !== "minha" &&
            matchTruck(f.truckId) &&
            matchDate(f.date),
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [fuelings, lockedFuel, truckFilter, dateFrom, dateTo],
  );
  const openExp = useMemo(
    () =>
      expenses
        .filter(
          (e) =>
            !lockedExp.has(e.id) &&
            e.responsibility !== "minha" &&
            matchTruck(e.truckId) &&
            matchDate(e.date),
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [expenses, lockedExp, truckFilter, dateFrom, dateTo],
  );
  const openTolls = useMemo(
    () =>
      tolls
        .filter(
          (t) =>
            !lockedTolls.has(t.id) &&
            t.responsibility !== "minha" &&
            matchTruck(t.truckId) &&
            matchDate(t.dateTime),
        )
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [tolls, lockedTolls, truckFilter, dateFrom, dateTo],
  );

  const [tripIds, setTripIds] = useState<string[]>([]);
  const [fuelIds, setFuelIds] = useState<string[]>([]);
  const [expIds, setExpIds] = useState<string[]>([]);
  const [tollIds, setTollIds] = useState<string[]>([]);
  const [tripReceivedValues, setTripReceivedValues] = useState<Record<string, string>>({});
  const [tollReceivedValues, setTollReceivedValues] = useState<Record<string, string>>({});
  const [fuelingItemIds, setFuelingItemIds] = useState<string[]>([]);
  const [fuelingRefs, setFuelingRefs] = useState<Record<string, { minuta: string; cte: string }>>({});

  const [receivedValue, setReceivedValue] = useState("");
  const [notes, setNotes] = useState("");

  const selTrips = trips.filter((t) => tripIds.includes(t.id));
  const selFuel = fuelings.filter((f) => fuelIds.includes(f.id));
  const selExp = expenses.filter((e) => expIds.includes(e.id));
  const selTolls = tolls.filter((t) => tollIds.includes(t.id));

  const grossValue = selTrips.reduce((s, t) => s + t.finalValue, 0);
  const rentValue = grossValue * RENT_PERCENT;
  const fuelDesc = selFuel
    .filter((f) => fuelResponsibility(f) === "desconto")
    .reduce((s, f) => s + totalFuel(f), 0);
  const fuelRess = selFuel
    .filter((f) => fuelResponsibility(f) === "ressarcir")
    .reduce((s, f) => s + totalFuel(f), 0);
  const expDesc = selExp
    .filter((e) => e.responsibility === "desconto")
    .reduce((s, e) => s + e.value, 0);
  const expRess = selExp
    .filter((e) => e.responsibility === "ressarcir")
    .reduce((s, e) => s + e.value, 0);
  const tollAmount = (t: Toll) => {
    const raw = tollReceivedValues[t.id];
    return Math.min(t.value, Math.max(0, raw === undefined || raw === "" ? t.value : Number(raw) || 0));
  };
  const tollDesc = selTolls.filter((t) => t.responsibility === "desconto").reduce((s, t) => s + tollAmount(t), 0);
  const tollRess = selTolls.filter((t) => t.responsibility === "ressarcir").reduce((s, t) => s + tollAmount(t), 0);
  const reimbursedValue = fuelRess + expRess + tollRess;
  const deductedValue = fuelDesc + expDesc + tollDesc;
  const expectedValue = grossValue + reimbursedValue - rentValue - deductedValue;

  // Sum of per-trip received values
  const perTripTotal = useMemo(
    () => selTrips.reduce((s, t) => s + (tripReceivedValues[t.id] === undefined || tripReceivedValues[t.id] === "" ? t.finalValue : Number(tripReceivedValues[t.id]) || 0), 0),
    [selTrips, tripReceivedValues],
  );

  const toggle = (id: string, arr: string[], setArr: (v: string[]) => void) => {
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };
  const toggleAll = (ids: string[], arr: string[], setArr: (v: string[]) => void) => {
    if (ids.every((id) => arr.includes(id))) setArr(arr.filter((id) => !ids.includes(id)));
    else setArr(Array.from(new Set([...arr, ...ids])));
  };

  const toggleTrip = (id: string) => {
    const already = tripIds.includes(id);
    if (already) {
      setTripIds(tripIds.filter((x) => x !== id));
      setTripReceivedValues((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setTripIds([...tripIds, id]);
      // Auto-selecionar pedágios em aberto vinculados a essa viagem
      const linked = openTolls
        .filter((t) => t.tripId === id && !tollIds.includes(t.id))
        .map((t) => t.id);
      if (linked.length) setTollIds([...tollIds, ...linked]);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Informe a data.");
      return;
    }
    if (destFilter === "__all__") {
      toast.error("Selecione um destino para realizar o pagamento.");
      return;
    }
    if (selTrips.length === 0) {
      toast.error("Selecione ao menos uma viagem.");
      return;
    }
    const rv = receivedValue.trim() === "" ? expectedValue : Number(receivedValue);
    if (!Number.isFinite(rv)) {
      toast.error("Informe um valor recebido válido.");
      return;
    }
    // Build per-trip received values record
    const tripRecv: Record<string, number> = {};
    for (const t of selTrips) {
      const v = tripReceivedValues[t.id];
      if (v !== undefined && v !== "") {
        tripRecv[t.id] = Number(v) || 0;
      } else {
        tripRecv[t.id] = t.finalValue;
      }
    }
    const p: Payment = {
      id: uid(),
      date,
      destination: destFilter as Destination,
      tripIds,
      fuelingIds: fuelIds,
      expenseIds: expIds,
      tollIds,
      rentPercent: RENT_PERCENT,
      grossValue,
      rentValue,
      reimbursedValue,
      deductedValue,
      expectedValue,
      receivedValue: rv,
      tripReceivedValues: Object.keys(tripRecv).length > 0 ? tripRecv : undefined,
      tollReceivedValues: Object.keys(tollReceivedValues).length > 0 ? Object.fromEntries(Object.entries(tollReceivedValues).map(([id, value]) => [id, Number(value) || 0])) : undefined,
      fuelingItemIds: fuelingItemIds.length > 0 ? fuelingItemIds : undefined,
      notes: notes.trim() || undefined,
    };
    setPayments((prev) => [...prev, p]);
    toast.success("Recebimento registrado");
    if (settings.receiptSound) {
      try {
        new Audio(settings.receiptSound).play().catch(() => {});
      } catch {
        /* ignore */
      }
    }
    onSaved();
  };

  const downloadRegistry = () => {
    if (selTrips.length === 0) {
      toast.error("Selecione ao menos uma viagem.");
      return;
    }
    const rv = receivedValue.trim() === "" ? expectedValue : Number(receivedValue) || 0;
    const tripRecv: Record<string, number> = {};
    for (const t of selTrips) {
      const v = tripReceivedValues[t.id];
      if (v !== undefined && v !== "") {
        tripRecv[t.id] = Number(v) || 0;
      } else {
        tripRecv[t.id] = t.finalValue;
      }
    }
    const registry = {
      type: "registro-recebimento",
      version: 1,
      exportedAt: new Date().toISOString(),
      payment: {
        id: uid(),
        date,
        tripIds,
        fuelingIds: fuelIds,
        expenseIds: expIds,
        tollIds,
        rentPercent: RENT_PERCENT,
        grossValue,
        rentValue,
        reimbursedValue,
        deductedValue,
        expectedValue,
        receivedValue: rv,
        tripReceivedValues: Object.keys(tripRecv).length > 0 ? tripRecv : undefined,
        notes: notes.trim() || undefined,
      } as Payment,
      trips: selTrips.map((t) => ({ ...t })),
      fuelings: selFuel.map((f) => ({ ...f })),
      expenses: selExp.map((e) => ({ ...e })),
      tolls: selTolls.map((t) => ({ ...t })),
    };
    const blob = new Blob([JSON.stringify(registry, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recebimento-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Registro de recebimento baixado");
  };

  const saveMinuta = (tripId: string) => {
    const val = minutaInput.trim();
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, minuta: val || undefined } : t)),
    );
    toast.success(val ? "Minuta salva" : "Minuta removida");
    setEditingMinuta(null);
    setMinutaInput("");
  };

  const truckLabel = (id?: string) => {
    const tr = trucks.find((x) => x.id === id);
    return tr ? `${tr.name} (${tr.plate})` : "—";
  };

  const tripKm = (t: Trip) => {
    if (t.kmStart > 0 || t.kmEnd > 0) return Math.max(0, t.kmEnd - t.kmStart);
    return t.manualDistance ?? 0;
  };

  if (alternativeLayout) return <AlternativeLayoutDialog open title="Novo recebimento" onBack={() => setAlternativeLayout(false)} />;

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-center"><label className="flex items-center gap-2 text-xs text-muted-foreground">Novo layout <Switch checked={alternativeLayout} onCheckedChange={setAlternativeLayout} /></label></div>
      <DialogHeader>
        <DialogTitle>Novo recebimento</DialogTitle>
        <DialogDescription>
          Selecione as viagens e despesas para registrar um recebimento.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>
              Data <span className="text-destructive">*</span>
            </Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>
              Valor recebido (R$) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={receivedValue}
              onChange={(e) => setReceivedValue(e.target.value)}
              placeholder={formatBRL(expectedValue)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Caminhão</Label>
              <Select value={truckFilter} onValueChange={setTruckFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="__none__">Sem caminhão</SelectItem>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">De</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input
                type="date"
value={date}
                    onChange={(e) => setDateTo(e.target.value)}
                    disabled
                    className="mt-1"
              />
            </div>
          </div>
          <div className="mt-2">
            <Label className="text-xs">Destino</Label>
            <Select value={destFilter} onValueChange={setDestFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="bataguassu">Bataguassu</SelectItem>
                <SelectItem value="cassilandia">Cassilândia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Viagens with per-trip received values */}
        <SelectableList
          title="Viagens em aberto"
          empty="Nenhuma viagem em aberto."
          count={selTrips.length}
          totalLabel="Bruto"
          total={grossValue}
          allChecked={openTrips.length > 0 && openTrips.every((t) => tripIds.includes(t.id))}
          onToggleAll={() => {
            const allSel = openTrips.every((t) => tripIds.includes(t.id));
            if (allSel) {
              setTripIds(tripIds.filter((id) => !openTrips.some((t) => t.id === id)));
            } else {
              const newTripIds = Array.from(new Set([...tripIds, ...openTrips.map((t) => t.id)]));
              setTripIds(newTripIds);
              const linked = openTolls
                .filter((t) => t.tripId && newTripIds.includes(t.tripId) && !tollIds.includes(t.id))
                .map((t) => t.id);
              if (linked.length) setTollIds(Array.from(new Set([...tollIds, ...linked])));
            }
          }}
        >
          {openTrips.map((t) => {
            const isEditingMinuta = editingMinuta === t.id;
            const tripNet = t.finalValue - t.finalValue * RENT_PERCENT;
            return (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Checkbox checked={tripIds.includes(t.id)} onCheckedChange={() => toggleTrip(t.id)} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDateBR(t.date)} • {truckLabel(t.truckId)} • {tripKm(t)} km
                    {t.destination && ` • ${DESTINATION_LABELS[t.destination]}`}
                  </p>
                  <p className="truncate font-medium">
                    {t.origin} → {t.destination ? DESTINATION_LABELS[t.destination] : "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {t.cte && <span className="text-primary">CTe: {t.cte}</span>}
                    <span>Líquido: {formatBRL(tripNet)}</span>
                    {t.minuta && <span>Minuta: {t.minuta}</span>}
                  </div>
                  {editingCte === t.id ? (
                    <div className="mt-1 flex items-center gap-1">
                      <Input className="h-7 text-xs" placeholder="Número da CTe" value={cteInput} onChange={(e) => setCteInput(e.target.value)} autoFocus />
                      <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setTrips((prev) => prev.map((trip) => trip.id === t.id ? { ...trip, cte: cteInput.trim() || undefined } : trip)); setEditingCte(null); setCteInput(""); }}>OK</Button>
                    </div>
                  ) : (
                    <button type="button" className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => { setEditingCte(t.id); setCteInput(t.cte ?? ""); }}>
                      <FileText className="h-3 w-3" /> {t.cte ? "Editar CTe" : "Inserir CTe"}
                    </button>
                  )}
                  {isEditingMinuta ? (
                    <div className="mt-1 flex items-center gap-1">
                      <Input
                        type="text"
                        className="h-7 text-xs"
                        placeholder="Número da minuta"
                        value={minutaInput}
                        onChange={(e) => setMinutaInput(e.target.value)}
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => saveMinuta(t.id)}
                      >
                        OK
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          setEditingMinuta(null);
                          setMinutaInput("");
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={() => {
                        setEditingMinuta(t.id);
                        setMinutaInput(t.minuta ?? "");
                      }}
                    >
                      <FileText className="h-3 w-3" />
                      {t.minuta ? "Editar minuta" : "Inserir minuta"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Valor viagem</p>
                    <p className="font-semibold">{formatBRL(t.finalValue)}</p>
                  </div>
                  {tripIds.includes(t.id) && (
                    <div className="w-28">
                      <Label className="text-[10px] text-muted-foreground">
                        Recebido nesta viagem
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-8 text-sm"
                        value={tripReceivedValues[t.id] ?? ""}
                        onChange={(e) =>
                          setTripReceivedValues((prev) => ({
                            ...prev,
                            [t.id]: e.target.value,
                          }))
                        }
                        placeholder={formatBRL(t.finalValue)}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </SelectableList>

        {perTripTotal > 0 && (
          <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
            <span className="text-muted-foreground">Soma dos valores por viagem: </span>
            <span className="font-bold text-primary">{formatBRL(perTripTotal)}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              (para conferência — o valor total recebido é informado acima)
            </span>
          </div>
        )}

        {/* Combustíveis */}
        <SelectableList
          title="Combustíveis em aberto (Desconta ou Ressarce)"
          empty="Nenhum registro em aberto."
          count={selFuel.length}
          totalLabel="Líquido"
          total={fuelRess - fuelDesc}
          allChecked={openFuel.length > 0 && openFuel.every((f) => fuelIds.includes(f.id))}
          onToggleAll={() =>
            toggleAll(
              openFuel.map((f) => f.id),
              fuelIds,
              setFuelIds,
            )
          }
        >
          {openFuel.flatMap((f) => f.items.map((item, index) => {
            const itemId = `${f.id}:${index}`;
            const responsibility = item.responsibility ?? f.responsibility ?? (f.deductFromPayment ? "desconto" : "ressarcir");
            const amount = Math.max(0, item.quantity * item.unitPrice - (item.discount || 0));
            const selected = fuelingItemIds.includes(itemId);
            return <Row key={itemId} checked={selected} onCheckedChange={() => {
              const itemIds = f.items.map((_, itemIndex) => `${f.id}:${itemIndex}`);
              const shouldSelect = !itemIds.every((id) => fuelingItemIds.includes(id));
              setFuelingItemIds((prev) => shouldSelect ? Array.from(new Set([...prev, ...itemIds])) : prev.filter((id) => !itemIds.includes(id)));
              setFuelIds((prev) => shouldSelect ? Array.from(new Set([...prev, f.id])) : prev.filter((id) => id !== f.id));
            }} left={`${formatDateBR(f.date)} • ${truckLabel(f.truckId)}`} middle={<div className="flex min-w-0 flex-wrap items-center gap-2">{f.tripId && (() => { const linkedTrip = trips.find((t) => t.id === f.tripId); return linkedTrip ? <div className="w-full text-[0.75rem] text-[#eb881f]">{linkedTrip.origin} → {linkedTrip.destination ? DESTINATION_LABELS[linkedTrip.destination] : "—"}</div> : null; })()}<span>{item.description}</span>{f.tripId ? <div className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs"><span className="font-medium">Viagem: {trips.find((t) => t.id === f.tripId)?.minuta || trips.find((t) => t.id === f.tripId)?.cte || "vinculada"}</span><Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="Editar vínculo" title="Editar vínculo" onClick={() => setFuelings((prev) => prev.map((fueling) => fueling.id === f.id ? { ...fueling, tripId: undefined } : fueling))}><Pencil className="h-3 w-3" /></Button><Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" aria-label="Excluir vínculo" title="Excluir vínculo" onClick={() => setFuelings((prev) => prev.map((fueling) => fueling.id === f.id ? { ...fueling, tripId: undefined } : fueling))}><Trash2 className="h-3 w-3" /></Button></div> : <div className="flex items-center gap-1"><Input className="h-7 w-20 text-xs" placeholder="Minuta" value={fuelingRefs[f.id]?.minuta ?? ""} onChange={(e) => setFuelingRefs((prev) => ({ ...prev, [f.id]: { minuta: e.target.value, cte: prev[f.id]?.cte ?? "" } }))} /><Input className="h-7 w-20 text-xs" placeholder="CTe" value={fuelingRefs[f.id]?.cte ?? ""} onChange={(e) => setFuelingRefs((prev) => ({ ...prev, [f.id]: { minuta: prev[f.id]?.minuta ?? "", cte: e.target.value } }))} /><Button type="button" size="icon" variant="outline" className="h-7 w-7" aria-label="Pesquisar viagem para abastecimento" title="Pesquisar viagem" onClick={() => { const refs = fuelingRefs[f.id] ?? { minuta: "", cte: "" }; const query = (refs.minuta || refs.cte).trim().toLowerCase(); const matches = trips.filter((t) => t.minuta?.trim().toLowerCase() === query || t.cte?.trim().toLowerCase() === query); if (matches.length === 1) setFuelings((prev) => prev.map((fueling) => fueling.id === f.id ? { ...fueling, tripId: matches[0].id } : fueling)); else if (matches.length > 1) toast.warning("Mais de uma viagem encontrada."); else toast.error("Nenhuma viagem encontrada."); }}><Search className="h-3.5 w-3.5" /></Button></div>}</div>} right={<span className={responsibility === "ressarcir" ? "text-emerald-600" : "text-destructive"}>{responsibility === "ressarcir" ? "+" : "-"} {formatBRL(amount)}</span>} />;
          }))}
        </SelectableList>

        {/* Manutenções */}
        <SelectableList
          title="Manutenções em aberto (Desconta ou Ressarce)"
          empty="Nenhuma manutenção em aberto."
          count={selExp.length}
          totalLabel="Líquido"
          total={expRess - expDesc}
          allChecked={openExp.length > 0 && openExp.every((e) => expIds.includes(e.id))}
          onToggleAll={() =>
            toggleAll(
              openExp.map((e) => e.id),
              expIds,
              setExpIds,
            )
          }
        >
          {openExp.map((e) => (
            <Row
              key={e.id}
              checked={expIds.includes(e.id)}
              onCheckedChange={() => toggle(e.id, expIds, setExpIds)}
              left={`${formatDateBR(e.date)} • ${truckLabel(e.truckId)}`}
              middle={`${e.category}${e.description ? " — " + e.description : ""}`}
              right={
                <span
                  className={
                    e.responsibility === "ressarcir" ? "text-emerald-600" : "text-destructive"
                  }
                >
                  {e.responsibility === "ressarcir" ? "+" : "-"} {formatBRL(e.value)}
                </span>
              }
            />
          ))}
        </SelectableList>

        {/* Pedágios */}
        <SelectableList
          title="Pedágios em aberto (Desconta ou Ressarce)"
          empty="Nenhum pedágio em aberto."
          count={selTolls.length}
          totalLabel="Líquido"
          total={tollRess - tollDesc}
          allChecked={openTolls.length > 0 && openTolls.every((t) => tollIds.includes(t.id))}
          onToggleAll={() =>
            toggleAll(
              openTolls.map((t) => t.id),
              tollIds,
              setTollIds,
            )
          }
        >
          {openTolls.map((t) => (
            <Row
              key={t.id}
              checked={tollIds.includes(t.id)}
              onCheckedChange={() => toggle(t.id, tollIds, setTollIds)}
              left={`${formatDateBR(t.dateTime)}${t.semParar ? " • Sem Parar" : ""}`}
              middle={t.tollName}
              right={
                <span
                  className={
                    t.responsibility === "ressarcir" ? "text-emerald-600" : "text-destructive"
                  }
                >
                  {t.responsibility === "ressarcir" ? "+" : "-"} {formatBRL(t.value)}
                  {tollIds.includes(t.id) && <Input type="number" min="0" max={t.value} step="0.01" className="ml-2 inline-flex h-7 w-24" placeholder="Recebido" value={tollReceivedValues[t.id] ?? ""} onChange={(e) => setTollReceivedValues((prev) => ({ ...prev, [t.id]: e.target.value }))} />}
                </span>
              }
            />
          ))}
        </SelectableList>

        <div className="rounded-xl border border-border bg-gradient-to-br from-secondary/40 to-secondary/10 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumo financeiro
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
            <Summary label="Bruto" value={formatBRL(grossValue)} />
            <Summary
              label={`Aluguel ${(RENT_PERCENT * 100).toFixed(0)}%`}
              value={`- ${formatBRL(rentValue)}`}
            />
            <Summary label="Ressarcir" value={`+ ${formatBRL(reimbursedValue)}`} />
            <Summary label="Descontos" value={`- ${formatBRL(deductedValue)}`} />
            <Summary label="Esperado" value={formatBRL(expectedValue)} highlight />
          </div>
        </div>

        <div>
          <Label>Observações (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="icon" onClick={downloadRegistry} title="Baixar registro" aria-label="Baixar registro">
            <Download className="h-4 w-4" />
          </Button>
          <Button type="submit" size="lg">
            <Banknote className="mr-1 h-4 w-4" /> Salvar recebimento
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function SelectableList({
  title,
  empty,
  count,
  totalLabel,
  total,
  extra,
  allChecked,
  onToggleAll,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  totalLabel: string;
  total: number;
  extra?: React.ReactNode;
  allChecked: boolean;
  onToggleAll: () => void;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const hasItems = arr.filter(Boolean).length > 0;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/50 px-4 py-2.5">
        <p className="text-sm font-semibold">{title}</p>
        <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground">
          {extra}
          <span>
            {count} selecionado(s) • {totalLabel}: {formatBRL(total)}
          </span>
          {hasItems && (
            <Button type="button" variant="ghost" size="sm" onClick={onToggleAll}>
              {allChecked ? "Desmarcar todos" : "Marcar todos"}
            </Button>
          )}
        </div>
      </div>
      {hasItems ? (
        <ul className="divide-y divide-border">{children}</ul>
      ) : (
        <p className="p-6 text-center text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function Row({
  checked,
  onCheckedChange,
  left,
  middle,
  right,
}: {
  checked: boolean;
  onCheckedChange: () => void;
  left: string;
  middle: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs text-muted-foreground">{left}</p>
        <p className="truncate font-medium">{middle}</p>
      </div>
      <div className="shrink-0 font-semibold">{right}</div>
    </li>
  );
}

function Summary({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={
          highlight
            ? "mt-0.5 text-xl font-bold text-primary"
            : "mt-0.5 font-semibold text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import recebimento.json
// ---------------------------------------------------------------------------

type RegistryFile = {
  type: string;
  version: number;
  exportedAt: string;
  payment: Payment;
  trips?: Trip[];
  fuelings?: Fueling[];
  expenses?: Expense[];
  tolls?: Toll[];
};

function ImportReceiptButton() {
  const [, setPayments] = usePayments();
  const [, setTrips] = useActiveTrips();
  const [, setFuelings] = useFuelings();
  const [, setExpenses] = useExpenses();
  const [, setTolls] = useTolls();
  const [trips] = useActiveTrips();
  const [fuelings] = useFuelings();
  const [expenses] = useExpenses();
  const [tolls] = useTolls();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as RegistryFile;
      if (!parsed.payment || !parsed.payment.tripIds) {
        toast.error("Arquivo inválido: não é um registro de recebimento");
        return;
      }

      const existingTripIds = new Set(trips.map((t) => t.id));
      const existingFuelIds = new Set(fuelings.map((f) => f.id));
      const existingExpIds = new Set(expenses.map((x) => x.id));
      const existingTollIds = new Set(tolls.map((t) => t.id));

      if (parsed.trips?.length) {
        const toAdd = parsed.trips.filter((t) => !existingTripIds.has(t.id));
        if (toAdd.length) setTrips((prev) => [...prev, ...toAdd]);
      }
      if (parsed.fuelings?.length) {
        const toAdd = parsed.fuelings.filter((f) => !existingFuelIds.has(f.id));
        if (toAdd.length) setFuelings((prev) => [...prev, ...toAdd]);
      }
      if (parsed.expenses?.length) {
        const toAdd = parsed.expenses.filter((x) => !existingExpIds.has(x.id));
        if (toAdd.length) setExpenses((prev) => [...prev, ...toAdd]);
      }
      if (parsed.tolls?.length) {
        const toAdd = parsed.tolls.filter((t) => !existingTollIds.has(t.id));
        if (toAdd.length) setTolls((prev) => [...prev, ...toAdd]);
      }

      setPayments((prev) => {
        const exists = prev.some((p) => p.id === parsed.payment.id);
        if (exists) {
          return prev.map((p) => (p.id === parsed.payment.id ? parsed.payment : p));
        }
        return [...prev, parsed.payment];
      });

      toast.success("Recebimento importado");
    } catch {
      toast.error("Erro ao ler o arquivo");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <Button size="lg" variant="outline" onClick={() => fileRef.current?.click()}>
        <Upload className="mr-1 h-4 w-4" /> Importar recebimento
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}
