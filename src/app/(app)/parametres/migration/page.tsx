import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/config";
import { UploadForm } from "./UploadForm";
import { ReviewRow } from "./ReviewRow";
import { requireAdminPage } from "@/lib/authz";

export default async function MigrationPage() {
  await requireAdminPage();
  const [toConfirm, confirmed, ignored, employees] = await Promise.all([
    prisma.migrationImportItem.findMany({
      where: { status: "TO_CONFIRM" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.migrationImportItem.count({ where: { status: "CONFIRMED" } }),
    prisma.migrationImportItem.count({ where: { status: "IGNORED" } }),
    prisma.employee.findMany({ orderBy: [{ lastName: "asc" }] }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Migration ancien système</h1>
        <p className="mt-1 text-sm text-slate-500">
          Importez les chaussures et bottes de sécurité actuellement en circulation depuis
          l&apos;ancien Google Sheets. Vérifiez chaque ligne avant de la confirmer — rien
          n&apos;est appliqué automatiquement.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          Importer un fichier CSV
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Colonnes attendues : <code className="rounded bg-slate-100 px-1">prenom</code>,{" "}
          <code className="rounded bg-slate-100 px-1">nom</code>,{" "}
          <code className="rounded bg-slate-100 px-1">categorie</code> (Chaussures ou Bottes),{" "}
          <code className="rounded bg-slate-100 px-1">taille</code>,{" "}
          <code className="rounded bg-slate-100 px-1">quantite</code>,{" "}
          <code className="rounded bg-slate-100 px-1">date</code>. Séparateur virgule ou
          point-virgule.
        </p>
        <UploadForm />
      </Card>

      <div className="flex gap-4 text-sm text-slate-500">
        <span>
          <span className="font-semibold text-slate-800">{toConfirm.length}</span> à vérifier
        </span>
        <span>
          <span className="font-semibold text-slate-800">{confirmed}</span> confirmées
        </span>
        <span>
          <span className="font-semibold text-slate-800">{ignored}</span> ignorées
        </span>
      </div>

      {toConfirm.length > 0 && (
        <Card className="p-0">
          <ul className="divide-y divide-slate-100">
            {toConfirm.map((item) => (
              <ReviewRow
                key={item.id}
                item={{
                  id: item.id,
                  employeeNameRaw: item.employeeNameRaw,
                  employeeId: item.employeeId,
                  category: item.category,
                  categoryLabel: CATEGORY_LABELS[item.category],
                  size: item.size,
                  quantity: item.quantity,
                  dateRaw: item.dateRaw ? formatDate(item.dateRaw) : null,
                }}
                employees={employees.map((e) => ({
                  id: e.id,
                  label: `${e.firstName} ${e.lastName}`,
                }))}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
