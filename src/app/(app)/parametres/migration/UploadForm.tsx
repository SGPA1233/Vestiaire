"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { uploadMigrationCsv } from "./actions";

export function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setErrors([]);
    startTransition(async () => {
      const result = await uploadMigrationCsv(formData);
      if (!result.success) {
        setIsError(true);
        setMessage(result.error);
        setErrors(result.errors ?? []);
        return;
      }
      setIsError(false);
      setMessage(
        `${result.total} ligne(s) détectée(s) : ${result.matched} collaborateur(s) reconnu(s) automatiquement, ${result.unmatched} à sélectionner manuellement.`
      );
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      <textarea
        name="csv"
        rows={6}
        required
        placeholder={"prenom;nom;categorie;taille;quantite;date\nNicolas;Godeau;Chaussures;44;1;09/02/2026"}
        className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-brand-green-600 focus:ring-2 focus:ring-brand-green-100"
      />
      {message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message}
        </p>
      )}
      {errors.length > 0 && (
        <ul className="list-inside list-disc rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {errors.slice(0, 10).map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Import..." : "Importer"}
        </Button>
      </div>
    </form>
  );
}
