"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function RootError({
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
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-brand-green-950">Le service est momentanément indisponible</h1>
        <p className="mt-2 text-sm text-slate-600">
          Vos données n&apos;ont pas été supprimées. Réessayez dans quelques instants ou
          signalez l&apos;heure de l&apos;erreur à l&apos;administrateur.
        </p>
        <Button type="button" className="mt-5" onClick={reset}>Réessayer</Button>
      </div>
    </main>
  );
}
