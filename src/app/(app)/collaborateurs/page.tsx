import { getEmployeesWithStatus } from "@/lib/employee";
import { LinkButton } from "@/components/ui/Button";
import { EmployeeListClient } from "./EmployeeListClient";

export default async function CollaborateursPage() {
  const employees = await getEmployeesWithStatus();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Collaborateurs</h1>
          <p className="mt-1 text-sm text-slate-500">{employees.length} collaborateur(s)</p>
        </div>
        <LinkButton href="/collaborateurs/nouveau" variant="secondary">
          + Ajouter un collaborateur
        </LinkButton>
      </div>

      <EmployeeListClient employees={employees} />
    </div>
  );
}
