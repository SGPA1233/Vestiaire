import { prisma } from "@/lib/prisma";
import { getStockMap } from "@/lib/stock";
import { CATEGORY_ORDER } from "@/lib/config";
import { sortSizes } from "@/lib/sizes";

export async function getActiveCatalog() {
  const items = await prisma.item.findMany({
    where: { active: true },
    include: { variants: { where: { active: true } } },
  });

  const allVariantIds = items.flatMap((i) => i.variants.map((v) => v.id));
  const stockMap = await getStockMap(allVariantIds);

  const sorted = items.sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  return sorted.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    variants: sortSizes(item.variants, (v) => v.size).map((v) => ({
      id: v.id,
      size: v.size,
      stock: stockMap[v.id] ?? 0,
    })),
  }));
}

export type ActiveCatalog = Awaited<ReturnType<typeof getActiveCatalog>>;
