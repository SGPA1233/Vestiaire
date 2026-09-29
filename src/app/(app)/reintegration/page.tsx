import { getEmployeesWithHoldings } from "@/lib/employee";
import { getCurrentlyHeldLines } from "@/lib/employee";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { requireAdminPage } from "@/lib/authz";
import { ReintegrationSearchStep } from "./ReintegrationSearchStep";
import { ReintegrationFlow } from "./ReintegrationFlow";

export default async function ReintegrationPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string }>;
}) {
  await requireAdminPage("/reintegration");
  const { employee: employeeId } = await searchParams;

  if (!employeeId) {
    const employees = await getEmployeesWithHoldings();
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-900">Réintégration de matériel</h1>
        <p className="text-sm text-slate-500">
          Étape 1 — Recherchez et sélectionnez le collaborateur qui restitue du matériel.
        </p>
        <ReintegrationSearchStep employees={employees} />
      </div>
    );
  }

  const [employee, currentlyHeld] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    getCurrentlyHeldLines(employeeId),
  ]);

  if (!employee || currentlyHeld.length === 0) {
    const employees = await getEmployeesWithHoldings();
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-900">Réintégration de matériel</h1>
        <Card>
          <p className="text-sm text-red-600">
            {employee ? "Ce collaborateur n'a rien à restituer." : "Collaborateur introuvable."}
          </p>
        </Card>
        <ReintegrationSearchStep employees={employees} />
      </div>
    );
  }

  return (
    <ReintegrationFlow
      employee={{ id: employee.id, firstName: employee.firstName, lastName: employee.lastName }}
      currentlyHeld={currentlyHeld.map((l) => ({
        id: l.id,
        itemName: l.itemVariant.item.name,
        size: l.itemVariant.size,
        quantityRemaining: l.quantityRemaining,
      }))}
    />
  );
}
