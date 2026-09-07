"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { parseMigrationCsv, importMigrationRows } from "@/lib/migration";

export type UploadResult =
  | { success: true; total: number; matched: number; unmatched: number }
  | { success: false; error: string; errors?: string[] };

export async function uploadMigrationCsv(formData: FormData): Promise<UploadResult> {
  await requireAdmin();
  const text = formData.get("csv")?.toString() ?? "";
  if (!text.trim()) return { success: false, error: "Aucune donnée fournie." };

  const { rows, errors } = parseMigrationCsv(text);
  if (rows.length === 0) {
    return { success: false, error: "Aucune ligne valide trouvée.", errors };
  }

  const result = await importMigrationRows(rows);
  revalidatePath("/parametres/migration");
  return { success: true, ...result };
}

const confirmSchema = z.object({
  itemId: z.string(),
  employeeId: z.string().min(1, "Sélectionnez un collaborateur"),
  size: z.string().optional(),
  quantity: z.coerce.number().int().min(1),
});

export type ConfirmResult = { success: true } | { success: false; error: string };

export async function confirmMigrationItem(formData: FormData): Promise<ConfirmResult> {
  const user = await requireAdmin();

  const parsed = confirmSchema.safeParse({
    itemId: formData.get("itemId"),
    employeeId: formData.get("employeeId"),
    size: formData.get("size")?.toString(),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const migrationItem = await prisma.migrationImportItem.findUnique({
    where: { id: parsed.data.itemId },
  });
  if (!migrationItem) return { success: false, error: "Ligne introuvable" };

  const archiveCampaign = await prisma.campaign.findFirst({ where: { isArchive: true } });
  if (!archiveCampaign) {
    return { success: false, error: "Aucune campagne d'archive n'existe. Créez-en une dans Campagnes." };
  }

  const size = parsed.data.size?.trim() || "Inconnue";

  await prisma.$transaction(async (tx) => {
    let item = await tx.item.findFirst({ where: { category: migrationItem.category, name: `${migrationItem.category === "CHAUSSURES" ? "Chaussures de sécurité" : "Bottes"} (migration ancien système)` } });
    if (!item) {
      item = await tx.item.create({
        data: {
          name: `${migrationItem.category === "CHAUSSURES" ? "Chaussures de sécurité" : "Bottes"} (migration ancien système)`,
          category: migrationItem.category,
          active: false,
        },
      });
    }

    let variant = await tx.itemVariant.findFirst({ where: { itemId: item.id, size } });
    if (!variant) {
      variant = await tx.itemVariant.create({ data: { itemId: item.id, size, active: false } });
    }

    const distribution = await tx.distribution.create({
      data: {
        employeeId: parsed.data.employeeId,
        campaignId: archiveCampaign.id,
        date: migrationItem.dateRaw ?? migrationItem.createdAt,
        source: "MIGRATION",
        affectsStock: false,
        countsAsCurrentlyHeld: true,
        note: "Importé depuis l'ancien système (Google Sheets)",
        createdByUserId: user.id,
        lines: {
          create: [
            {
              itemVariantId: variant.id,
              quantity: parsed.data.quantity,
              quantityRemaining: parsed.data.quantity,
            },
          ],
        },
      },
    });

    await tx.migrationImportItem.update({
      where: { id: migrationItem.id },
      data: {
        status: "CONFIRMED",
        employeeId: parsed.data.employeeId,
        size,
        quantity: parsed.data.quantity,
        resultingDistId: distribution.id,
        reviewedAt: new Date(),
      },
    });

    await writeAuditLog(
      {
        userId: user.id,
        action: "CONFIRM_MIGRATION",
        entityType: "MigrationImportItem",
        entityId: migrationItem.id,
        description: `Confirmation de la migration : ${migrationItem.employeeNameRaw} — ${migrationItem.category} taille ${size}`,
      },
      tx
    );
  });

  revalidatePath("/parametres/migration");
  return { success: true };
}

export async function ignoreMigrationItem(itemId: string) {
  const user = await requireAdmin();

  await prisma.migrationImportItem.update({
    where: { id: itemId },
    data: { status: "IGNORED", reviewedAt: new Date() },
  });

  await writeAuditLog({
    userId: user.id,
    action: "IGNORE_MIGRATION",
    entityType: "MigrationImportItem",
    entityId: itemId,
    description: "Ligne de migration ignorée",
  });

  revalidatePath("/parametres/migration");
}
