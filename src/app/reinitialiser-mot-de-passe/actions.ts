"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { writeAuditLog } from "@/lib/audit";

export type ResetPasswordResult = { success: true } | { success: false; error: string };

export async function resetPassword(token: string, password: string): Promise<ResetPasswordResult> {
  if (password.length < 8) {
    return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { success: false, error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  await writeAuditLog({
    userId: resetToken.userId,
    action: "PASSWORD_RESET",
    entityType: "User",
    entityId: resetToken.userId,
    description: `Mot de passe réinitialisé pour ${resetToken.user.email}`,
  });

  return { success: true };
}
