"use client";

import { useState, useTransition } from "react";
import { Select, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { confirmMigrationItem, ignoreMigrationItem } from "./actions";

interface Item {
  id: string;
  employeeNameRaw: string;
  employeeId: string | null;
  category: string;
  categoryLabel: string;
  size: string | null;
  quantity: number;
  dateRaw: string | null;
}

export function ReviewRow({
  item,
  employees,
}: {
  item: Item;
  employees: { id: string; label: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  function handleConfirm(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await confirmMigrationItem(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setHidden(true);
    });
  }

  function handleIgnore() {
    startTransition(async () => {
      await ignoreMigrationItem(item.id);
      setHidden(true);
    });
  }

  return (
    <li className="flex flex-col gap-3 px-5 py-4">
      <form action={handleConfirm} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="itemId" value={item.id} />
        <div className="min-w-[10rem]">
          <p className="text-xs text-slate-400">Nom (source)</p>
          <p className="text-sm font-medium text-slate-800">{item.employeeNameRaw}</p>
          {!item.employeeId && (
            <p className="text-xs text-amber-600">Non reconnu automatiquement</p>
          )}
        </div>
        <div className="w-48">
          <p className="mb-1 text-xs text-slate-400">Collaborateur</p>
          <Select name="employeeId" defaultValue={item.employeeId ?? ""} required>
            <option value="" disabled>
              Choisir...
            </option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-28">
          <p className="mb-1 text-xs text-slate-400">{item.categoryLabel}</p>
          <Input name="size" defaultValue={item.size ?? ""} placeholder="Taille" />
        </div>
        <div className="w-20">
          <p className="mb-1 text-xs text-slate-400">Qté</p>
          <Input name="quantity" type="number" min={1} defaultValue={item.quantity} />
        </div>
        <div className="w-28 text-xs text-slate-400">{item.dateRaw ?? "Date inconnue"}</div>

        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={handleIgnore}>
            Ignorer
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            Confirmer
          </Button>
        </div>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}
