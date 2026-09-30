"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { createPasswordSetupLink } from "./actions";

export function AccessLinkButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    setSetupUrl(null);
    startTransition(async () => {
      const result = await createPasswordSetupLink(userId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSetupUrl(result.setupUrl);
    });
  }

  return (
    <div className="flex max-w-sm flex-col items-end gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={generate} disabled={isPending}>
        {isPending ? "Génération..." : "Lien d’accès"}
      </Button>
      {setupUrl && (
        <div className="w-full rounded-lg bg-cream-100 p-2 text-left text-xs text-brand-green-950">
          <p className="break-all font-mono">{setupUrl}</p>
          <button
            type="button"
            className="mt-1 font-medium text-brand-green-700 underline"
            onClick={() => navigator.clipboard.writeText(setupUrl)}
          >
            Copier — valable 1 heure
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
