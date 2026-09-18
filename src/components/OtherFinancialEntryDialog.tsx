import { useState } from "react"
import { formatDateBR } from "@/lib/storage";
import { Building2, Lock, Plus, Search, Pencil, Code2 } from "lucide-react";
import { JsonEditorDialog } from "@/components/JsonEditorDialog";
import { toast } from "sonner";
import { useSlaughterhouses, useTrucks, useDeductions, useReimbursements, useActiveTrips, useSettings, usePayments, uid, type OtherDeductionReimbursement } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EntryMode = "reembolso" | "desconto";

export function OtherFinancialEntryDialog({ mode }: { mode: EntryMode }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"diesel" | "outros" | "multa_contratual">(mode === "reembolso" ? "outros" : "multa_contratual");
  const [trucks] = useTrucks();
  const [slaughterhouses] = useSlaughterhouses();
  const [trips] = useActiveTrips();
  const [deductions, setDeductions] = useDeductions();
  const [reimbursements, setReimbursements] = useReimbursements();
  const records = (mode === "reembolso" ? reimbursements : deductions).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const setRecords = mode === "reembolso" ? setReimbursements : setDeductions;
  const [form, setForm] = useState({ truckId: "", destination: "", tripId: "", date: new Date().toISOString().slice(0, 10), description: "", amount: "" });
  const [tripRef, setTripRef] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jsonRecord, setJsonRecord] = useState<OtherDeductionReimbursement | null>(null);
  const [settings] = useSettings();
  const [payments] = usePayments();
  const lockedIds = new Set<string>((Array.isArray(payments) ? payments : []).flatMap((payment) => [...(payment.deductionIds ?? []), ...(payment.reimbursementIds ?? [])]));
  const title = mode === "reembolso" ? "Novo reembolso" : "Novo desconto";
  const visibleRecords = records.filter((record) => record.type === (mode === "reembolso" ? "acrescimo" : "abatimento")).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const update = (key: string, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingId && lockedIds.has(editingId)) {
      toast.error("Lançamento já pago — edição bloqueada.");
      return;
    }
    const amount = Number(form.amount.replace(",", "."));
    if (!form.truckId || !form.destination || !form.description.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe caminhão, frigorífico, descrição e um valor positivo.");
      return;
    }
    const record: OtherDeductionReimbursement = { id: uid(), date: form.date, truckId: form.truckId, destination: form.destination, tripId: form.tripId || undefined, type: mode === "reembolso" ? "acrescimo" : "abatimento", category: "outros", amount, description: form.description.trim(), createdAt: new Date().toISOString() };
    setRecords((previous) => { const next = editingId ? previous.map((item) => item.id === editingId ? { ...record, id: editingId, createdAt: item.createdAt } : item) : [record, ...previous]; return next; });
    setEditingId(null);
    setOpen(false);
    setForm({ truckId: "", destination: "", tripId: "", date: new Date().toISOString().slice(0, 10), description: "", amount: "" });
    setTripRef("");
    toast.success(`${title} criado.`);
  };
  return <>
    <div className="flex flex-col gap-4"><Button className="self-start" onClick={() => setOpen(true)}><Plus data-icon="inline-start" /> {title}</Button>{visibleRecords.length > 0 && <div className="space-y-2">{visibleRecords.map((record) => { const locked = lockedIds.has(record.id); return <Card key={record.id} className="p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><p className="font-semibold">{record.description}</p><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{record.type === "acrescimo" ? "Reembolso" : "Desconto"}</span>{locked && <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600"><Lock className="size-3" /> Pago</span>}</div><div className="grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2"><span>Data: {formatDateBR(record.date)}</span><span>Valor: {record.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span>Frigorífico: {slaughterhouses.find((item) => item.id === record.destination)?.name ?? "Não informado"}</span><span>Caminhão: {trucks.find((item) => item.id === record.truckId)?.plate ?? "Não informado"}</span>{record.tripId && <span className="sm:col-span-2">Viagem vinculada: {trips.find((item) => item.id === record.tripId)?.cte ?? trips.find((item) => item.id === record.tripId)?.minuta ?? record.tripId}</span>}</div></div><div className="flex items-center gap-2"><><Button type="button" size="icon" variant="ghost" aria-label="Editar lançamento" title={locked ? "Lançamento já pago — edição bloqueada" : "Editar lançamento"} disabled={locked} onClick={() => { setEditingId(record.id); setType("outros"); setForm({ truckId: record.truckId ?? "", destination: record.destination, tripId: record.tripId ?? "", date: record.date, description: record.description, amount: String(record.amount) }); setTripRef(""); setOpen(true) }}><Pencil className="size-4" /></Button>{settings.editorMode && <Button type="button" size="icon" variant="ghost" aria-label="Editar JSON" title={locked ? "Lançamento já pago — edição bloqueada" : "Editar JSON"} disabled={locked} onClick={() => setJsonRecord(record)}><Code2 className="size-4" /></Button>}</></div></div></Card>; })}</div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Escolha o tipo e preencha os dados do lançamento.</DialogDescription></DialogHeader>
      <div className="flex flex-col gap-4"><div><Label>Tipo de {mode}</Label><Select value={type} onValueChange={(value) => setType(value as typeof type)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{mode === "reembolso" ? <><SelectItem value="diesel">Repasse do diesel</SelectItem><SelectItem value="outros">Outros</SelectItem></> : <><SelectItem value="multa_contratual">Multa Contratual</SelectItem><SelectItem value="outros">Outros</SelectItem></>}</SelectContent></Select></div>
        {type !== "outros" ? <Card className="flex min-h-40 items-center justify-center p-6 text-center"><div><Building2 className="mx-auto mb-3 size-9 text-muted-foreground" /><p className="font-medium">Esta página está em construção.</p></div></Card> : <form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><div><Label>Caminhão</Label><Select value={form.truckId} onValueChange={(value) => update("truckId", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{trucks.map((truck) => <SelectItem key={truck.id} value={truck.id}>{truck.plate} — {truck.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Frigorífico</Label><Select value={form.destination} onValueChange={(value) => update("destination", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{slaughterhouses.filter((item) => item.active).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="trip-ref">CTe/minuta</Label><div className="flex gap-2"><Input id="trip-ref" value={tripRef} onChange={(event) => setTripRef(event.target.value)} placeholder="Digite o CTe ou a minuta" /><Button type="button" size="icon" variant="outline" aria-label="Pesquisar viagem" title="Pesquisar viagem" onClick={() => { const ref = tripRef.trim().toLowerCase(); const matches = ref ? trips.filter((trip) => trip.cte?.toLowerCase() === ref || trip.minuta?.toLowerCase() === ref) : []; if (matches.length === 1) { update("tripId", matches[0].id); if (!form.truckId) update("truckId", matches[0].truckId); if (!form.destination) update("destination", matches[0].destination); toast.success("Viagem encontrada"); } else if (matches.length > 1) toast.warning("Mais de uma viagem encontrada. Refine a busca."); else toast.error("Nenhuma viagem encontrada."); }}><Search data-icon="inline-start" /></Button></div>{form.tripId && <p className="mt-1 text-xs text-muted-foreground">Viagem vinculada.</p>}</div><div><Label>Data</Label><Input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></div><div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} /></div><div><Label>Valor</Label><Input inputMode="decimal" value={form.amount} onChange={(event) => update("amount", event.target.value)} placeholder="0,00" /></div><DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Salvar {mode}</Button></DialogFooter></form>}
      </div>
    </DialogContent></Dialog><JsonEditorDialog open={!!jsonRecord} onOpenChange={(open) => !open && setJsonRecord(null)} title={`Editar ${mode === "reembolso" ? "reembolso" : "desconto"}`} data={jsonRecord} onSave={(updated) => { if (updated && typeof updated === "object" && jsonRecord) setRecords((current) => current.map((item) => item.id === jsonRecord.id ? { ...item, ...(updated as Partial<OtherDeductionReimbursement>), id: item.id } : item)); setJsonRecord(null) }} /></div>
  </>;
}
