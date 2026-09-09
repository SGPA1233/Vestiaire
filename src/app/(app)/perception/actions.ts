"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { createPerception, InsufficientStockError } from "@/lib/perception";

const payloadSchema = z.object({
  employeeId: z.string().min(1),
  lines: z.array(z.object({ itemVariantId: z.string(), quantity: z.number().int().min(0) })),
  returns: z.array(
    z.object({
      distributionLineId: z.string(),
      quantity: z.number().int().min(0),
      reusable: z.boolean(),
    })
  ),
  note: z.string().optional(),
});

export type SubmitPerceptionResult =
  | { success: true; distributionId: string }
  | { success: false; error: string };

export async function submitPerception(
  input: z.infer<typeof payloadSchema>
): Promise<SubmitPerceptionResult> {
  const user = await requireAdmin();
  const parsed = payloadSchema.parse(input);

  const activeCampaign = await prisma.campaign.findFirst({ where: { isActive: true } });
  if (!activeCampaign) {
    return { success: false, error: "Aucune campagne active. Contactez un administrateur." };
  }

  try {
    const { distribution } = await createPerception({
      employeeId: parsed.employeeId,
      campaignId: activeCampaign.id,
      createdByUserId: user.id,
      lines: parsed.lines,
      returns: parsed.returns,
      note: parsed.note,
      // Le stock calculé n'est pas encore fiable (import fournisseur en attente) :
      // ne pas bloquer les perceptions dessus tant que ce n'est pas rétabli.
      force: true,
    });

    revalidatePath("/");
    revalidatePath("/collaborateurs");
    revalidatePath(`/collaborateurs/${parsed.employeeId}`);
    revalidatePath("/stock");
    revalidatePath("/historique");

    return { success: true, distributionId: distribution.id };
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Une erreur inattendue est survenue." };
  }
}
