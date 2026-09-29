"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { submitPerception } from "../perception/actions";

interface HeldItem {
  id: string;
  itemName: string;
  size: string;
  quantityRemaining: number;
}

interface ReturnState {
  checked: boolean;
  reusable: boolean;
}

export function ReintegrationFlow({
  employee,
  currentlyHeld,
}: {
  employee: { id: string; firstName: string; lastName: string };
  currentlyHeld: HeldItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Tout est coché par défaut : le cas d'usage principal est "il rend tout",
  // il suffit alors de décocher les exceptions puis de confirmer.
  const [returns, setReturns] = useState<Record<string, ReturnState>>(() => {
    const initial: Record<string, ReturnState> = {};
    for (const l of currentlyHeld) initial[l.id] = { checked: true, reusable: true };
    return initial;
  });

  const selectedCount = Object.values(returns).filter((r) => r.checked).length;

  function toggleAll(checked: boolean) {
    setReturns((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) next[id] = { ...next[id], checked };
      return next;
    });
  }

  function toggle(id: string, checked: boolean) {
    setReturns((prev) => ({ ...prev, [id]: { ...prev[id], checked } }));
  }

  function setReusable(id: string, reusable: boolean) {
    setReturns((prev) => ({ ...prev, [id]: { ...prev[id], reusable } }));
  }

  function handleConfirm() {
    setError(null);
    const payload = {
      employeeId: employee.id,
      lines: [],
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
        return;
      }
      // Direct vers la fiche collaborateur : l'historique et les équipements
      // en possession y confirment visuellement la réintégration.
      router.push(`/collaborateurs/${employee.id}`);
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-32">
      <div>
        <Link href="/reintegration" className="text-sm text-slate-500 hover:text-slate-700">
          ← Changer de collaborateur
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {employee.firstName} {employee.lastName}
        </h1>
        <p className="text-sm text-slate-500">
          Décochez ce qui n&apos;est pas restitué, puis confirmez.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Matériel en sa possession</h2>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="text-brand-green-700 hover:underline"
            >
              Tout cocher
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="text-brand-green-700 hover:underline"
            >
              Tout décocher
            </button>
          </div>
        </div>
        <div className="flex flex-col divide-y divide-slate-100">
          {currentlyHeld.map((l) => {
            const ret = returns[l.id];
            return (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={ret?.checked ?? false}
                    onChange={(e) => toggle(l.id, e.target.checked)}
                  />
                  <span className="text-sm text-slate-700">
                    {l.itemName} — taille {l.size} · x{l.quantityRemaining}
                  </span>
                </label>
                {ret?.checked && (
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <Checkbox
                      checked={ret.reusable}
                      onChange={(e) => setReusable(l.id, e.target.checked)}
                    />
                    Réutilisable (remis en stock)
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:pl-72">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            {selectedCount > 0
              ? `${selectedCount} article(s) à reprendre`
              : "Sélectionnez au moins un article"}
          </div>
          <Button
            size="lg"
            disabled={selectedCount === 0 || isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Enregistrement..." : "Confirmer la réintégration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
