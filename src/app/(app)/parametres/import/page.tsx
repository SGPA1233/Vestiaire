import { Card } from "@/components/ui/Card";
import { EmployeeImportWizard } from "./EmployeeImportWizard";
import { StockImportWizard } from "./StockImportWizard";
import { requireAdminPage } from "@/lib/authz";

export default async function ImportPage() {
  await requireAdminPage();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import initial des données</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pour la mise en route de l&apos;application : collaborateurs, tailles habituelles et
          stock initial de la nouvelle commande. Un aperçu est toujours affiché avant validation.
        </p>
      </div>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-800">
          1. Collaborateurs et tailles
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Colonnes : <code className="rounded bg-slate-100 px-1">prenom</code>,{" "}
          <code className="rounded bg-slate-100 px-1">nom</code>,{" "}
          <code className="rounded bg-slate-100 px-1">actif</code>,{" "}
          <code className="rounded bg-slate-100 px-1">operationnel</code>, puis en option une
          colonne par article :{" "}
          <code className="rounded bg-slate-100 px-1">
            polo, tshirt, sweatshirt, veste, pantalon, chaussures, bottes
          </code>
          .
        </p>
        <EmployeeImportWizard />
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-800">2. Stock initial</h2>
        <p className="mb-4 text-sm text-slate-500">
          Colonnes : <code className="rounded bg-slate-100 px-1">categorie</code>,{" "}
          <code className="rounded bg-slate-100 px-1">taille</code>,{" "}
          <code className="rounded bg-slate-100 px-1">quantite</code>, et en option{" "}
          <code className="rounded bg-slate-100 px-1">fournisseur</code>,{" "}
          <code className="rounded bg-slate-100 px-1">reference</code>.
        </p>
        <StockImportWizard />
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-800">
          3. Chaussures / bottes actuellement en circulation
        </h2>
        <p className="text-sm text-slate-500">
          Ces équipements récents doivent être repris comme actifs sans passer par l&apos;ancien
          historique. Utilisez l&apos;assistant dédié :{" "}
          <a href="/parametres/migration" className="text-brand-green-700 hover:underline">
            Migration ancien système
          </a>
          .
        </p>
      </Card>
    </div>
  );
}
