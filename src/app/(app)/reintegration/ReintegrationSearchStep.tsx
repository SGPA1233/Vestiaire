"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { matchesEmployeeQuery } from "@/lib/search";
import type { EmployeeWithHoldingsCount } from "@/lib/employee";

export function ReintegrationSearchStep({
  employees,
}: {
  employees: EmployeeWithHoldingsCount[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return employees;
    return employees.filter((e) => matchesEmployeeQuery(e.firstName, e.lastName, query));
  }, [employees, query]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="search"
        placeholder="Rechercher un collaborateur (prénom, nom)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md text-base"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
      />

      <Card className="p-0">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">
            {employees.length === 0
              ? "Personne n'a de matériel à restituer actuellement."
              : "Aucun collaborateur trouvé."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => router.push(`/reintegration?employee=${e.id}`)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-800">
                    {e.firstName} {e.lastName}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {e.heldCount} article{e.heldCount > 1 ? "s" : ""} en possession
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
