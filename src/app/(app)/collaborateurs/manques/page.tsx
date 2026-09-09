import Link from "next/link";
import { getEquipmentGaps } from "@/lib/status";
import { Card } from "@/components/ui/Card";

export default async function ManquesPage() {
  const gaps = await getEquipmentGaps();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/collaborateurs"
          className="text-sm text-brand-green-950/50 hover:text-brand-green-800"
        >
          ← Retour à la liste des collaborateurs
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Articles manquants</h1>
        <p className="text-sm text-slate-500">
          Collaborateurs ayant déjà reçu de la dotation dans la campagne active mais à qui il
          manque encore un article requis pour être équipé.
        </p>
      </div>

      {gaps.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            Aucun manque à signaler : tous les collaborateurs qui ont commencé à percevoir sont
            équipés, ou n&apos;ont pas encore été traités.
          </p>
        </Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-slate-100">
            {gaps.map((gap) => (
              <li key={gap.employeeId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <Link
                  href={`/collaborateurs/${gap.employeeId}`}
                  className="font-medium text-slate-800 hover:underline"
                >
                  {gap.firstName} {gap.lastName}
                </Link>
                <div className="flex flex-wrap gap-2">
                  {gap.missing.map((m) => (
                    <span
                      key={m.itemId}
                      className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                    >
                      {m.itemName}
                      {m.size ? ` — taille ${m.size}` : " — taille non renseignée"}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
