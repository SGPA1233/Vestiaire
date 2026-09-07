import { prisma } from "@/lib/prisma";
import { getHistoryRows, HistoryFilters } from "@/lib/historique";
import { Card } from "@/components/ui/Card";
import { Select, Input } from "@/components/ui/Field";
import { LinkButton } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/format";

function buildQueryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) params.set(k, v);
  }
  return params.toString();
}

export default async function HistoriquePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: HistoryFilters = {
    employeeId: sp.employeeId,
    itemId: sp.itemId,
    campaignId: sp.campaignId,
    action: sp.action as HistoryFilters["action"],
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
  };

  const [rows, employees, items, campaigns] = await Promise.all([
    getHistoryRows(filters),
    prisma.employee.findMany({ orderBy: [{ lastName: "asc" }] }),
    prisma.item.findMany({ orderBy: { name: "asc" } }),
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const exportQs = buildQueryString(sp);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} mouvement(s)</p>
        </div>
        <LinkButton href={`/historique/export?${exportQs}`} variant="secondary">
          Exporter en CSV
        </LinkButton>
      </div>

      <Card>
        <form className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" method="get">
          <Select name="employeeId" defaultValue={sp.employeeId ?? ""}>
            <option value="">Tous les collaborateurs</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </Select>
          <Select name="itemId" defaultValue={sp.itemId ?? ""}>
            <option value="">Tous les articles</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
          <Select name="campaignId" defaultValue={sp.campaignId ?? ""}>
            <option value="">Toutes les campagnes</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select name="action" defaultValue={sp.action ?? ""}>
            <option value="">Toutes les actions</option>
            <option value="Distribution">Distribution</option>
            <option value="Retour">Retour</option>
            <option value="Correction">Correction</option>
          </Select>
          <Input type="date" name="dateFrom" defaultValue={sp.dateFrom ?? ""} />
          <Input type="date" name="dateTo" defaultValue={sp.dateTo ?? ""} />
          <button
            type="submit"
            className="col-span-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-900 sm:col-span-1"
          >
            Filtrer
          </button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Collaborateur</th>
                <th className="px-5 py-3 font-medium">Article</th>
                <th className="px-5 py-3 font-medium">Taille</th>
                <th className="px-5 py-3 font-medium">Qté</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Campagne</th>
                <th className="px-5 py-3 font-medium">Utilisateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                    {formatDateTime(r.date)}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{r.employeeName}</td>
                  <td className="px-5 py-3 text-slate-700">{r.itemName}</td>
                  <td className="px-5 py-3 text-slate-500">{r.size}</td>
                  <td className="px-5 py-3 text-slate-500">{r.quantity}</td>
                  <td className="px-5 py-3 text-slate-500">{r.action}</td>
                  <td className="px-5 py-3 text-slate-400">{r.campaignName ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-400">{r.userName ?? "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Aucun mouvement trouvé pour ces filtres.
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
