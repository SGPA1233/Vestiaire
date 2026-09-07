"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { createReception } from "@/lib/reception";

const schema = z.object({
  supplier: z.string().optional(),
  orderReference: z.string().optional(),
  date: z.string().optional(),
  lines: z.array(z.object({ itemVariantId: z.string(), quantity: z.number().int().min(0) })),
});

export type SubmitReceptionResult = { success: true } | { success: false; error: string };

export async function submitReception(
  input: z.infer<typeof schema>
): Promise<SubmitReceptionResult> {
  const user = await requireAdmin();
  const parsed = schema.parse(input);

  try {
    await createReception({
      lines: parsed.lines,
      supplier: parsed.supplier || undefined,
      orderReference: parsed.orderReference || undefined,
      date: parsed.date ? new Date(parsed.date) : undefined,
      createdByUserId: user.id,
    });

    revalidatePath("/stock");
    revalidatePath("/");
    revalidatePath("/historique");

    return { success: true };
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message };
    return { success: false, error: "Une erreur inattendue est survenue." };
  }
}
