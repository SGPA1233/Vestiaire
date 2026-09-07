import { prisma } from "@/lib/prisma";
import { compareSizes } from "@/lib/sizes";

export async function getVariantStock(itemVariantId: string): Promise<number> {
  const result = await prisma.stockMovement.aggregate({
    where: { itemVariantId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function getStockMap(itemVariantIds: string[]): Promise<Record<string, number>> {
  if (itemVariantIds.length === 0) return {};
  const grouped = await prisma.stockMovement.groupBy({
    by: ["itemVariantId"],
    where: { itemVariantId: { in: itemVariantIds } },
    _sum: { quantity: true },
  });
  const map: Record<string, number> = {};
  for (const id of itemVariantIds) map[id] = 0;
  for (const row of grouped) {
    map[row.itemVariantId] = row._sum.quantity ?? 0;
  }
  return map;
}

export type StockStatus = "OK" | "LOW" | "OUT";

export function computeStockStatus(stock: number, threshold: number): StockStatus {
  if (stock <= 0) return "OUT";
  if (stock <= threshold) return "LOW";
  return "OK";
}

export async function getStockOverview() {
  const variants = await prisma.itemVariant.findMany({
    include: { item: true },
    orderBy: [{ item: { name: "asc" } }],
  });
  variants.sort((a, b) => {
    if (a.item.name !== b.item.name) return a.item.name.localeCompare(b.item.name);
    return compareSizes(a.size, b.size);
  });
  const stockMap = await getStockMap(variants.map((v) => v.id));

  return variants.map((v) => {
    const stock = stockMap[v.id] ?? 0;
    return {
      variant: v,
      stock,
      status: computeStockStatus(stock, v.item.stockThreshold),
    };
  });
}
