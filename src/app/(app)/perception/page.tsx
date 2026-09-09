import { getActiveCatalog } from "@/lib/catalog";
import { getEmployeesWithStatus, getCurrentlyHeldLines } from "@/lib/employee";
import { prisma } from "@/lib/prisma";
import { getActiveCampaign } from "@/lib/status";
import { EmployeeSearchStep } from "./EmployeeSearchStep";
import { PerceptionFlow } from "./PerceptionFlow";
import { Card } from "@/components/ui/Card";
import { auth } from "@/auth";

export default async function PerceptionPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string }>;
}) {
  const { employee: employeeId } = await searchParams;
  const [activeCampaign, session] = await Promise.all([getActiveCampaign(), auth()]);

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle perception</h1>
        <Card>
          <p className="text-sm text-slate-600">
            Votre compte est en lecture seule : vous pouvez consulter les collaborateurs et le
            stock, mais pas enregistrer de perception. Contactez un administrateur.
          </p>
        </Card>
      </div>
    );
  }

  if (!activeCampaign) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle perception</h1>
        <Card>
          <p className="text-sm text-red-600">
            Aucune campagne de dotation active. Un administrateur doit en activer une dans
            Paramètres → Campagnes avant de pouvoir enregistrer une perception.
          </p>
        </Card>
      </div>
    );
  }

  if (!employeeId) {
    const employees = await getEmployeesWithStatus();
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle perception</h1>
        <p className="text-sm text-slate-500">
          Étape 1 — Recherchez et sélectionnez le collaborateur.
        </p>
        <EmployeeSearchStep employees={employees} />
      </div>
    );
  }

  const [employee, catalog, currentlyHeld] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId }, include: { sizes: true } }),
    getActiveCatalog(),
    getCurrentlyHeldLines(employeeId),
  ]);

  if (!employee) {
    const employees = await getEmployeesWithStatus();
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle perception</h1>
        <p className="text-sm text-red-600">Collaborateur introuvable. Sélectionnez-en un autre.</p>
        <EmployeeSearchStep employees={employees} />
      </div>
    );
  }

  const sizeMap = Object.fromEntries(employee.sizes.map((s) => [s.category, s.size]));

  return (
    <PerceptionFlow
      employee={{ id: employee.id, firstName: employee.firstName, lastName: employee.lastName }}
      sizeMap={sizeMap}
      catalog={catalog}
      currentlyHeld={currentlyHeld.map((l) => ({
        id: l.id,
        itemId: l.itemVariant.itemId,
        itemName: l.itemVariant.item.name,
        size: l.itemVariant.size,
        quantityRemaining: l.quantityRemaining,
        category: l.itemVariant.item.category,
      }))}
      campaignName={activeCampaign.name}
    />
  );
}
