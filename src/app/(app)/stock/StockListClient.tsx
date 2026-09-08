"use client";

import { useMemo, useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { StockStatusBadge } from "@/components/ui/StatusBadge";
import { CATEGORY_LABELS } from "@/lib/config";
import type { ItemCategory } from "@prisma/client";
import type { StockStatus } from "@/lib/stock";

interface Row {
  id: string;
  itemName: string;
  category: ItemCategory;
  size: string;
  stock: number;
  threshold: number;
  status: StockStatus;
}

export function StockListClient({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StockStatus>("ALL");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (query.trim() && !r.itemName.toLowerCase().includes(query.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rows, query, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Rechercher un article..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "ALL" | StockStatus)}
          className="w-48"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="OK">Stock OK</option>
          <option value="LOW">Stock faible</option>
          <option value="OUT">Rupture</option>
        </Select>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Article</th>
                <th className="px-5 py-3 font-medium">Catégorie</th>
                <th className="px-5 py-3 font-medium">Taille</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Seuil</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium text-slate-800">{r.itemName}</td>
                  <td className="px-5 py-3 text-slate-500">{CATEGORY_LABELS[r.category]}</td>
                  <td className="px-5 py-3 text-slate-500">{r.size}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums text-slate-800">{r.stock}</td>
                  <td className="px-5 py-3 text-slate-400">{r.threshold}</td>
                  <td className="px-5 py-3">
                    <StockStatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Aucun article trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
