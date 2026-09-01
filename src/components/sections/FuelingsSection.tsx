import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useFuelings,
  useTrucks,
  useDrivers,
  usePayments,
  useSettings,
  useActiveTrips,
  useTrips,
  uid,
  formatBRL,
  formatDateBR,
  toBrasiliaISO,
  toBrasiliaInput,
  type Fueling,
  type FuelingItem,
  type ExpenseResponsibility,
} from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Calendar, Truck as TruckIcon, FileDown, X, Fuel, User as UserIcon, Lock, Archive, RotateCcw, Code as Code2, Search, MapPin, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AttachmentsField, AttachmentsList } from "@/components/Attachments";
import type { Attachment } from "@/lib/storage";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { JsonEditorDialog } from "@/components/JsonEditorDialog";
import { TruckNav, type TruckNavItem } from "@/components/TruckNav";
import { Switch } from "@/components/ui/switch";
import { FuelingAlternativeDialog } from "@/components/sections/FuelingAlternativeDialog";
import {
  buildPdfDoc,
  previewPdf,
  pdfKpiRow,
  pdfSectionTitle,
  pdfTableLayout,
  PDF_COLORS,
  th,
} from "@/lib/pdf-theme";

/** Compat: aceita registros antigos que usavam apenas deductFromPayment. */
export function fuelResponsibility(f: Fueling): ExpenseResponsibility {
  if (f.responsibility) return f.responsibility;
  return f.deductFromPayment ? "desconto" : "minha";
}

/** Responsabilidade de um item: a do próprio item ou, na falta, a do registro. */
export function itemResponsibility(f: Fueling, item: FuelingItem): ExpenseResponsibility {
  return item.responsibility ?? fuelResponsibility(f);
}

const FUEL_RESP_LABEL: Record<ExpenseResponsibility, string> = {
  minha: "Minha despesa",
  desconto: "Frigorífico desconta",
  ressarcir: "Frigorífico ressarce",
};

export { FuelingsPage as FuelingsSection };

function totalOf(f: Fueling) {
  const itemsTotal = f.items.reduce(
    (s, i) => s + i.quantity * i.unitPrice - (i.discount || 0),
    0,
  );
  return Math.max(0, itemsTotal - (f.generalDiscount || 0));
}
function litersOf(f: Fueling) {
  return f.items.filter((i) => i.kind === "combustivel").reduce((s, i) => s + i.quantity, 0);
}

