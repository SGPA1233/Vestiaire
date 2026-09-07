"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { correctDistributionLine } from "@/lib/correction";

const schema = z.object({
  lineId: z.string(),
  newQuantity: z.coerce.number().int().min(0),
  reason: z.string().trim().min(3, "Merci d'indiquer une raison"),
  employeeId: z.string(),
});

export type CorrectionResult = { success: true } | { success: false; error: string };

export async function submitLineCorrection(
  input: z.infer<typeof schema>
): Promise<CorrectionResult> {
  const user = await requireAdmin();
  const parsed = schema.parse(input);

  try {
    await correctDistributionLine({
      lineId: parsed.lineId,
      newQuantity: parsed.newQuantity,
      reason: parsed.reason,
      userId: user.id,
    });
    revalidatePath(`/collaborateurs/${parsed.employeeId}`);
    revalidatePath("/historique");
    revalidatePath("/stock");
    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Erreur inattendue" };
  }
}
