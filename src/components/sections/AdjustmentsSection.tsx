import { useMemo, useState } from "react";
import { usePayments, useActiveTrips, useSlaughterhouses, useTrucks, formatBRL, formatDateBR } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";

export function AdjustmentsSection() {
  const [payments] = usePayments();
  const [trips] = useActiveTrips();
  const [slaughterhouses] = useSlaughterhouses();
  const [trucks] = useTrucks();
  const [truckFilter, setTruckFilter] = useState("todos");

  const paidTripIds = useMemo(() => {
    const ids = new Set<string>();
    (Array.isArray(payments) ? payments : []).forEach((payment) => (payment.tripIds ?? []).forEach((id) => ids.add(id)));
    return ids;
  }, [payments]);

  // Data da viagem paga mais recente: tudo antes dela e não pago está atrasado.
  const referenceDate = useMemo(() => {
    const paidDates = (Array.isArray(trips) ? trips : []).filter((trip) => paidTripIds.has(trip.id)).map((trip) => String(trip.date));
    return paidDates.length > 0 ? paidDates.sort().reverse()[0] : null;
  }, [trips, paidTripIds]);

  const overdue = useMemo(() => {
    if (!referenceDate) return [];
    return (Array.isArray(trips) ? trips : [])
      .filter((trip) => !paidTripIds.has(trip.id) && String(trip.date) < referenceDate)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [trips, paidTripIds, referenceDate]);

  const visible = truckFilter === "todos" ? overdue : overdue.filter((trip) => trip.truckId === truckFilter);
  const totalOverdue = visible.reduce((sum, trip) => sum + (trip.finalValue ?? trip.tableValue ?? 0), 0);
  const truckName = (id: string) => trucks.find((truck) => truck.id === id)?.plate ?? "Caminhão";
  const destinationName = (id: string) => slaughterhouses.find((item) => item.id === id)?.name ?? id;
  const daysLate = (date: string) => Math.max(0, Math.floor((Date.now() - new Date(`${date}T12:00:00`).getTime()) / 86400000));

  return <div className="flex flex-col gap-5">
    <div><h2 className="text-3xl font-bold">Viagens atrasadas</h2><p className="text-muted-foreground">Viagens anteriores à última viagem paga que ainda não entraram em nenhum recebimento.</p></div>

    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="size-4" /> Referência de atraso</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3 text-sm">
        {referenceDate ? <>
          <p>A viagem paga mais recente é do dia <b>{formatDateBR(referenceDate)}</b>. Todas as viagens anteriores a essa data e ainda não pagas estão atrasadas.</p>
          <Badge variant={overdue.length > 0 ? "destructive" : "secondary"}>{overdue.length} viagem(ns) atrasada(s)</Badge>
        </> : <p className="text-muted-foreground">Nenhuma viagem paga até agora — ainda não é possível medir atrasos.</p>}
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-4" /> Viagens em atraso</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-56"><Select value={truckFilter} onValueChange={setTruckFilter}><SelectTrigger><SelectValue placeholder="Todos os caminhões" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os caminhões</SelectItem>{trucks.map((truck) => <SelectItem key={truck.id} value={truck.id}>{truck.plate}{truck.name ? ` — ${truck.name}` : ""}</SelectItem>)}</SelectContent></Select></div>
          {visible.length > 0 && <span className="text-sm text-muted-foreground">Total em atraso: <b className="text-destructive">{formatBRL(totalOverdue)}</b></span>}
        </div>
        {!referenceDate ? <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Aguardando o primeiro recebimento com viagens.</div>
          : visible.length === 0 ? <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-muted-foreground"><CheckCircle2 className="size-4" /> Nenhuma viagem atrasada.</div>
          : visible.map((trip) => <div key={trip.id} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 p-3 text-sm">
              <Badge variant="destructive">{daysLate(String(trip.date))} dia(s) de atraso</Badge>
              <span className="min-w-48 flex-1 font-medium">{trip.origin} → {destinationName(trip.destination)}</span>
              <span>{formatDateBR(String(trip.date))}</span>
              <span>{truckName(trip.truckId)}</span>
              {(trip.minuta || trip.cte) && <span className="text-muted-foreground">{trip.minuta ? `Minuta ${trip.minuta}` : `CTe ${trip.cte}`}</span>}
              <span className="font-semibold">{formatBRL(trip.finalValue ?? trip.tableValue ?? 0)}</span>
            </div>)}
      </CardContent>
    </Card>
  </div>;
}
