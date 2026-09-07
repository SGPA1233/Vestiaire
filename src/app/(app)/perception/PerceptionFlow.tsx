"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, Checkbox } from "@/components/ui/Field";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Modal } from "@/components/ui/Modal";
import { ItemThumbnail } from "@/components/ui/ItemThumbnail";
import { CATEGORY_LABELS } from "@/lib/config";
import type { ActiveCatalog } from "@/lib/catalog";
import { submitPerception } from "./actions";
import type { ItemCategory } from "@prisma/client";

interface CurrentlyHeldItem {
  id: string;
  itemName: string;
  size: string;
  quantityRemaining: number;
  category: ItemCategory;
}

interface LineState {
  variantId: string;
  quantity: number;
}

interface ReturnState {
  checked: boolean;
  reusable: boolean;
}

export function PerceptionFlow({
  employee,
  sizeMap,
  catalog,
  currentlyHeld,
  campaignName,
}: {
  employee: { id: string; firstName: string; lastName: string };
  sizeMap: Record<string, string>;
  catalog: ActiveCatalog;
  currentlyHeld: CurrentlyHeldItem[];
  campaignName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [lines, setLines] = useState<Record<string, LineState>>(() => {
    const initial: Record<string, LineState> = {};
    for (const item of catalog) {
      const preferredSize = sizeMap[item.category];
      const defaultVariant =
        item.variants.find((v) => v.size === preferredSize) ?? item.variants[0];
      if (defaultVariant) {
        initial[item.id] = { variantId: defaultVariant.id, quantity: 0 };
      }
    }
    return initial;
  });

  const [returns, setReturns] = useState<Record<string, ReturnState>>(() => {
    const initial: Record<string, ReturnState> = {};
    for (const l of currentlyHeld) {
      initial[l.id] = { checked: false, reusable: true };
    }
    return initial;
  });

  function setLineVariant(itemId: string, variantId: string) {
    setLines((prev) => ({ ...prev, [itemId]: { variantId, quantity: 0 } }));
  }

  function setLineQuantity(itemId: string, quantity: number) {
    setLines((prev) => ({ ...prev, [itemId]: { ...prev[itemId], quantity } }));
  }

  function toggleReturn(lineId: string, checked: boolean) {
    setReturns((prev) => ({ ...prev, [lineId]: { ...prev[lineId], checked } }));
  }

  function setReturnReusable(lineId: string, reusable: boolean) {
    setReturns((prev) => ({ ...prev, [lineId]: { ...prev[lineId], reusable } }));
  }

  const summary = useMemo(() => {
    const distributed: { label: string; qty: number }[] = [];
    for (const item of catalog) {
      const line = lines[item.id];
      if (!line || line.quantity <= 0) continue;
      const variant = item.variants.find((v) => v.id === line.variantId);
      if (!variant) continue;
      distributed.push({ label: `${item.name} — taille ${variant.size}`, qty: line.quantity });
    }

    const recovered: { label: string; qty: number }[] = [];
    for (const l of currentlyHeld) {
      const ret = returns[l.id];
      if (!ret?.checked) continue;
      recovered.push({ label: `${l.itemName} — taille ${l.size}`, qty: l.quantityRemaining });
    }

    return { distributed, recovered };
  }, [catalog, lines, currentlyHeld, returns]);

  const hasAnything = summary.distributed.length > 0 || summary.recovered.length > 0;

  async function handleConfirm() {
    setError(null);
    const payload = {
      employeeId: employee.id,
      lines: Object.entries(lines)
        .filter(([, l]) => l.quantity > 0)
        .map(([, l]) => ({ itemVariantId: l.variantId, quantity: l.quantity })),
      returns: currentlyHeld
        .filter((l) => returns[l.id]?.checked)
        .map((l) => ({
          distributionLineId: l.id,
          quantity: l.quantityRemaining,
          reusable: returns[l.id].reusable,
        })),
    };

    startTransition(async () => {
      const result = await submitPerception(payload);
      if (!result.success) {
        setError(result.error);
        setConfirmOpen(false);
        return;
      }
      setConfirmOpen(false);
      setSuccessId(result.distributionId);
    });
  }

  if (successId) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Perception enregistrée avec succès</h1>
          <p className="mt-1 text-sm text-slate-500">
            {employee.firstName} {employee.lastName}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push(`/collaborateurs/${employee.id}`)}>
            Voir la fiche collaborateur
          </Button>
          <Button onClick={() => router.push("/perception")}>Nouvelle perception</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-32">
      <div>
        <Link href="/perception" className="text-sm text-slate-500 hover:text-slate-700">
          ← Changer de collaborateur
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {employee.firstName} {employee.lastName}
        </h1>
        <p className="text-sm text-slate-500">Campagne active : {campaignName}</p>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Articles à distribuer</h2>
        <div className="flex flex-col divide-y divide-slate-100">
          {catalog.map((item) => {
            const line = lines[item.id];
            if (!line) return null;
            const variant = item.variants.find((v) => v.id === line.variantId);
            const stock = variant?.stock ?? 0;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <ItemThumbnail imageUrl={item.imageUrl} size="sm" />
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{CATEGORY_LABELS[item.category]}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={line.variantId}
                    onChange={(e) => setLineVariant(item.id, e.target.value)}
                    className="w-28"
                  >
                    {item.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.size}
                      </option>
                    ))}
                  </Select>
                  <span
                    className={`w-24 shrink-0 text-xs font-medium ${
                      stock <= 0 ? "text-red-600" : stock <= 5 ? "text-amber-600" : "text-slate-400"
                    }`}
                  >
                    Stock : {stock}
                  </span>
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(v) => setLineQuantity(item.id, v)}
                    max={stock}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {currentlyHeld.length > 0 && (
        <Card>
          <h2 className="mb-1 text-base font-semibold text-slate-800">Articles récupérés</h2>
          <p className="mb-4 text-sm text-slate-500">
            Cochez les équipements que le collaborateur restitue aujourd&apos;hui.
          </p>
          <div className="flex flex-col divide-y divide-slate-100">
            {currentlyHeld.map((l) => {
              const ret = returns[l.id];
              return (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <label className="flex items-center gap-3">
                    <Checkbox
                      checked={ret?.checked ?? false}
                      onChange={(e) => toggleReturn(l.id, e.target.checked)}
                    />
                    <span className="text-sm text-slate-700">
                      {l.itemName} — taille {l.size} · x{l.quantityRemaining}
                    </span>
                  </label>
                  {ret?.checked && (
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      <Checkbox
                        checked={ret.reusable}
                        onChange={(e) => setReturnReusable(l.id, e.target.checked)}
                      />
                      Réutilisable (remis en stock)
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:pl-72">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            {hasAnything ? (
              <>
                <span className="font-medium">{summary.distributed.length}</span> article(s) à
                distribuer
                {summary.recovered.length > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium">{summary.recovered.length}</span> à récupérer
                  </>
                )}
              </>
            ) : (
              "Sélectionnez au moins un article"
            )}
          </div>
          <Button
            size="lg"
            disabled={!hasAnything || isPending}
            onClick={() => setConfirmOpen(true)}
          >
            Valider la perception
          </Button>
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmer la perception">
        <div className="flex flex-col gap-4 text-sm">
          {summary.distributed.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-slate-700">Vous allez distribuer :</p>
              <ul className="list-inside list-disc text-slate-600">
                {summary.distributed.map((d, i) => (
                  <li key={i}>
                    {d.qty} × {d.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.recovered.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-slate-700">Vous allez récupérer :</p>
              <ul className="list-inside list-disc text-slate-600">
                {summary.recovered.map((d, i) => (
                  <li key={i}>
                    {d.qty} × {d.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
