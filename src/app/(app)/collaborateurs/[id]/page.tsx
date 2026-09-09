import { notFound } from "next/navigation";
import Link from "next/link";
import { getEmployeeDetail } from "@/lib/collaborateur-detail";
import { auth } from "@/auth";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Pill } from "@/components/ui/StatusBadge";
import { CATEGORY_LABELS, SIZE_CATEGORIES } from "@/lib/config";
import { formatDate, formatDateTime } from "@/lib/format";
import { CorrectionButton } from "./CorrectionButton";

export default async function CollaborateurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, session] = await Promise.all([getEmployeeDetail(id), auth()]);

  if (!detail) notFound();

  const { employee, activeCampaign, currentlyHeld, newCampaignLines, missingCategories, timeline } =
    detail;
  const isAdmin = session?.user?.role === "ADMIN";
  const sizeMap = Object.fromEntries(employee.sizes.map((s) => [s.category, s.size]));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/collaborateurs"
        className="text-sm text-brand-green-950/50 hover:text-brand-green-800"
      >
        ← Retour à la liste des collaborateurs
      </Link>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h1>
            {!employee.active && <Pill color="red">Inactif</Pill>}
            {employee.active && !employee.operational && <Pill>Non opérationnel</Pill>}
          </div>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <LinkButton href={`/collaborateurs/${id}/modifier`} variant="secondary">
              Modifier
            </LinkButton>
          )}
          <LinkButton href={`/collaborateurs/${id}/fiche-impression`} variant="secondary">
            Fiche PDF
          </LinkButton>
          <LinkButton href={`/perception?employee=${id}`} size="md">
            + Nouvelle perception
          </LinkButton>
        </div>
      </div>

      {missingCategories.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">Il manque pour être équipé :</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missingCategories.map((cat) => (
              <li
                key={cat}
                className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700"
              >
                {CATEGORY_LABELS[cat]}
                {sizeMap[cat] ? ` — taille ${sizeMap[cat]}` : " — taille non renseignée"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-800">Tailles habituelles</h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            {SIZE_CATEGORIES.map((cat) => (
              <div key={cat}>
                <dt className="text-slate-400">{CATEGORY_LABELS[cat]}</dt>
                <dd className="font-medium text-slate-800">{sizeMap[cat] ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Équipements actuellement en possession
          </h2>
          {currentlyHeld.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun équipement enregistré.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {currentlyHeld.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">
                    {l.itemVariant.item.name} — taille {l.itemVariant.size}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                    x{l.quantityRemaining} · {formatDate(l.distribution.date)}
                    {isAdmin && (
                      <CorrectionButton
                        lineId={l.id}
                        employeeId={id}
                        itemLabel={`${l.itemVariant.item.name} (${l.itemVariant.size})`}
                        currentQuantity={l.quantity}
                      />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Nouvelle dotation{activeCampaign ? ` — ${activeCampaign.name}` : ""}
          </h2>
          {newCampaignLines.length === 0 ? (
            <p className="text-sm text-slate-400">Rien reçu pour le moment dans la campagne active.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {newCampaignLines.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">
                    {l.itemName} — taille {l.size}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">x{l.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Historique complet</h2>
        </div>
        {timeline.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">Aucun mouvement enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Article</th>
                  <th className="px-5 py-3 font-medium">Taille</th>
                  <th className="px-5 py-3 font-medium">Qté</th>
                  <th className="px-5 py-3 font-medium">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timeline.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {formatDateTime(e.date)}
                    </td>
                    <td className="px-5 py-3">
                      <ActionPill type={e.type} />
                    </td>
                    <td className="px-5 py-3 text-slate-700">{e.itemName}</td>
                    <td className="px-5 py-3 text-slate-500">{e.size}</td>
                    <td className="px-5 py-3 text-slate-500">{e.quantity}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {e.detail ?? e.campaignName ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ActionPill({ type }: { type: "Distribution" | "Retour" | "Correction" }) {
  const colors = {
    Distribution: "bg-brand-green-100 text-brand-green-700",
    Retour: "bg-cream-100 text-brand-green-950/60",
    Correction: "bg-brand-gold-100 text-brand-gold-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[type]}`}>
      {type}
    </span>
  );
}
