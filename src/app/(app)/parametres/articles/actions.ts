"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { ItemCategory } from "@prisma/client";

const itemSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().min(1),
  model: z.string().trim().optional(),
  supplier: z.string().trim().optional(),
  supplierRef: z.string().trim().optional(),
  stockThreshold: z.coerce.number().int().min(0),
  active: z.boolean(),
  sizes: z.string().optional(),
  imageUrl: z.string().optional(),
});

function parseSizes(raw?: string): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

export async function createItem(formData: FormData) {
  const user = await requireAdmin();

  const parsed = itemSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    model: formData.get("model")?.toString(),
    supplier: formData.get("supplier")?.toString(),
    supplierRef: formData.get("supplierRef")?.toString(),
    stockThreshold: formData.get("stockThreshold"),
    active: formData.get("active") === "on",
    sizes: formData.get("sizes")?.toString(),
    imageUrl: formData.get("imageUrl")?.toString(),
  });

  const sizes = parseSizes(parsed.sizes);

  const item = await prisma.item.create({
    data: {
      name: parsed.name,
      category: parsed.category as ItemCategory,
      model: parsed.model || undefined,
      supplier: parsed.supplier || undefined,
      supplierRef: parsed.supplierRef || undefined,
      imageUrl: parsed.imageUrl || undefined,
      stockThreshold: parsed.stockThreshold,
      active: parsed.active,
      variants: { create: sizes.map((size) => ({ size, active: true })) },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "CREATE_ITEM",
    entityType: "Item",
    entityId: item.id,
    description: `Création de l'article ${item.name}`,
  });

  revalidatePath("/parametres/articles");
  redirect("/parametres/articles");
}

export async function updateItem(itemId: string, formData: FormData) {
  const user = await requireAdmin();

  const parsed = itemSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    model: formData.get("model")?.toString(),
    supplier: formData.get("supplier")?.toString(),
    supplierRef: formData.get("supplierRef")?.toString(),
    stockThreshold: formData.get("stockThreshold"),
    active: formData.get("active") === "on",
    sizes: formData.get("newSizes")?.toString(),
    imageUrl: formData.get("imageUrl")?.toString(),
  });

  const newSizes = parseSizes(parsed.sizes);

  await prisma.$transaction(async (tx) => {
    await tx.item.update({
      where: { id: itemId },
      data: {
        name: parsed.name,
        category: parsed.category as ItemCategory,
        model: parsed.model || null,
        supplier: parsed.supplier || null,
        supplierRef: parsed.supplierRef || null,
        imageUrl: parsed.imageUrl || null,
        stockThreshold: parsed.stockThreshold,
        active: parsed.active,
      },
    });

    if (newSizes.length > 0) {
      const existing = await tx.itemVariant.findMany({ where: { itemId } });
      const existingSizes = new Set(existing.map((v) => v.size));
      const toCreate = newSizes.filter((s) => !existingSizes.has(s));
      if (toCreate.length > 0) {
        await tx.itemVariant.createMany({
          data: toCreate.map((size) => ({ itemId, size, active: true })),
        });
      }
    }

    const variantIds = formData.getAll("variantId") as string[];
    for (const variantId of variantIds) {
      const active = formData.get(`variantActive_${variantId}`) === "on";
      await tx.itemVariant.update({ where: { id: variantId }, data: { active } });
    }
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE_ITEM",
    entityType: "Item",
    entityId: itemId,
    description: `Mise à jour de l'article ${parsed.name}`,
  });

  revalidatePath("/parametres/articles");
  revalidatePath(`/parametres/articles/${itemId}`);
  redirect("/parametres/articles");
}
