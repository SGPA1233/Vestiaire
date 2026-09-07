"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { toggleUserActive } from "./actions";

export function ToggleUserButton({ userId, active }: { userId: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => toggleUserActive(userId, !active))}
    >
      {active ? "Désactiver" : "Réactiver"}
    </Button>
  );
}
