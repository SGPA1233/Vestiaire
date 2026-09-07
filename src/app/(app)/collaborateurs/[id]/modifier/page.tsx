import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EmployeeForm } from "../../EmployeeForm";
import { updateEmployee } from "../../actions";
import type { ItemCategory } from "@prisma/client";

export default async function ModifierCollaborateurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { sizes: true },
  });
  if (!employee) notFound();

  const sizes = Object.fromEntries(
    employee.sizes.map((s) => [s.category, s.size])
  ) as Partial<Record<ItemCategory, string>>;

  const action = updateEmployee.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Modifier {employee.firstName} {employee.lastName}
      </h1>
      <EmployeeForm
        action={action}
        defaults={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          active: employee.active,
          operational: employee.operational,
          note: employee.note ?? undefined,
          sizes,
        }}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  );
}
