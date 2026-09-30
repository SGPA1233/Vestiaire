"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { randomBytes } from "crypto";
import {
  buildPasswordSetupUrl,
  createPasswordToken,
} from "@/lib/password-tokens";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  role: z.enum(["ADMIN", "READONLY"]),
});

export type CreateUserResult =
  | { success: true; setupUrl: string }
  | { success: false; error: string };

export async function createUser(formData: FormData): Promise<CreateUserResult> {
  const admin = await requireAdmin();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cet email." };
  }

  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
  const { rawToken, tokenHash } = createPasswordToken();
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        role: parsed.data.role,
      },
    });

    await tx.passwordResetToken.create({
      data: {
        token: tokenHash,
        userId: created.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return created;
  });

  await writeAuditLog({
    userId: admin.id,
    action: "CREATE_USER",
    entityType: "User",
    entityId: user.id,
    description: `Création du compte ${user.email} (${user.role})`,
  });

  revalidatePath("/parametres/utilisateurs");
  return { success: true, setupUrl: buildPasswordSetupUrl(rawToken) };
}

export type SetupLinkResult =
  | { success: true; setupUrl: string }
  | { success: false; error: string };

export async function createPasswordSetupLink(userId: string): Promise<SetupLinkResult> {
  const admin = await requireAdmin();
  const parsedId = z.string().min(1).max(128).safeParse(userId);
  if (!parsedId.success) return { success: false, error: "Compte invalide." };

  const user = await prisma.user.findUnique({ where: { id: parsedId.data } });
  if (!user?.active) return { success: false, error: "Ce compte est introuvable ou désactivé." };

  const { rawToken, tokenHash } = createPasswordToken();
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await tx.passwordResetToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await writeAuditLog(
      {
        userId: admin.id,
        action: "PASSWORD_SETUP_LINK",
        entityType: "User",
        entityId: user.id,
        description: `Génération d'un lien d'accès unique pour ${user.email}`,
      },
      tx
    );
  });

  return { success: true, setupUrl: buildPasswordSetupUrl(rawToken) };
}

export async function toggleUserActive(userId: string, active: boolean) {
  const admin = await requireAdmin();
  const parsed = z.object({ userId: z.string().min(1).max(128), active: z.boolean() }).safeParse({
    userId,
    active,
  });
  if (!parsed.success || parsed.data.userId === admin.id) return;

  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { active: parsed.data.active, updatedAt: new Date() },
  });

  await writeAuditLog({
    userId: admin.id,
    action: parsed.data.active ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    entityType: "User",
    entityId: parsed.data.userId,
    description: `${parsed.data.active ? "Réactivation" : "Désactivation"} du compte ${user.email}`,
  });

  revalidatePath("/parametres/utilisateurs");
}
