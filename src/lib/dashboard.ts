import { prisma } from "@/lib/prisma";
import { getActiveCampaign, getEmployeeStatusMap } from "@/lib/status";
import { getStockOverview } from "@/lib/stock";
import { CATEGORY_LABELS } from "@/lib/config";

export async function getDashboardData() {
  const [activeEmployees, activeCampaign, stockOverview] = await Promise.all([
    prisma.employee.findMany({ where: { active: true } }),
    getActiveCampaign(),
    getStockOverview(),
  ]);

  const statusMap = await getEmployeeStatusMap(
    activeEmployees.map((e) => e.id),
    activeCampaign?.id ?? null
  );

  const equipped = activeEmployees.filter((e) => statusMap[e.id] === "EQUIPE").length;
  const toEquip = activeEmployees.filter((e) => statusMap[e.id] === "A_EQUIPER");

  const lowStock = stockOverview.filter((s) => s.status === "LOW").length;
  const outOfStock = stockOverview.filter((s) => s.status === "OUT").length;

  const recentDistributions = await prisma.distribution.findMany({
    where: { source: "NORMAL" },
    orderBy: { date: "desc" },
    take: 6,
    include: {
      employee: true,
      lines: { include: { itemVariant: { include: { item: true } } } },
    },
  });

  const recentPerceptions = recentDistributions.map((d) => ({
    id: d.id,
    employee: d.employee,
    date: d.date,
    summary: summarizeLines(
      d.lines.map((l) => ({
        category: l.itemVariant.item.category,
        quantity: l.quantity,
      }))
    ),
  }));

  return {
    activeEmployeeCount: activeEmployees.length,
    equippedCount: equipped,
    toEquipCount: toEquip.length,
    toEquipEmployees: toEquip.slice(0, 8),
    lowStockCount: lowStock,
    outOfStockCount: outOfStock,
    recentPerceptions,
    activeCampaign,
  };
}

function summarizeLines(lines: { category: string; quantity: number }[]): string {
  const grouped = new Map<string, number>();
  for (const l of lines) {
    grouped.set(l.category, (grouped.get(l.category) ?? 0) + l.quantity);
  }
  return Array.from(grouped.entries())
    .map(([cat, qty]) => `${qty} ${CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS].toLowerCase()}${qty > 1 ? "s" : ""}`)
    .join(", ");
}
