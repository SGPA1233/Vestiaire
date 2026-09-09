import { prisma } from "@/lib/prisma";
import { getStockMap } from "@/lib/stock";
import { sortSizes } from "@/lib/sizes";

export async function getActiveCatalog() {
  const items = await prisma.item.findMany({
    where: { active: true },
    include: { variants: { where: { active: true } } },
    orderBy: { displayOrder: "asc" },
  });

  const allVariantIds = items.flatMap((i) => i.variants.map((v) => v.id));
  const stockMap = await getStockMap(allVariantIds);

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    imageUrl: item.imageUrl,
    variants: sortSizes(item.variants, (v) => v.size).map((v) => ({
      id: v.id,
      size: v.size,
      stock: stockMap[v.id] ?? 0,
    })),
  }));
}

export type ActiveCatalog = Awaited<ReturnType<typeof getActiveCatalog>>;
