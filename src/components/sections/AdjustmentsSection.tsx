import { useMemo, useState } from "react";
import { usePayments, useAdjustments, useActiveTrips, formatBRL, formatDateBR, uid, type Payment, type PaymentAdjustment } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, History, Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";

const STATUS = { aberto: "Em análise", cobrado: "Cobrar / contestar", aceito: "Justificado e aceito", recebido: "Recebido posteriormente" } as const;
const STATUS_TONE = { aberto: "outline", cobrado: "secondary", aceito: "secondary", recebido: "default" } as const;
type Status = keyof typeof STATUS;

type Item = { id: string; label: string; expected: number; received: number; tripId?: string };

function paymentItems(payment: Payment, trips: ReturnType<typeof useActiveTrips>[0]): Item[] {
  return trips.filter((t) => payment.tripIds.includes(t.id)).map((t) => ({ id: `trip:${t.id}`, label: `Viagem · ${t.minuta || t.cte || t.origin + " → " + t.destination}`, expected: t.finalValue, received: payment.tripReceivedValues?.[t.id] ?? 0, tripId: t.id }));
}

export function AdjustmentsSection() {
  const [payments] = usePayments();
  const [adjustments, setAdjustments] = useAdjustments();
  const [trips] = useActiveTrips();
  const [paymentId, setPaymentId] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dialog, setDialog] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [action, setAction] = useState<Status>("cobrado");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

  const pending = useMemo(() => payments.map((payment) => {
    const items = paymentItems(payment, trips).filter((item) => Math.abs(item.expected - item.received) > 0.005);
    return { payment, items };
  }).filter((entry) => entry.items.length > 0).sort((a, b) => b.payment.date.localeCompare(a.payment.date)), [payments, trips]);

  const visible = paymentId ? pending.filter((x) => x.payment.id === paymentId) : pending;
  const selectedEntry = pending.find((x) => x.payment.id === selected?.id);

  const openAction = (payment: Payment, itemIds: string[]) => { setSelected(payment); setSelectedTrips(itemIds); setAction("cobrado"); setAmount(""); setNote(""); setReceivedDate(""); setDialog(true); };
  const save = () => {
    if (!selected) return;
    const value = Number(amount.replace(",", "."));
    if (!note.trim()) return toast.error(action === "aceito" ? "A justificativa é obrigatória." : "Informe uma observação para o histórico.");
    if (action === "recebido" && (!receivedDate || !Number.isFinite(value) || value <= 0)) return toast.error("Informe a data e o valor recebido posteriormente.");
    const signed = action === "recebido" ? value : action === "aceito" ? -(selectedEntry?.items.reduce((s, i) => s + i.expected - i.received, 0) ?? 0) : 0;
    const record: PaymentAdjustment = { id: uid(), paymentId: selected.id, tripId: selectedTrips.length === 1 ? selectedTrips[0].replace("trip:", "") : undefined, type: action === "aceito" ? "correcao" : "ressarcimento", amount: signed, note: `${note.trim()}${receivedDate ? ` · Recebido em ${formatDateBR(receivedDate)}` : ""}${selectedTrips.length > 0 ? ` · Itens: ${selectedTrips.length}` : ""}`, createdAt: new Date().toISOString(), status: action };
    setAdjustments((prev) => [...prev, record]); setDialog(false); toast.success("Evento registrado no histórico.");
  };

  return <div className="flex flex-col gap-5">
    <div><h2 className="text-3xl font-bold">Ajustes</h2><p className="text-muted-foreground">Acompanhe pagamentos divergentes, cobranças, justificativas e complementos.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="size-4" /> 1. Selecione um recebimento</CardTitle></CardHeader><CardContent className="flex flex-wrap items-end gap-3"><div className="min-w-64 flex-1"><Label>Recebimento</Label><Select value={paymentId || "todos"} onValueChange={(v) => setPaymentId(v === "todos" ? "" : v)}><SelectTrigger><SelectValue placeholder="Todos os recebimentos com incongruência" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os recebimentos com incongruência</SelectItem>{pending.map(({ payment, items }) => <SelectItem key={payment.id} value={payment.id}>{formatDateBR(payment.date)} · {items.length} divergência(s)</SelectItem>)}</SelectContent></Select></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="size-4 text-destructive" /> {pending.length} recebimento(s) pendente(s)</div></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ArrowRight className="size-4" /> 2. Revise somente as incongruências</CardTitle></CardHeader><CardContent className="flex flex-col gap-3">{visible.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Nenhuma incongruência encontrada.</div> : visible.map(({ payment, items }) => { const history = adjustments.filter((a) => a.paymentId === payment.id); const totalExpected = items.reduce((s, i) => s + i.expected, 0); const totalReceived = items.reduce((s, i) => s + i.received, 0); return <div key={payment.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">Recebimento de {formatDateBR(payment.date)}</p><p className="text-sm text-muted-foreground">Esperado {formatBRL(totalExpected)} · Recebido {formatBRL(totalReceived)} · Diferença {formatBRL(totalExpected - totalReceived)}</p></div><Button size="sm" onClick={() => openAction(payment, items.map((i) => i.id))}><Plus className="mr-1 size-4" /> Registrar ação</Button></div><div className="mt-3 flex flex-col gap-2">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 p-2 text-sm"><Badge variant={item.received === 0 ? "destructive" : "outline"}>{item.received === 0 ? "Não pago" : "Parcial"}</Badge><span className="min-w-48 flex-1">{item.label}</span><span>Esperado: <b>{formatBRL(item.expected)}</b></span><span>Recebido: <b>{formatBRL(item.received)}</b></span><span className="font-semibold text-destructive">Falta: {formatBRL(item.expected - item.received)}</span></div>)}</div>{history.length > 0 && <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><History className="size-3" /> {history.length} evento(s) no histórico</div>}</div>; })}</CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="size-4" /> 3. Acompanhe o histórico</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2"><Badge variant="outline">{pending.length} em análise</Badge><Badge variant="secondary">{adjustments.filter((a) => a.status === "cobrado").length} em cobrança</Badge><Badge variant="default">{adjustments.filter((a) => a.status === "recebido").length} recebidos posteriormente</Badge></div></CardContent></Card>
    <Dialog open={dialog} onOpenChange={setDialog}><DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg"><DialogHeader><DialogTitle>Registrar ação da pendência</DialogTitle></DialogHeader><div className="flex flex-col gap-4"><div><Label>Tratamento</Label><Select value={action} onValueChange={(v) => setAction(v as Status)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label>Viagens relacionadas</Label><div className="flex flex-col gap-2 rounded-md border p-3">{selectedEntry?.items.map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedTrips.includes(item.id)} onChange={(e) => setSelectedTrips((prev) => e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id))} />{item.label} · falta {formatBRL(item.expected - item.received)}</label>)}</div></div>{action === "recebido" && <div className="grid gap-3 sm:grid-cols-2"><div><Label>Data do complemento</Label><Input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} /></div><div><Label>Valor recebido</Label><Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></div></div>}<div><Label>{action === "aceito" ? "Justificativa obrigatória" : "Observação"}</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Descreva a cobrança, justificativa ou pagamento separado..." /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button><Button onClick={save}><CheckCircle2 className="mr-1 size-4" /> Salvar evento</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
