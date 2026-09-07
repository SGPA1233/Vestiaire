"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { writeAuditLog } from "@/lib/audit";

export type ForgotPasswordResult =
  | { emailed: true }
  | { emailed: false; resetUrl: string };

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Toujours générer une réponse cohérente pour ne pas révéler si l'email existe.
  const token = randomBytes(32).toString("hex");

  if (user && user.active) {
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "PASSWORD_RESET_REQUEST",
      entityType: "User",
      entityId: user.id,
      description: `Demande de réinitialisation du mot de passe pour ${user.email}`,
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reinitialiser-mot-de-passe?token=${token}`;

  if (user && user.active) {
    const emailed = await sendPasswordResetEmail(user.email, resetUrl);
    if (emailed) return { emailed: true };
  }

  // Pas de SMTP configuré (ou email inconnu) : on affiche le lien pour un
  // administrateur qui aide la personne, sans confirmer si le compte existe.
  return { emailed: false, resetUrl };
}
