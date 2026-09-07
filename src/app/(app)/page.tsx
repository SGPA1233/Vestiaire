import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { formatRelativeDate } from "@/lib/format";

function StatCard({
  label,
  value,
  tone = "default",
  href,
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger" | "success";
  href?: string;
}) {
  const toneClasses = {
    default: "text-slate-900",
    warning: "text-amber-600",
    danger: "text-red-600",
    success: "text-emerald-600",
  };

  const content = (
    <Card className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className={`text-3xl font-bold tabular-nums ${toneClasses[tone]}`}>{value}</span>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-transform hover:-translate-y-0.5">
        {content}
      </Link>
    );
  }
  return content;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          {data.activeCampaign && (
            <p className="mt-1 text-sm text-slate-500">
              Campagne active : <span className="font-medium text-slate-700">{data.activeCampaign.name}</span>
            </p>
          )}
        </div>
        <LinkButton href="/perception" size="lg">
          + Nouvelle perception
        </LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Collaborateurs actifs" value={data.activeEmployeeCount} href="/collaborateurs" />
        <StatCard label="Équipés (dotation 2026)" value={data.equippedCount} tone="success" href="/collaborateurs" />
        <StatCard label="Restant à équiper" value={data.toEquipCount} tone="warning" href="/collaborateurs" />
        <StatCard label="Stock faible" value={data.lowStockCount} tone="warning" href="/stock" />
        <StatCard label="Ruptures de stock" value={data.outOfStockCount} tone="danger" href="/stock" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-800">Dernières perceptions</h2>
          {data.recentPerceptions.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune perception enregistrée pour le moment.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {data.recentPerceptions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/collaborateurs/${p.employee.id}`}
                      className="font-medium text-slate-800 hover:text-blue-600"
                    >
                      {p.employee.firstName} {p.employee.lastName}
                    </Link>
                    <p className="truncate text-sm text-slate-500">{p.summary || "—"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatRelativeDate(p.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-800">Collaborateurs restant à équiper</h2>
          {data.toEquipEmployees.length === 0 ? (
            <p className="text-sm text-slate-400">Tout le monde a reçu sa dotation. 🎉</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {data.toEquipEmployees.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/collaborateurs/${e.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:text-blue-600"
                  >
                    <span className="font-medium text-slate-800">
                      {e.firstName} {e.lastName}
                    </span>
                    <span className="text-sm text-red-600">À équiper →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
