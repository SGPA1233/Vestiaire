"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl">!</div>
      <div>
        <h1 className="text-xl font-bold text-brand-green-950">Le service est momentanément indisponible</h1>
        <p className="mt-2 text-sm text-slate-600">
          Vos données n&apos;ont pas été supprimées. Réessayez dans quelques instants. Si le
          problème persiste, transmettez l&apos;heure de l&apos;erreur à l&apos;administrateur.
        </p>
      </div>
      <Button type="button" onClick={reset}>Réessayer</Button>
    </div>
  );
}
