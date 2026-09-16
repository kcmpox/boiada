import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePayments, type Payment } from "@/lib/storage";

const ID_FIELDS = [
  "tripIds",
  "fuelingItemIds",
  "expenseIds",
  "tollIds",
  "deductionIds",
  "reimbursementIds",
] as const;

type IdField = (typeof ID_FIELDS)[number];

const listOf = (payment: Payment, field: IdField): string[] => {
  const value = (payment as unknown as Record<string, unknown>)[field];
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
};

export function IntegrityCheckButton() {
  const [payments] = usePayments();

  const runCheck = () => {
    const list = Array.isArray(payments) ? payments : [];
    const missingByPayment: Array<{ recebimento: string; campo: string; id: string }> = [];
    const seen = new Map<string, { field: IdField; paymentId: string }[]>();

    for (const payment of list) {
      const received = payment.receivedByItem ?? {};
      const receivedKeys = Object.keys(received);

      for (const field of ID_FIELDS) {
        for (const id of listOf(payment, field)) {
          const baseId = field === "fuelingItemIds" ? id.split(":")[0] : id;
          const hasReceived =
            field === "fuelingItemIds"
              ? receivedKeys.some((key) => key === id || key.split(":")[0] === baseId)
              : receivedKeys.includes(id);
          if (!hasReceived) {
            missingByPayment.push({ recebimento: payment.id, campo: field, id });
          }
          const key = `${field}::${id}`;
          const bucket = seen.get(key) ?? [];
          bucket.push({ field, paymentId: payment.id });
          seen.set(key, bucket);
        }
      }
    }

    const duplicates = [...seen.entries()]
      .filter(([, uses]) => uses.length > 1)
      .map(([key, uses]) => ({
        campo: key.split("::")[0],
        id: key.split("::").slice(1).join("::"),
        recebimentos: uses.map((use) => use.paymentId),
      }));

    console.group(
      `%c[Integridade dos recebimentos] ${new Date().toLocaleString("pt-BR")}`,
      "color:#8b4513;font-weight:bold",
    );
    console.log(`Registros analisados: ${list.length}`);

    console.group(`Itens fora de receivedByItem: ${missingByPayment.length}`);
    if (missingByPayment.length === 0) console.log("OK — todos os itens possuem valor em receivedByItem.");
    else console.table(missingByPayment);
    console.groupEnd();

    console.group(`Itens repetidos entre recebimentos: ${duplicates.length}`);
    if (duplicates.length === 0) console.log("OK — nenhum item aparece em mais de um recebimento.");
    else
      console.table(
        duplicates.map((item) => ({
          campo: item.campo,
          id: item.id,
          recebimentos: item.recebimentos.join(", "),
        })),
      );
    console.groupEnd();

    console.group("Detalhe por recebimento");
    for (const payment of list) {
      const received = Object.keys(payment.receivedByItem ?? {});
      console.log({
        id: payment.id,
        data: payment.date,
        itens: Object.fromEntries(ID_FIELDS.map((field) => [field, listOf(payment, field)])),
        receivedByItem: received,
      });
    }
    console.groupEnd();
    console.groupEnd();

    const problems = missingByPayment.length + duplicates.length;
    if (problems === 0) toast.success("Integridade OK — veja os detalhes no console.");
    else toast.error(`${problems} problema(s) encontrado(s) — veja o console.`);
  };

  return (
    <Button
      size="lg"
      variant="outline"
      onClick={runCheck}
      aria-label="Verificar integridade dos recebimentos"
      title="Verificar integridade dos recebimentos"
    >
      <ShieldCheck className="h-4 w-4" />
    </Button>
  );
}
