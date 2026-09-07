"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { submitLineCorrection } from "./corrections-actions";

export function CorrectionButton({
  lineId,
  employeeId,
  itemLabel,
  currentQuantity,
}: {
  lineId: string;
  employeeId: string;
  itemLabel: string;
  currentQuantity: number;
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(currentQuantity);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitLineCorrection({
        lineId,
        newQuantity: quantity,
        reason,
        employeeId,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-slate-400 hover:text-blue-600"
      >
        Corriger
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Corriger — ${itemLabel}`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="corr-qty">Quantité correcte</Label>
            <Input
              id="corr-qty"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-slate-400">Quantité initiale : {currentQuantity}</p>
          </div>
          <div>
            <Label htmlFor="corr-reason">Raison de la correction</Label>
            <Input
              id="corr-reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : erreur de saisie, un seul pantalon donné en réalité"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer la correction"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
