"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(1),
  isArchive: z.boolean(),
});

export async function createCampaign(formData: FormData) {
  const user = await requireAdmin();
  const parsed = schema.parse({
    name: formData.get("name"),
    isArchive: formData.get("isArchive") === "on",
  });

  const campaign = await prisma.campaign.create({
    data: { name: parsed.name, isArchive: parsed.isArchive, isActive: false },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE_CAMPAIGN",
    entityType: "Campaign",
    entityId: campaign.id,
    description: `Création de la campagne ${campaign.name}`,
  });

  revalidatePath("/parametres/campagnes");
}

export async function activateCampaign(campaignId: string) {
  const user = await requireAdmin();

  await prisma.$transaction(async (tx) => {
    await tx.campaign.updateMany({ where: { isActive: true }, data: { isActive: false } });
    await tx.campaign.update({ where: { id: campaignId }, data: { isActive: true } });
  });

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

  await writeAuditLog({
    userId: user.id,
    action: "ACTIVATE_CAMPAIGN",
    entityType: "Campaign",
    entityId: campaignId,
    description: `Activation de la campagne ${campaign?.name}`,
  });

  revalidatePath("/parametres/campagnes");
  revalidatePath("/perception");
  revalidatePath("/");
}
