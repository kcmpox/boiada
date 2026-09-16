"use client"

import { useMemo, useState, useEffect } from "react"
import { Code2, Download, Save } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSlaughterhouses, useTrips, useTrucks, useFuelings, useExpenses, useTolls, useDeductions, useReimbursements, usePayments } from "@/lib/storage";
import type { Fueling, Expense, OtherDeductionReimbursement } from "@/lib/storage"

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const tabs = ["Viagens", "Abastecimentos", "Manutenções", "Pedágios", "Descontos", "Reembolsos"]

export function AlternativeLayoutDialog({ open, title, onBack, payment }: { open: boolean; title: string; onBack: () => void; payment?: any }) {
  const [trucks] = useTrucks()
  const [slaughterhouses] = useSlaughterhouses()
  const [trips] = useTrips()
  const [fuelings] = useFuelings()
  const [expenses] = useExpenses()
  const [tolls] = useTolls()
  const [deductions] = useDeductions()
  const [reimbursements] = useReimbursements()
  const [payments, setPayments] = usePayments()
  const [truckId, setTruckId] = useState("")
  const [destination, setDestination] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [receivedValue, setReceivedValue] = useState("")
  const [notes, setNotes] = useState("")
  const [activeTab, setActiveTab] = useState("Viagens")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tripEdits, setTripEdits] = useState<Record<string, { cte: string; minuta: string }>>({})
  const [jsonOpen, setJsonOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<OtherDeductionReimbursement | null>(null)
  const [recordFormOpen, setRecordFormOpen] = useState(false)
  const [receivedByItem, setReceivedByItem] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!payment) return
    setPaymentDate(payment.date ?? new Date().toISOString().slice(0, 10))
    setTruckId(payment.truckId ?? "")
    setDestination(payment.destination ?? "")
    setSelectedIds([...(payment.tripIds ?? []), ...(payment.fuelingItemIds ?? []), ...(payment.expenseIds ?? []), ...(payment.tollIds ?? []), ...(payment.deductionIds ?? []), ...(payment.reimbursementIds ?? [])])
    setReceivedValue(payment.receivedValue === undefined ? "" : String(payment.receivedValue))
    setReceivedByItem(Object.fromEntries(Object.entries(payment.receivedByItem ?? {}).map(([id, value]) => [id, String(value)])))
    setNotes(payment.notes ?? "")
  }, [payment])

  const tripTolls = useMemo(() => (Array.isArray(tolls) ? tolls : []).filter((toll) => toll && toll.responsibility !== "minha").map((toll) => ({ id: String(toll.id), date: String(toll.dateTime ?? ""), truckId: String(toll.truckId ?? ""), description: String(toll.tollName ?? "Pedágio"), amount: Number(toll.value) || 0, responsibility: toll.responsibility, tripId: toll.tripId })), [tolls])
  const fuelingItems = useMemo(() => (Array.isArray(fuelings) ? fuelings : []).flatMap((fueling) => (Array.isArray(fueling?.items) ? fueling.items : []).map((item, index) => ({ id: `${fueling.id}:${index}`, fuelingId: fueling.id, date: String(fueling.date ?? ""), truckId: String(fueling.truckId ?? ""), description: String(item.description ?? "Abastecimento"), amount: Math.max(0, Number(item.quantity) * Number(item.unitPrice) - Number(item.discount || 0)), responsibility: item.responsibility ?? fueling.responsibility }))), [fuelings])
  const maintenanceItems = useMemo(() => (Array.isArray(expenses) ? expenses : []).filter(Boolean).map((expense) => ({ id: String(expense.id), date: String(expense.date ?? ""), truckId: String(expense.truckId ?? ""), description: String(expense.description ?? expense.category ?? "Manutenção"), amount: Number(expense.value) || 0, responsibility: expense.responsibility })), [expenses])
  const receivedTotal = 0

  const filteredTrips = useMemo(() => {
    if (!truckId || !destination) return []
    return trips.filter((trip) => trip.truckId === truckId && trip.destination === destination && (!dateFrom || trip.date >= dateFrom) && trip.date <= paymentDate && !payments.some((item) => item.id !== payment?.id && item.tripIds?.includes(trip.id)))
  }, [dateFrom, destination, paymentDate, trips, truckId])
  const selectedTrips = filteredTrips.filter((trip) => selectedIds.includes(trip.id))
  const isOnOrBeforePayment = (value: unknown) => !value || String(value).slice(0, 10) <= paymentDate
  const visibleFuelingItems = fuelingItems.filter((item) => isOnOrBeforePayment(item.date) && item.responsibility !== "minha").sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const visibleMaintenanceItems = maintenanceItems.filter((item) => isOnOrBeforePayment(item.date) && item.responsibility !== "minha").sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const visibleTolls = tripTolls.filter((item) => isOnOrBeforePayment(item.date) && item.responsibility !== "minha").sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const visibleDeductions = (Array.isArray(deductions) ? deductions : []).filter((item) => item && isOnOrBeforePayment(item.date)).sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const visibleReimbursements = (Array.isArray(reimbursements) ? reimbursements : []).filter((item) => item && isOnOrBeforePayment(item.date)).sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const selectedFuelingItems = visibleFuelingItems.filter((item) => selectedIds.includes(item.id))
  const selectedExpenses = visibleMaintenanceItems.filter((item) => selectedIds.includes(item.id))
  const selectedDeductions = visibleDeductions.filter((item) => selectedIds.includes(item.id))
  const selectedReimbursements = visibleReimbursements.filter((item) => selectedIds.includes(item.id))
  const grossValue = selectedTrips.reduce((total, trip) => total + (trip.tableValue ?? trip.finalValue ?? 0), 0)
  const signedValue = (items: Array<{ amount: number; responsibility?: string }>) => items.reduce((total, item) => total + (item.responsibility === "ressarcir" ? item.amount : item.responsibility === "desconto" ? -item.amount : 0), 0)
  const fuelingsValue = signedValue(selectedFuelingItems)
  const maintenanceValue = signedValue(selectedExpenses)
  const tollsValue = signedValue(tripTolls.filter((item) => selectedIds.includes(item.id)))
  const informedValue = (id: string, fallback: number) => {
    const raw = receivedByItem[id]
    if (raw === undefined || raw.trim() === "") return fallback
    const parsed = Number(raw.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : fallback
  }
  const tripKm = (trip: { kmStart?: number; kmEnd?: number; manualDistance?: number }) => {
    if ((trip.kmStart ?? 0) > 0 || (trip.kmEnd ?? 0) > 0) return Math.max(0, (trip.kmEnd ?? 0) - (trip.kmStart ?? 0))
    return trip.manualDistance ?? 0
  }
  const computedReceivedTotal = selectedTrips.reduce((sum, trip) => sum + informedValue(trip.id, (trip.tableValue ?? trip.finalValue ?? 0) * 0.9), 0) + signedValue(selectedFuelingItems.map((item) => ({ ...item, amount: informedValue(item.id, item.amount) }))) + signedValue(selectedExpenses.map((item) => ({ ...item, amount: informedValue(item.id, item.amount) }))) + signedValue(tripTolls.filter((item) => selectedIds.includes(item.id)).map((item) => ({ ...item, amount: informedValue(item.id, item.amount) }))) - selectedDeductions.reduce((sum, item) => sum + informedValue(item.id, item.amount || 0), 0) + selectedReimbursements.reduce((sum, item) => sum + informedValue(item.id, item.amount || 0), 0)
  const deductionsValue = selectedDeductions.reduce((total, item) => total + (item.amount || 0), 0)
  const reimbursementsValue = selectedReimbursements.reduce((total, item) => total + (item.amount || 0), 0)
  const rentValue = grossValue * 0.1
  const expectedValue = (grossValue * 0.9) + fuelingsValue + maintenanceValue + tollsValue + reimbursementsValue - deductionsValue
  const ready = Boolean(truckId && destination)
  const parsedReceived = Number(receivedValue.replace(",", "."))
  const finalReceivedValue = receivedValue.trim() === "" || !Number.isFinite(parsedReceived) ? computedReceivedTotal : parsedReceived
  const receivedDifference = Number((finalReceivedValue - computedReceivedTotal).toFixed(2))
  const completeReceivedByItem = Object.fromEntries([...selectedTrips.map((item) => [item.id, informedValue(item.id, (item.tableValue ?? item.finalValue ?? 0) * 0.9)]), ...selectedFuelingItems.map((item) => [item.id, informedValue(item.id, item.amount)]), ...selectedExpenses.map((item) => [item.id, informedValue(item.id, item.amount)]), ...tripTolls.filter((item) => selectedIds.includes(item.id)).map((item) => [item.id, informedValue(item.id, item.amount)]), ...selectedDeductions.map((item) => [item.id, informedValue(item.id, item.amount)]), ...selectedReimbursements.map((item) => [item.id, informedValue(item.id, item.amount)])])
  const paymentJson = { id: payment?.id ?? crypto.randomUUID(), date: paymentDate, truckId, destination, deductionIds: selectedDeductions.map((item) => item.id), expenseIds: selectedExpenses.map((item) => item.id), fuelingItemIds: selectedFuelingItems.map((item) => item.id), reimbursementIds: selectedReimbursements.map((item) => item.id), tollIds: visibleTolls.filter((toll) => selectedIds.includes(toll.id)).map((toll) => toll.id), tripIds: selectedTrips.map((trip) => trip.id), deductionsValue: -deductionsValue, expenseValue: maintenanceValue, fuelingsValue, reimbursementsValue, tollValue: tollsValue, grossValue, rentPercent: 0.1, rentValue, expectedValue, calculatedReceivedValue: computedReceivedTotal, receivedValue: finalReceivedValue, receivedDifference, receivedByItem: completeReceivedByItem, notes }
  const jsonValue = { type: "registro-recebimento", version: 2, exportedAt: new Date().toISOString(), payment: paymentJson, trips: selectedTrips, fuelings: selectedFuelingItems, tolls: visibleTolls.filter((toll) => selectedIds.includes(toll.id)), expenses: selectedExpenses, deductions: selectedDeductions, reimbursements: selectedReimbursements }

  const saveReceipt = () => {
    if (!truckId || !destination) { toast.error("Selecione o caminhão e o frigorífico antes de salvar."); return }
    setPayments((current) => [{ ...paymentJson, destination: destination as any } as any, ...current.filter((item) => item.id !== paymentJson.id)]);
    toast.success("Recebimento salvo");
    onBack()
  }

  const toggleTrip = (id: string) => setSelectedIds((current) => { const selecting = !current.includes(id); if (trips.some((trip) => trip.id === id)) { const linkedTolls = tripTolls.filter((toll) => toll.tripId === id).map((toll) => toll.id); return selecting ? [...current, id, ...linkedTolls.filter((tollId) => !current.includes(tollId))] : current.filter((item) => item !== id); } return selecting ? [...current, id] : current.filter((item) => item !== id) })
  const editTrip = (id: string, key: "cte" | "minuta", value: string) => setTripEdits((current) => ({ ...current, [id]: { cte: current[id]?.cte ?? trips.find((trip) => trip.id === id)?.cte ?? "", minuta: current[id]?.minuta ?? trips.find((trip) => trip.id === id)?.minuta ?? "", [key]: value } }))

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onBack()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Selecione as viagens incluídas neste recebimento e confira o resumo.</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4 rounded-lg border bg-muted/30 p-4"><div><p className="text-xs text-muted-foreground">Data do pagamento</p><button type="button" className="font-semibold underline-offset-2 hover:underline" onClick={() => { const value = (() => { const input = document.createElement("input"); input.type = "date"; input.value = paymentDate; input.onchange = () => input.value && setPaymentDate(input.value); input.click(); return null })(); if (value) { const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (match) setPaymentDate(`${match[3]}-${match[2]}-${match[1]}`); else toast.error("Informe a data no formato dd/mm/aaaa.") } }}>{paymentDate.split("-").reverse().join("/")}</button></div></div>
          <Card><CardContent className="grid gap-4 pt-6 sm:grid-cols-3"><div><Label>Caminhão <span className="text-destructive">*</span></Label><Select value={truckId} onValueChange={(value) => { setTruckId(value); setSelectedIds([]) }}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{trucks.map((truck) => <SelectItem key={truck.id} value={truck.id}>{truck.plate}{truck.name ? ` — ${truck.name}` : ""}</SelectItem>)}</SelectContent></Select></div><div><Label>Frigorífico <span className="text-destructive">*</span></Label><Select value={destination} onValueChange={(value) => { setDestination(value); setSelectedIds([]) }}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{slaughterhouses.filter((item) => item.active).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="date-from">Data inicial</Label><Input id="date-from" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setSelectedIds([]) }} /></div></CardContent></Card>
          {ready && <Card><CardHeader><div className="flex flex-wrap gap-2">{tabs.map((tab) => <Button key={tab} type="button" size="sm" variant={activeTab === tab ? "secondary" : "ghost"} onClick={() => setActiveTab(tab)}>{tab}</Button>)}</div></CardHeader><CardContent>{activeTab !== "Viagens" ? <div className="space-y-3">{((activeTab === "Abastecimentos" ? visibleFuelingItems : activeTab === "Manutenções" ? visibleMaintenanceItems : activeTab === "Pedágios" ? visibleTolls : activeTab === "Descontos" ? visibleDeductions : activeTab === "Reembolsos" ? visibleReimbursements : []) as any[]).filter((item) => item && typeof item === "object" && "truckId" in item && item.truckId === truckId).map((item) => { const baseAmount = Number(item.value ?? item.amount) || 0; return <div key={item.id} className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-sm ${item.responsibility === "ressarcir" ? "border-emerald-500" : ""}`}><Checkbox className="mt-1" checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleTrip(item.id)} /><div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="truncate font-medium">{item.description ?? item.tollName ?? "Lançamento financeiro"}</p><p className="truncate text-xs text-muted-foreground">{String(item.date ?? item.dateTime ?? "").slice(0, 10)} • {trucks.find((truck) => truck.id === item.truckId)?.plate ?? "Caminhão"} • {item.fuelingId ? `Abastecimento ${item.fuelingId}` : "Lançamento financeiro"}</p></div><div className="shrink-0 text-left sm:text-right"><p className="text-xs text-muted-foreground">Valor item</p><p className="font-semibold">{money(baseAmount)}</p><p className="font-semibold text-primary">{money(informedValue(item.id, baseAmount))}</p></div></div><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>Quantidade: {item.quantity ?? "—"}</span><span>Preço unitário: {item.unitPrice != null ? money(Number(item.unitPrice)) : "—"}</span>{item.responsibility && <span>Responsável: {String(item.responsibility)}</span>}</div>{selectedIds.includes(item.id) && <div className="mt-3 flex items-center gap-2 border-t pt-3"><Label htmlFor={`received-${item.id}`} className="text-xs">{activeTab === "Descontos" || item.responsibility === "desconto" ? "Valor descontado" : "Valor recebido"}</Label><Input id={`received-${item.id}`} className="w-36" inputMode="decimal" placeholder={money(baseAmount)} value={receivedByItem[item.id] ?? ""} onChange={(event) => setReceivedByItem((current) => ({ ...current, [item.id]: event.target.value }))} /></div>}</div></div> })}</div> : <div className="space-y-3">{filteredTrips.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{dateFrom ? "Nenhuma viagem encontrada no período." : "Informe uma data inicial ou selecione as viagens disponíveis até a data do pagamento."}</p> : filteredTrips.map((trip) => { const edit = tripEdits[trip.id] ?? { cte: trip.cte ?? "", minuta: trip.minuta ?? "" }; const bruto = trip.tableValue ?? trip.finalValue ?? 0; const liquido = bruto * 0.9; return <div key={trip.id} className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm"><div className="flex w-full items-start gap-3"><Checkbox className="mt-1" checked={selectedIds.includes(trip.id)} onCheckedChange={() => toggleTrip(trip.id)} />{selectedIds.includes(trip.id) && <Input className="w-32 shrink-0" inputMode="decimal" aria-label={`Valor recebido da viagem ${trip.id}`} placeholder={money(liquido)} value={receivedByItem[trip.id] ?? ""} onChange={(event) => setReceivedByItem((current) => ({ ...current, [trip.id]: event.target.value }))} />}<div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="truncate font-medium">{trip.origin} → {slaughterhouses.find((item) => item.id === trip.destination)?.name ?? trip.destination}</p><p className="truncate text-xs text-muted-foreground">{trip.date} • {trucks.find((truck) => truck.id === trip.truckId)?.plate ?? "Caminhão"} • {tripKm(trip).toLocaleString("pt-BR")} km</p></div><div className="shrink-0 text-left sm:text-right"><p className="text-xs text-muted-foreground">Valor viagem</p><p className="font-semibold">{money(bruto)}</p><p className="font-semibold text-primary">{money(liquido)}</p></div></div><div className="mt-2 flex flex-wrap items-center gap-2 text-xs">{edit.cte ? <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => { const value = window.prompt("Editar CTe", edit.cte); if (value !== null) editTrip(trip.id, "cte", value) }}>CTe: {edit.cte}</button> : <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => { const value = window.prompt("Informar CTe", ""); if (value !== null) editTrip(trip.id, "cte", value) }}>Adicionar CTe</button>}<button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => { const value = window.prompt("Informar Minuta", edit.minuta); if (value !== null) editTrip(trip.id, "minuta", value) }}>{edit.minuta ? `Minuta ${edit.minuta}` : "Adicionar Minuta"}</button></div></div></div></div> })}</div>}</CardContent></Card>}
          <Card><CardContent className="flex flex-col gap-4 pt-6"><div className="grid gap-3 sm:grid-cols-7"><div><p className="text-sm text-muted-foreground">Valor bruto</p><p className="font-semibold">{money(grossValue)}</p></div><div><p className="text-sm text-muted-foreground">Aluguel de 10%</p><p className="font-semibold text-destructive">- {money(rentValue)}</p></div><div><p className="text-sm text-muted-foreground">Combustíveis</p><p className={`font-semibold ${fuelingsValue < 0 ? "text-destructive" : ""}`}>{money(fuelingsValue)}</p></div><div><p className="text-sm text-muted-foreground">Manutenções</p><p className={`font-semibold ${maintenanceValue < 0 ? "text-destructive" : ""}`}>{money(maintenanceValue)}</p></div><div><p className="text-sm text-muted-foreground">Pedágios</p><p className={`font-semibold ${tollsValue < 0 ? "text-destructive" : ""}`}>{money(tollsValue)}</p></div><div><p className="text-sm text-muted-foreground">Descontos e Reembolsos</p><p className={`font-semibold ${reimbursementsValue - deductionsValue < 0 ? "text-destructive" : "text-emerald-600"}`}>{money(reimbursementsValue - deductionsValue)}</p></div><div><p className="text-sm text-muted-foreground">Valor esperado</p><p className={`text-lg font-bold ${expectedValue < 0 ? "text-destructive" : "text-foreground"}`}>{money(expectedValue)}</p></div></div><Separator /><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="received-value">Valor recebido neste dia</Label><Input id="received-value" inputMode="decimal" placeholder="Se vazio, usa o valor líquido" value={receivedValue || (computedReceivedTotal ? String(computedReceivedTotal.toFixed(2)) : "")} onChange={(event) => setReceivedValue(event.target.value)} /></div><div><Label htmlFor="payment-notes">Observação</Label><Textarea id="payment-notes" rows={2} placeholder="Opcional" value={notes} onChange={(event) => setNotes(event.target.value)} /></div></div></CardContent></Card>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => { const blob = new Blob([JSON.stringify(jsonValue, null, 2)], { type: "application/json;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `recebimento-${paymentDate}.json`; link.style.display = "none"; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); toast.success("Registro baixado") }}><Download data-icon="inline-start" /> Baixar registro</Button><Button type="button" variant="outline" size="icon" aria-label="Exibir JSON do recebimento" title="Exibir JSON" onClick={() => setJsonOpen(true)}><Code2 /></Button><Button type="button" onClick={saveReceipt}><Save data-icon="inline-start" /> Salvar recebimento</Button></DialogFooter>
      </DialogContent>
      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}><DialogContent><DialogHeader><DialogTitle>JSON do recebimento</DialogTitle></DialogHeader><pre className="max-h-[55vh] overflow-auto rounded-lg bg-muted p-4 text-xs">{JSON.stringify(jsonValue, null, 2)}</pre></DialogContent></Dialog>
    </Dialog>
  )
}