function FuelingsPage() {
  const [fuelings, setFuelings] = useFuelings();
  const [trucks] = useTrucks();
  const [allTrips, setTrips] = useTrips();
  const [drivers] = useDrivers();
  const [payments] = usePayments();
  const lockedIds = useMemo(() => new Set(payments.flatMap((p) => p.fuelingIds)), [payments]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Fueling | null>(null);
  const [settings] = useSettings();
  const [jsonEditItem, setJsonEditItem] = useState<Fueling | null>(null);
  const [jsonEditOpen, setJsonEditOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [driverFilter, setDriverFilter] = useState<string>("__all__");
  const [truckFilter, setTruckFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<"__all__" | "aberto" | "pago" | "arquivado">("__all__");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return fuelings.filter((f) => {
      const d = f.date.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      if (driverFilter === "__none__" && f.driverId) return false;
      if (driverFilter !== "__all__" && driverFilter !== "__none__" && f.driverId !== driverFilter)
        return false;
      if (truckFilter === "__archived__" && !f.archived) return false;
      if (truckFilter === "__without_fueling__") return false;
      if (truckFilter !== "__all__" && !truckFilter.startsWith("__") && f.truckId !== truckFilter) return false;
      if (statusFilter === "aberto" && lockedIds.has(f.id)) return false;
      if (statusFilter === "pago" && !lockedIds.has(f.id)) return false;
      if (statusFilter === "arquivado" && !f.archived) return false;
      if (statusFilter !== "arquivado" && f.archived) return false;
      return true;
    });
  }, [fuelings, dateFrom, dateTo, driverFilter, truckFilter, statusFilter, lockedIds]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
    [filtered],
  );
  const totalValue = useMemo(() => sorted.reduce((s, f) => s + totalOf(f), 0), [sorted]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );
  useMemo(() => {
    setPage(1);
  }, [dateFrom, dateTo, driverFilter, truckFilter, statusFilter]);

  const navItems = useMemo<TruckNavItem[]>(() => {
    const items: TruckNavItem[] = [
      {
        key: "__all__",
        label: "Todos os abastecimentos",
        desc: "Ver todos os registros",
        icon: Fuel,
        count: fuelings.length,
      },
    ];
    items.push({ key: "__archived__", label: "Arquivados", desc: "Registros arquivados", icon: Archive, count: fuelings.filter((f) => f.archived).length });
    items.push({ key: "__without_fueling__", label: "Viagens sem abastecimento", desc: "Viagens sem registro", icon: ClipboardList, count: allTrips.filter((trip) => !trip.archived && !trip.withoutFueling && !fuelings.some((fueling) => fueling.tripId === trip.id)).length });
    for (const tr of trucks) {
      items.push({
        key: tr.id,
        label: tr.name,
        desc: tr.plate,
        icon: TruckIcon,
        count: fuelings.filter((f) => f.truckId === tr.id).length,
      });
    }
    return items;
  }, [trucks, fuelings, allTrips]);

  // Para km/l: precisamos do hodômetro anterior do mesmo caminhão (anterior em data)
  const prevOdometer = (f: Fueling): number | null => {
    const candidates = fuelings
      .filter((x) => x.truckId === f.truckId && x.id !== f.id)
      .filter((x) => x.date < f.date || (x.date === f.date && x.id < f.id))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    return candidates[0]?.odometer ?? null;
  };

  const remove = (id: string) => {
    if (lockedIds.has(id)) {
      toast.error("Registro está em um recebimento. Exclua o recebimento antes.");
      return;
    }
    setFuelings((prev) => prev.filter((f) => f.id !== id));
    toast.success("Registro removido");
  };

  const generatePDF = async () => {
    if (filtered.length === 0) {
      toast.error("Nenhum abastecimento no período.");
      return;
    }
    try {
      const grouped = new Map<string, Fueling[]>();
      for (const f of filtered) {
        const arr = grouped.get(f.truckId) ?? [];
        arr.push(f);
        grouped.set(f.truckId, arr);
      }

      const periodo =
        dateFrom || dateTo
          ? `Período: ${dateFrom ? new Date(dateFrom + "T00:00").toLocaleDateString("pt-BR") : "início"} até ${dateTo ? new Date(dateTo + "T00:00").toLocaleDateString("pt-BR") : "hoje"}`
          : "Período: todos os abastecimentos";

      const grandTotal = filtered.reduce((s, f) => s + totalOf(f), 0);
      const grandLiters = filtered.reduce((s, f) => s + litersOf(f), 0);

      const content: unknown[] = [
        pdfKpiRow([
          { label: "Registros", value: String(filtered.length) },
          { label: "Litros", value: grandLiters.toLocaleString("pt-BR"), color: PDF_COLORS.accent },
          { label: "Total", value: formatBRL(grandTotal), color: PDF_COLORS.primaryDark },
        ]),
        { text: periodo, style: "subtle", margin: [0, 0, 0, 8] },
      ];

      const truckIds = Array.from(grouped.keys());
      truckIds.forEach((truckId, idx) => {
        const list = grouped.get(truckId)!;
        const truck = trucks.find((x) => x.id === truckId);
        const ordered = [...list].sort((a, b) => a.date.localeCompare(b.date));
        const subtotal = ordered.reduce((s, f) => s + totalOf(f), 0);
        const subLiters = ordered.reduce((s, f) => s + litersOf(f), 0);
        const label = `${truck?.name ?? "Caminhão removido"} — ${truck?.plate ?? "—"}`;
        content.push({ ...pdfSectionTitle(label), ...(idx > 0 ? { pageBreak: "before" } : {}) });

        const rows: unknown[] = [
          [th("ID abastecimento"), th("Data"), th("Hodômetro"), th("Descrição"), th("Quantidade"), th("Preço unitário"), th("Valor com desconto")],
        ];

        // ordered por data: hodômetro anterior dentro do grupo
        for (let i = 0; i < ordered.length; i++) {
          const f = ordered[i];
          for (const item of f.items) {
            rows.push([
              f.id,
              formatDateBR(f.date),
              f.odometer.toLocaleString("pt-BR"),
              item.description || "Combustível",
              item.quantity.toLocaleString("pt-BR"),
              formatBRL(item.unitPrice),
              formatBRL(item.quantity * item.unitPrice - (item.discount ?? 0)),
            ]);
          }
        }
        rows.push([
          {
            text: `Subtotal (${ordered.length})`,
            colSpan: 6,
            alignment: "right",
            bold: true,
            color: PDF_COLORS.primaryDark,
          },
          {},
          {},
          {},
          {},
          {},
          { text: formatBRL(subtotal), bold: true, color: PDF_COLORS.primaryDark },
        ]);

        content.push({
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "auto", "*", "auto", "auto", "auto"],
            body: rows,
          },
          layout: pdfTableLayout,
          fontSize: 9,
        });
      });

      content.push({
        text: `Total geral: ${grandLiters.toLocaleString("pt-BR")} L — ${formatBRL(grandTotal)}`,
        style: "total",
        margin: [0, 16, 0, 0],
      });

      const docDefinition = buildPdfDoc({
        title: "Relatório de Combustíveis",
        subtitle: periodo,
        content,
        orientation: "landscape",
      });

      await previewPdf(
        docDefinition,
        `relatorio-abastecimentos-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Despesas em Postos de Combustíveis</h2>
          <p className="text-muted-foreground">Combustíveis, óleos e serviços por caminhão.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="lg" onClick={generatePDF}>
            <FileDown className="mr-1 h-4 w-4" /> Gerar PDF
          </Button>
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button size="lg" onClick={() => setEditing(null)}>
                <Plus className="mr-1 h-4 w-4" /> Novo registro
              </Button>
            </DialogTrigger>
            <FuelingDialog
              key={editing?.id ?? "new"}
              fueling={editing}
              allFuelings={fuelings}
              onSaved={() => {
                setOpen(false);
                setEditing(null);
              }}
            />
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <TruckNav items={navItems} value={truckFilter} onChange={(key) => { setTruckFilter(key); if (key === "__archived__") setStatusFilter("arquivado"); else setStatusFilter("__all__"); }} />
        <div className="space-y-6">
      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">De</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-44"
            />
          </div>
          <div>
            <Label className="text-xs">Motorista</Label>
            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="__none__">Sem motorista</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                    {!d.active ? " ⚰️" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(dateFrom ||
            dateTo ||
            driverFilter !== "__all__" ||
            truckFilter !== "__all__" ||
            statusFilter !== "__all__") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setDriverFilter("__all__");
                setTruckFilter("__all__");
                setStatusFilter("__all__");
              }}
            >
              <X className="mr-1 h-3 w-3" /> Limpar
            </Button>
          )}
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">{sorted.length} registro(s)</p>
            <p className="text-lg font-bold text-primary">{formatBRL(totalValue)}</p>
          </div>
        </div>
      </Card>

      {trucks.length === 0 && (
        <Card className="p-6 shadow-soft">
          <p className="text-sm">
            Cadastre ao menos um{" "}
            <Link to="/cadastros" className="text-primary underline">
              caminhão
            </Link>{" "}
            antes de registrar abastecimentos.
          </p>
        </Card>
      )}

      {truckFilter === "__without_fueling__" ? (
        <div className="space-y-3">{allTrips.filter((trip) => !trip.archived && !trip.withoutFueling && !fuelings.some((fueling) => fueling.tripId === trip.id)).map((trip) => <Card key={trip.id} className="p-5"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{trip.origin} → {trip.destination}</p><p className="text-sm text-muted-foreground">{formatDateBR(trip.date)} • {trip.minuta || trip.cte || "Sem documento"}</p></div><Button size="sm" onClick={() => { setTrips((prev) => prev.map((item) => item.id === trip.id ? { ...item, withoutFueling: true } : item)); toast.success("Viagem marcada sem abastecimento."); }}>Marcar sem abastecimento</Button></div></Card>)}</div>
      ) : sorted.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Nenhum abastecimento registrado.
        </Card>
      ) : (
        <div className="space-y-3">
          {paged.flatMap((source) => {
            const groups = Array.from(new Set(source.items.map((it) => itemResponsibility(source, it))));
            return groups.map((responsibility) => ({ ...source, id: `${source.id}::${responsibility}`, items: source.items.filter((it) => itemResponsibility(source, it) === responsibility) }));
          }).map((f) => {
            const sourceId = f.id.split("::")[0];
            const source = fuelings.find((item) => item.id === sourceId) ?? f;
            const truck = trucks.find((x) => x.id === source.truckId);
            const driver = drivers.find((x) => x.id === f.driverId);
            const total = totalOf(f);
            const liters = litersOf(f);
            const prev = prevOdometer(source);
            const kml =
              prev != null && liters > 0 && f.odometer > prev ? (f.odometer - prev) / liters : null;
            const locked = lockedIds.has(f.id);
            return (
              <Card key={f.id} className="p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDateBR(f.date)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TruckIcon className="h-3 w-3" />
                        {truck?.name ?? "—"} ({truck?.plate ?? "—"})
                      </span>
                      {driver && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <UserIcon className="h-3 w-3" />
                          {driver.name}
                        </span>
                      )}
                      {(() => {
                        const set = new Set(f.items.map((it) => itemResponsibility(f, it)));
                        if (set.size > 1) {
                          return <Badge variant="outline">Misto</Badge>;
                        }
                        const r = [...set][0] ?? fuelResponsibility(f);
                        return (
                          <Badge
                            variant={
                              r === "minha"
                                ? "destructive"
                                : r === "ressarcir"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {FUEL_RESP_LABEL[r]}
                          </Badge>
                        );
                      })()}
                      {locked && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                          <Lock className="mr-1 h-3 w-3" /> Em recebimento
                        </Badge>
                      )}
                    </div>
                    <p className="flex items-center gap-2 text-base font-semibold">
                      <Fuel className="h-4 w-4 text-accent" />
                      Hodômetro: {f.odometer.toLocaleString("pt-BR")} km
                      {liters > 0 && (
                        <span className="text-muted-foreground">
                          {" "}
                          • {liters.toLocaleString("pt-BR")} L
                        </span>
                      )}
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-0.5">
                      {f.items.map((it, idx) => (
                        <li key={idx} className="flex flex-wrap items-center gap-1">
                          <span>
                            {it.kind === "combustivel" ? "⛽ " : "• "}
                            {it.description ||
                              (it.kind === "combustivel" ? "Combustível" : "Item")}{" "}
                            — {it.quantity.toFixed(3).replace(".", ",")}
                            {it.kind === "combustivel" ? " L" : ""} × {formatBRL(it.unitPrice)}
                            {it.discount ? ` - ${formatBRL(it.discount)}` : ""} ={" "}
                            {formatBRL(it.quantity * it.unitPrice - (it.discount || 0))}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {(f.nfe || f.generalDiscount) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {f.nfe && (
                          <Badge variant="outline">NFe: {f.nfe}</Badge>
                        )}
                        {f.generalDiscount ? (
                          <Badge variant="outline">
                            Desc. geral: - {formatBRL(f.generalDiscount)}
                          </Badge>
                        ) : null}
                      </div>
                    )}
                    <AttachmentsList items={f.attachments} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-primary">{formatBRL(total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {kml != null ? `${kml.toFixed(2)} km/L` : "km/L —"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={locked}
                      onClick={() => {
                        setEditing(source);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {settings.editorMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar JSON"
                        onClick={() => {
                          setJsonEditItem(source);
                          setJsonEditOpen(true);
                        }}
                      >
                        <Code2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={locked}
                      title={source.archived ? "Desarquivar" : "Arquivar"}
                      onClick={() => {
                        setFuelings((prev) => prev.map((item) => item.id === source.id ? { ...item, archived: !item.archived } : item));
                        toast.success(source.archived ? "Abastecimento desarquivado" : "Abastecimento arquivado");
                      }}
                    >
                      {source.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={locked}
                      onClick={() => remove(source.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
        </div>
      </div>

      <JsonEditorDialog
        open={jsonEditOpen}
        onOpenChange={setJsonEditOpen}
        title={`Editar abastecimento — ${jsonEditItem?.date ?? ""}`}
        data={jsonEditItem}
        onSave={(updated) => {
          if (jsonEditItem && updated && typeof updated === "object") {
            setFuelings((prev) =>
              prev.map((f) => (f.id === jsonEditItem.id ? ({ ...f, ...updated } as Fueling) : f)),
            );
          }
        }}
      />
    </div>
  );
}

function FuelingDialog({
  fueling,
  allFuelings,
  onSaved,
}: {
  fueling: Fueling | null;
  allFuelings: Fueling[];
  onSaved: () => void;
}) {
  const [, setFuelings] = useFuelings();
  const [trucks] = useTrucks();
  const [drivers] = useDrivers();
  const [trips] = useActiveTrips();
  const [allTrips] = useTrips();
  const [showLinkedTrips, setShowLinkedTrips] = useState(Boolean(fueling?.tripId));
  const [alternativeLayout, setAlternativeLayout] = useState(false);
  const selectableTrips = useMemo(() => {
    if (showLinkedTrips) return allTrips.filter((trip) => !trip.withoutFueling || trip.id === fueling?.tripId);
    const linkedTripIds = new Set(allFuelings.map((item) => item.tripId).filter(Boolean));
    return allTrips.filter((trip) => trip.id === fueling?.tripId || (!trip.withoutFueling && !linkedTripIds.has(trip.id)));
  }, [showLinkedTrips, allTrips, allFuelings, fueling?.tripId]);

  const availableDrivers = useMemo(
    () => drivers.filter((d) => d.active || d.id === fueling?.driverId),
    [drivers, fueling?.driverId],
  );

  const [date, setDate] = useState(
    toBrasiliaInput(fueling?.date),
  );
  const [truckId, setTruckId] = useState(fueling?.truckId ?? trucks[0]?.id ?? "");
  const [driverId, setDriverId] = useState(fueling?.driverId ?? availableDrivers[0]?.id ?? "");
  const [tripId, setTripId] = useState(fueling?.tripId ?? "");
  const [tripRef, setTripRef] = useState("");
  const [odometer, setOdometer] = useState(fueling ? String(fueling.odometer) : "");
  const [responsibility, setResponsibility] = useState<ExpenseResponsibility>(
    fueling ? fuelResponsibility(fueling) : "desconto",
  );
  const [items, setItems] = useState<FuelingItem[]>(
    fueling?.items?.length
      ? fueling.items
      : [{ kind: "combustivel", description: "Diesel S10", quantity: 0, unitPrice: 0 }],
  );
  const [generalDiscount, setGeneralDiscount] = useState(
    fueling?.generalDiscount != null ? String(fueling.generalDiscount) : "",
  );
  const [nfe, setNfe] = useState(fueling?.nfe ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(fueling?.attachments ?? []);

  // Hodômetro anterior do caminhão selecionado
  const lastOdometer = useMemo(() => {
    const list = allFuelings
      .filter((x) => x.truckId === truckId && x.id !== fueling?.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    return list[0]?.odometer ?? null;
  }, [allFuelings, truckId, fueling?.id]);

  const effectiveOdometer = odometer !== "" ? Number(odometer) : (lastOdometer ?? 0);
  const totalLiters = items
    .filter((i) => i.kind === "combustivel")
    .reduce((s, i) => s + Number(i.quantity || 0), 0);
  const itemsTotal = items.reduce(
    (s, i) =>
      s + Number(i.quantity || 0) * Number(i.unitPrice || 0) - Number(i.discount || 0),
    0,
  );
  const total = Math.max(0, itemsTotal - (Number(generalDiscount) || 0));
  const kml =
    lastOdometer != null && totalLiters > 0 && effectiveOdometer > lastOdometer
      ? (effectiveOdometer - lastOdometer) / totalLiters
      : null;

  const updateItem = (idx: number, patch: Partial<FuelingItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const addItem = (kind: FuelingItem["kind"]) =>
    setItems((prev) => [
      ...prev,
      { kind, description: kind === "combustivel" ? "Diesel S10" : "", quantity: 0, unitPrice: 0 },
    ]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckId) {
      toast.error("Selecione um caminhão.");
      return;
    }
    if (items.length === 0) {
      toast.error("Adicione ao menos um item.");
      return;
    }
    const cleanItems = items
      .map((i) => ({
        ...i,
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice) || 0,
        discount: i.discount ? Number(i.discount) || 0 : undefined,
      }))
      .filter((i) => i.quantity > 0 || i.unitPrice > 0);
    if (cleanItems.length === 0) {
      toast.error("Preencha pelo menos um item com quantidade/valor.");
      return;
    }
    const normalizedRef = tripRef.trim().toLowerCase();
    const matches = normalizedRef ? trips.filter((trip) => trip.cte?.toLowerCase() === normalizedRef || trip.minuta?.toLowerCase() === normalizedRef) : [];
    if (normalizedRef && matches.length > 1) toast.warning("Mais de uma viagem possui essa minuta/CTE. Selecione a viagem correta.");
    const resolvedTripId = matches.length === 1 ? matches[0].id : tripId;
    if (matches.length === 1) setTripId(resolvedTripId);
    const finalOdometer = odometer !== "" ? Number(odometer) : (lastOdometer ?? 0);
    const genDisc = Number(generalDiscount) || 0;
    const next: Fueling = {
      id: fueling?.id ?? uid(),
      date: toBrasiliaISO(date),
      truckId,
      driverId: driverId || undefined,
      tripId: resolvedTripId || undefined,
      odometer: finalOdometer,
      items: cleanItems,
      deductFromPayment: responsibility === "desconto",
      responsibility,
      generalDiscount: genDisc > 0 ? genDisc : undefined,
      nfe: nfe.trim() || undefined,
      attachments,
    };
    setFuelings((prev) =>
      fueling ? prev.map((p) => (p.id === fueling.id ? next : p)) : [...prev, next],
    );
    toast.success(
      fueling ? "Abastecimento atualizado" : `Abastecimento registrado — ${formatBRL(total)}`,
    );
    onSaved();
  };

  if (alternativeLayout) {
    return <FuelingAlternativeDialog onBack={() => setAlternativeLayout(false)} />;
  }

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-center">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Novo layout <Switch checked={alternativeLayout} onCheckedChange={setAlternativeLayout} aria-label="Ativar novo layout" /></label>
      </div>
      <DialogHeader className="rounded-xl bg-primary/5 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Fuel className="h-5 w-5" /></span>
          <div><DialogTitle className="text-xl">{fueling ? "Editar abastecimento" : "Novo abastecimento"}</DialogTitle><p className="text-sm text-muted-foreground">Registre o abastecimento e classifique cada item.</p></div>
        </div>
      </DialogHeader>
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Data e hora</Label>
          <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Caminhão</Label>
          <Select value={truckId} onValueChange={setTruckId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {trucks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.plate})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Motorista</Label>
          <Select value={driverId} onValueChange={setDriverId}>
            <SelectTrigger>
              <SelectValue
                placeholder={availableDrivers.length ? "Selecione" : "Nenhum cadastrado"}
              />
            </SelectTrigger>
            <SelectContent>
              {availableDrivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                  {!d.active ? " (inativo)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Viagem vinculada</Label>
          <Select value={tripId || "__none__"} onValueChange={(value) => setTripId(value === "__none__" ? "" : value)}>
            <SelectTrigger><SelectValue placeholder="Selecione uma viagem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem vínculo</SelectItem>
              {selectableTrips.map((trip) => <SelectItem key={trip.id} value={trip.id}>{formatDateBR(trip.date)} — {trip.origin} → {trip.destination}{allFuelings.some((item) => item.tripId === trip.id) ? " (já vinculada)" : ""}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Checkbox checked={showLinkedTrips} onCheckedChange={(checked) => setShowLinkedTrips(checked === true)} /> Exibir viagens já vinculadas</label>
          <div className="mt-2 flex gap-2">
            <Input value={tripRef} onChange={(e) => setTripRef(e.target.value)} placeholder="Minuta ou CTe" />
            <Button type="button" size="icon" variant="outline" aria-label="Pesquisar viagem" title="Pesquisar viagem" onClick={() => {
              const ref = tripRef.trim().toLowerCase();
              const matches = ref ? trips.filter((trip) => trip.cte?.toLowerCase() === ref || trip.minuta?.toLowerCase() === ref) : [];
              if (matches.length === 1) { setTripId(matches[0].id); toast.success("Viagem encontrada"); }
              else if (matches.length > 1) toast.warning("Mais de uma viagem encontrada. Escolha no campo acima.");
              else toast.error("Nenhuma viagem encontrada.");
            }}><Search className="h-4 w-4" /></Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Digite uma minuta ou CTe e pesquise para vincular.</p>
        </div>
        <div>
          <Label>Hodômetro (km)</Label>
          <Input
            type="number"
            min="0"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            placeholder={
              lastOdometer != null ? `Anterior: ${lastOdometer}` : "Sem leitura anterior"
            }
          />
          {odometer === "" && lastOdometer != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              Em branco → reaproveita {lastOdometer.toLocaleString("pt-BR")} km.
            </p>
          )}
        </div>

        <div className="col-span-full space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Itens</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addItem("combustivel")}
              >
                <Plus className="mr-1 h-3 w-3" /> Combustível
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addItem("outro")}>
                <Plus className="mr-1 h-3 w-3" /> Outro item
              </Button>
            </div>
          </div>
          {items.map((it, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-end rounded-md border border-border p-3"
            >
              <div className="col-span-2">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={it.kind}
                  onValueChange={(v) => updateItem(idx, { kind: v as FuelingItem["kind"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combustivel">Combustível</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={it.description}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                  placeholder={it.kind === "combustivel" ? "Diesel S10" : "Óleo, lavagem..."}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{it.kind === "combustivel" ? "Litros" : "Qtd"}</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Valor unit. (R$)</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={it.unitPrice}
                  onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Desc. (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={it.discount ?? ""}
                  onChange={(e) =>
                    updateItem(idx, {
                      discount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="0,00"
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

            </div>
          ))}
        </div>

        <div className="col-span-full">
          <Label>Responsável pelo pagamento</Label>
          <RadioGroup
            value={responsibility}
            onValueChange={(v) => setResponsibility(v as ExpenseResponsibility)}
            className="mt-2 flex flex-wrap gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="fr-minha" value="minha" />
              <Label htmlFor="fr-minha" className="cursor-pointer font-normal">
                Minha despesa
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="fr-desc" value="desconto" />
              <Label htmlFor="fr-desc" className="cursor-pointer font-normal">
                Frigorífico desconta
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="fr-ress" value="ressarcir" />
              <Label htmlFor="fr-ress" className="cursor-pointer font-normal">
                Frigorífico ressarce
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="col-span-full">
          <AttachmentsField
            value={attachments}
            onChange={setAttachments}
            label="Anexos (comprovante do posto, NF...)"
          />
        </div>

        <div className="col-span-full grid gap-4 sm:grid-cols-2">
          <div>
            <Label>NFe (opcional)</Label>
            <Input
              value={nfe}
              onChange={(e) => setNfe(e.target.value)}
              placeholder="Número da NF-e"
            />
          </div>
          <div>
            <Label>Desconto geral (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={generalDiscount}
              onChange={(e) => setGeneralDiscount(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="col-span-full rounded-lg border border-border bg-secondary/50 p-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Litros</p>
              <p className="font-semibold">{totalLiters.toLocaleString("pt-BR")} L</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Km/L estimado</p>
              <p className="font-semibold">{kml != null ? kml.toFixed(2) : "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">{formatBRL(total)}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="col-span-full">
          <Button type="submit" size="lg">
            {fueling ? "Salvar alterações" : "Salvar abastecimento"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
