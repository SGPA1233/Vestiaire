"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { DotationStatusBadge } from "@/components/ui/StatusBadge";
import { Pill } from "@/components/ui/StatusBadge";
import type { EmployeeWithStatus } from "@/lib/employee";
import { matchesEmployeeQuery } from "@/lib/search";

export function EmployeeListClient({ employees }: { employees: EmployeeWithStatus[] }) {
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
        className="max-w-md"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
      />

      <Card className="p-0">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">Aucun collaborateur trouvé.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/collaborateurs/${e.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-800">
                      {e.firstName} {e.lastName}
                    </span>
                    {!e.active && <Pill color="red">Inactif</Pill>}
                    {e.active && !e.operational && <Pill>Non opérationnel</Pill>}
                  </div>
                  <DotationStatusBadge status={e.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
