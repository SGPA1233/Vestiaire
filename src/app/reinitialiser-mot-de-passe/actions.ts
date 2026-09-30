"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { writeAuditLog } from "@/lib/audit";
import { headers } from "next/headers";
import { z } from "zod";
import { hashPasswordToken } from "@/lib/password-tokens";
import {
  clearRateLimit,
  getRequestIp,
  isRateLimited,
  makeRateLimitKey,
  PASSWORD_SETUP_RATE_LIMIT,
  recordRateLimitEvent,
} from "@/lib/rate-limit";

export type ResetPasswordResult = { success: true } | { success: false; error: string };

class ConsumedTokenError extends Error {}

export async function resetPassword(token: string, password: string): Promise<ResetPasswordResult> {
  const passwordResult = z.string().min(12).max(128).safeParse(password);
  if (!passwordResult.success) {
    return { success: false, error: "Le mot de passe doit contenir entre 12 et 128 caractères." };
  }

  const tokenResult = z.string().regex(/^[a-f0-9]{64}$/i).safeParse(token);
  if (!tokenResult.success) {
    return { success: false, error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  const requestHeaders = await headers();
  const tokenHash = hashPasswordToken(tokenResult.data);
  const rateLimitKey = makeRateLimitKey(
    "password-setup",
    tokenHash,
    getRequestIp(requestHeaders)
  );
  if (await isRateLimited(rateLimitKey, PASSWORD_SETUP_RATE_LIMIT)) {
    return { success: false, error: "Trop de tentatives. Réessayez plus tard." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (!resetToken || !resetToken.user.active || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    await recordRateLimitEvent(rateLimitKey);
    return { success: false, error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  const passwordHash = await hashPassword(passwordResult.data);
  const usedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: usedAt },
        },
        data: { usedAt },
      });
      if (consumed.count !== 1) throw new ConsumedTokenError();

      const updatedUser = await tx.user.updateMany({
        where: { id: resetToken.userId, active: true },
        data: { passwordHash, updatedAt: usedAt },
      });
      if (updatedUser.count !== 1) throw new ConsumedTokenError();
      await tx.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt },
      });
    });
  } catch (error) {
    if (!(error instanceof ConsumedTokenError)) throw error;
    await recordRateLimitEvent(rateLimitKey);
    return { success: false, error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  await clearRateLimit(rateLimitKey);

  await writeAuditLog({
    userId: resetToken.userId,
    action: "PASSWORD_RESET",
    entityType: "User",
    entityId: resetToken.userId,
    description: `Mot de passe réinitialisé pour ${resetToken.user.email}`,
  });

  return { success: true };
}
