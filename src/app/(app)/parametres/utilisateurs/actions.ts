"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/password";

const createSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["ADMIN", "READONLY"]),
});

export type CreateUserResult = { success: true } | { success: false; error: string };

export async function createUser(formData: FormData): Promise<CreateUserResult> {
  const admin = await requireAdmin();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cet email." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      role: parsed.data.role,
    },
  });

  await writeAuditLog({
    userId: admin.id,
    action: "CREATE_USER",
    entityType: "User",
    entityId: user.id,
    description: `Création du compte ${user.email} (${user.role})`,
  });

  revalidatePath("/parametres/utilisateurs");
  return { success: true };
}

export async function toggleUserActive(userId: string, active: boolean) {
  const admin = await requireAdmin();
  if (userId === admin.id) return;

  const user = await prisma.user.update({ where: { id: userId }, data: { active } });

  await writeAuditLog({
    userId: admin.id,
    action: active ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    entityType: "User",
    entityId: userId,
    description: `${active ? "Réactivation" : "Désactivation"} du compte ${user.email}`,
  });

  revalidatePath("/parametres/utilisateurs");
}
