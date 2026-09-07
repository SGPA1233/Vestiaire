"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import type { ActiveCatalog } from "@/lib/catalog";
import { submitReception } from "./actions";

interface Row {
  itemId: string;
  variantId: string;
  quantity: number;
}

export function ReceptionForm({ catalog }: { catalog: ActiveCatalog }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [supplier, setSupplier] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const firstItem = catalog[0];
  const [rows, setRows] = useState<Row[]>(() =>
    firstItem && firstItem.variants[0]
      ? [{ itemId: firstItem.id, variantId: firstItem.variants[0].id, quantity: 0 }]
      : []
  );

  function addRow() {
    if (!firstItem?.variants[0]) return;
    setRows((prev) => [
      ...prev,
      { itemId: firstItem.id, variantId: firstItem.variants[0].id, quantity: 0 },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function handleItemChange(index: number, itemId: string) {
    const item = catalog.find((i) => i.id === itemId);
    const variantId = item?.variants[0]?.id ?? "";
    updateRow(index, { itemId, variantId });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validRows = rows.filter((r) => r.quantity > 0);
    if (validRows.length === 0) {
      setError("Ajoutez au moins une ligne avec une quantité supérieure à 0.");
      return;
    }

    startTransition(async () => {
      const result = await submitReception({
        supplier: supplier || undefined,
        orderReference: orderReference || undefined,
        date,
        lines: validRows.map((r) => ({ itemVariantId: r.variantId, quantity: r.quantity })),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <Card className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Réception enregistrée</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push("/stock")}>
            Voir le stock
          </Button>
          <Button onClick={() => window.location.reload()}>Nouvelle réception</Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="supplier">Fournisseur (facultatif)</Label>
            <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="orderReference">Référence de commande (facultatif)</Label>
            <Input
              id="orderReference"
              value={orderReference}
              onChange={(e) => setOrderReference(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Lignes reçues</h2>
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => {
            const item = catalog.find((i) => i.id === row.itemId);
            return (
              <div key={index} className="flex flex-wrap items-center gap-3">
                <Select
                  value={row.itemId}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  className="w-56"
                >
                  {catalog.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={row.variantId}
                  onChange={(e) => updateRow(index, { variantId: e.target.value })}
                  className="w-28"
                >
                  {item?.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={0}
                  value={row.quantity}
                  onChange={(e) => updateRow(index, { quantity: Number(e.target.value) })}
                  className="w-24"
                />
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Retirer
                </button>
              </div>
            );
          })}
        </div>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={addRow}>
          + Ajouter une ligne
        </Button>
      </Card>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Enregistrer la réception"}
        </Button>
      </div>
    </form>
  );
}
