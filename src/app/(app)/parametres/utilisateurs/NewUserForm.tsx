"use client";

import { useRef, useState, useTransition } from "react";
import { Input, Label, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createUser } from "./actions";

export function NewUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createUser(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
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
        <Label htmlFor="password">Mot de passe temporaire</Label>
        <Input id="password" name="password" type="text" required minLength={8} />
      </div>
      <div>
        <Label htmlFor="role">Rôle</Label>
        <Select id="role" name="role" defaultValue="ADMIN">
          <option value="ADMIN">Administrateur</option>
          <option value="READONLY">Lecture seule</option>
        </Select>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Compte créé. Communiquez le mot de passe temporaire à la personne concernée.
        </p>
      )}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Création..." : "Créer le compte"}
        </Button>
      </div>
    </form>
  );
}
