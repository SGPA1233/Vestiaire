"use client";

import { useRef, useState, useTransition } from "react";
import { Input, Label, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createUser } from "./actions";

export function NewUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSetupUrl(null);
    startTransition(async () => {
      const result = await createUser(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSetupUrl(result.setupUrl);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email professionnel</Label>
        <Input id="email" name="email" type="email" required placeholder="prenom.nom@entreprise.ch" />
      </div>
      <div>
        <Label htmlFor="role">Rôle</Label>
        <Select id="role" name="role" defaultValue="ADMIN">
          <option value="ADMIN">Administrateur</option>
          <option value="READONLY">Lecture seule</option>
        </Select>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {setupUrl && (
        <div className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          <p className="font-medium">Compte créé.</p>
          <p className="mt-1">
            Transmettez ce lien unique à la personne concernée. Il expire dans 24 heures.
          </p>
          <p className="mt-2 break-all rounded bg-white/70 px-2 py-2 font-mono text-xs">
            {setupUrl}
          </p>
          <button
            type="button"
            className="mt-2 font-medium underline"
            onClick={() => navigator.clipboard.writeText(setupUrl)}
          >
            Copier le lien
          </button>
        </div>
      )}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Création..." : "Créer le compte"}
        </Button>
      </div>
    </form>
  );
}
