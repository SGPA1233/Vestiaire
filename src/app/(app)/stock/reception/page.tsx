import { getActiveCatalog } from "@/lib/catalog";
import { ReceptionForm } from "./ReceptionForm";
import { requireAdminPage } from "@/lib/authz";

export default async function ReceptionPage() {
  await requireAdminPage("/stock");
  const catalog = await getActiveCatalog();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Réception de stock</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enregistrez l&apos;arrivée d&apos;une commande fournisseur, avec une ou plusieurs
          lignes.
        </p>
      </div>
      <ReceptionForm catalog={catalog} />
    </div>
  );
}
