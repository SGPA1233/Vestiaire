"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { SIZE_CATEGORIES } from "@/lib/config";
import { ItemCategory } from "@prisma/client";

const employeeSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  active: z.boolean(),
  operational: z.boolean(),
  note: z.string().trim().optional(),
});

function extractSizes(formData: FormData): Record<string, string> {
  const sizes: Record<string, string> = {};
  for (const cat of SIZE_CATEGORIES) {
    const val = formData.get(`size_${cat}`);
    if (typeof val === "string" && val.trim()) sizes[cat] = val.trim();
  }
  return sizes;
}

export async function createEmployee(formData: FormData) {
  const user = await requireAdmin();

  const parsed = employeeSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    active: formData.get("active") === "on",
    operational: formData.get("operational") === "on",
    note: formData.get("note")?.toString(),
  });

  const sizes = extractSizes(formData);

  const employee = await prisma.employee.create({
    data: {
      ...parsed,
      sizes: {
        create: Object.entries(sizes).map(([category, size]) => ({
          category: category as ItemCategory,
          size,
        })),
      },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE_EMPLOYEE",
    entityType: "Employee",
    entityId: employee.id,
    description: `Création du collaborateur ${employee.firstName} ${employee.lastName}`,
  });

  revalidatePath("/collaborateurs");
  redirect(`/collaborateurs/${employee.id}`);
}

export async function updateEmployee(employeeId: string, formData: FormData) {
  const user = await requireAdmin();

  const parsed = employeeSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    active: formData.get("active") === "on",
    operational: formData.get("operational") === "on",
    note: formData.get("note")?.toString(),
  });

  const sizes = extractSizes(formData);

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({ where: { id: employeeId }, data: parsed });

    for (const cat of SIZE_CATEGORIES) {
      const size = sizes[cat];
      if (size) {
        await tx.employeeSize.upsert({
          where: { employeeId_category: { employeeId, category: cat } },
          update: { size },
          create: { employeeId, category: cat, size },
        });
      } else {
        await tx.employeeSize.deleteMany({ where: { employeeId, category: cat } });
      }
    }
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE_EMPLOYEE",
    entityType: "Employee",
    entityId: employeeId,
    description: `Mise à jour de la fiche de ${parsed.firstName} ${parsed.lastName}`,
  });

  revalidatePath(`/collaborateurs/${employeeId}`);
  revalidatePath("/collaborateurs");
  redirect(`/collaborateurs/${employeeId}`);
}
