import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";
import { auth } from "@/auth";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { formatRelativeDate } from "@/lib/format";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TONE_STYLES = {
  default: { text: "text-brand-green-950", badge: "bg-brand-green-100 text-brand-green-700", icon: "👥" },
  success: { text: "text-brand-green-700", badge: "bg-brand-green-100 text-brand-green-700", icon: "✓" },
  warning: { text: "text-brand-gold-600", badge: "bg-brand-gold-100 text-brand-gold-600", icon: "↗" },
  danger: { text: "text-red-700", badge: "bg-red-50 text-red-600", icon: "!" },
} as const;

function StatCard({
  label,
  value,
  tone = "default",
  href,
}: {
  label: string;
  value: number;
  tone?: keyof typeof TONE_STYLES;
  href?: string;
}) {
  const t = TONE_STYLES[tone];

  const content = (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-green-950/60">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${t.badge}`}>
          {t.icon}
        </span>
      </div>
      <span className={`text-3xl font-bold tabular-nums ${t.text}`}>{value}</span>
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
  const [data, session] = await Promise.all([getDashboardData(), auth()]);
  const firstName = session?.user?.name?.split(" ")[0] ?? "";
  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-green-700">
            {today}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-brand-green-950">
            Bonjour{firstName ? ` ${firstName}` : ""}
          </h1>
          {data.activeCampaign && (
            <p className="mt-1 text-sm text-brand-green-950/60">
              Campagne active :{" "}
              <span className="font-medium text-brand-green-800">{data.activeCampaign.name}</span>
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
          <h2 className="mb-4 text-base font-semibold text-brand-green-950">Dernières perceptions</h2>
          {data.recentPerceptions.length === 0 ? (
            <p className="text-sm text-brand-green-950/40">Aucune perception enregistrée pour le moment.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-black/5">
              {data.recentPerceptions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/collaborateurs/${p.employee.id}`}
                      className="font-medium text-brand-green-950 hover:text-brand-green-700"
                    >
                      {p.employee.firstName} {p.employee.lastName}
                    </Link>
                    <p className="truncate text-sm text-brand-green-950/50">{p.summary || "—"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-brand-green-950/40">
                    {formatRelativeDate(p.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-brand-green-950">Collaborateurs restant à équiper</h2>
          {data.toEquipEmployees.length === 0 ? (
            <p className="text-sm text-brand-green-950/40">Tout le monde a reçu sa dotation. 🎉</p>
          ) : (
            <ul className="flex flex-col divide-y divide-black/5">
              {data.toEquipEmployees.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/collaborateurs/${e.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:text-brand-green-700"
                  >
                    <span className="font-medium text-brand-green-950">
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
