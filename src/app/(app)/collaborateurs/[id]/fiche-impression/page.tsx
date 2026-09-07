import { notFound } from "next/navigation";
import { getEmployeeDetail } from "@/lib/collaborateur-detail";
import { formatDate } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export default async function FicheImpressionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getEmployeeDetail(id);
  if (!detail) notFound();

  const { employee, activeCampaign, newCampaignLines, timeline } = detail;
  const returns = timeline.filter((e) => e.type === "Retour");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-10 print:border-0 print:p-0">
        <h1 className="text-xl font-bold text-slate-900">Fiche de dotation collaborateur</h1>
        <p className="mt-1 text-sm text-slate-500">
          {employee.firstName} {employee.lastName} — {formatDate(new Date())}
        </p>
        {activeCampaign && (
          <p className="text-sm text-slate-500">Campagne : {activeCampaign.name}</p>
        )}

        <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Articles distribués
        </h2>
        {newCampaignLines.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun article distribué dans la campagne active.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Article</th>
                <th className="py-2">Taille</th>
                <th className="py-2">Quantité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {newCampaignLines.map((l) => (
                <tr key={l.id}>
                  <td className="py-2">{l.itemName}</td>
                  <td className="py-2">{l.size}</td>
                  <td className="py-2">{l.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Articles retournés
        </h2>
        {returns.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun retour enregistré.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Article</th>
                <th className="py-2">Taille</th>
                <th className="py-2">Quantité</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map((r) => (
                <tr key={r.id}>
                  <td className="py-2">{r.itemName}</td>
                  <td className="py-2">{r.size}</td>
                  <td className="py-2">{r.quantity}</td>
                  <td className="py-2">{formatDate(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-16 grid grid-cols-2 gap-10">
          <div>
            <div className="mb-1 h-16 border-b border-slate-300" />
            <p className="text-xs text-slate-500">Signature du collaborateur</p>
          </div>
          <div>
            <div className="mb-1 h-16 border-b border-slate-300" />
            <p className="text-xs text-slate-500">Signature du responsable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
