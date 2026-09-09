import { prisma } from "@/lib/prisma";
import { getActiveCampaign } from "@/lib/status";
import { getCurrentlyHeldLines } from "@/lib/employee";
import { REQUIRED_CATEGORIES_FOR_EQUIPPED } from "@/lib/config";
import type { ItemCategory } from "@prisma/client";

export interface TimelineEvent {
  id: string;
  date: Date;
  type: "Distribution" | "Retour" | "Correction";
  itemName: string;
  size: string;
  quantity: number;
  campaignName?: string;
  detail?: string;
}

export async function getEmployeeDetail(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { sizes: true },
  });
  if (!employee) return null;

  const activeCampaign = await getActiveCampaign();

  const [currentlyHeld, distributions, returns, corrections] = await Promise.all([
    getCurrentlyHeldLines(employeeId),
    prisma.distribution.findMany({
      where: { employeeId },
      include: {
        campaign: true,
        lines: { include: { itemVariant: { include: { item: true } } } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.return.findMany({
      where: { employeeId },
      include: { itemVariant: { include: { item: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.correction.findMany({
      where: {
        OR: [
          { distributionLine: { distribution: { employeeId } } },
          { return: { employeeId } },
        ],
      },
      include: {
        distributionLine: { include: { itemVariant: { include: { item: true } } } },
        return: { include: { itemVariant: { include: { item: true } } } },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const newCampaignLines = activeCampaign
    ? distributions
        .filter((d) => d.campaignId === activeCampaign.id)
        .flatMap((d) =>
          d.lines.map((l) => ({
            id: l.id,
            date: d.date,
            itemName: l.itemVariant.item.name,
            size: l.itemVariant.size,
            quantity: l.quantity,
            category: l.itemVariant.item.category,
          }))
        )
    : [];

  const receivedCategories = new Set(newCampaignLines.map((l) => l.category));
  const missingCategories: ItemCategory[] =
    activeCampaign && newCampaignLines.length > 0
      ? REQUIRED_CATEGORIES_FOR_EQUIPPED.filter((c) => !receivedCategories.has(c))
      : [];

  const timeline: TimelineEvent[] = [];

  for (const d of distributions) {
    for (const l of d.lines) {
      timeline.push({
        id: `dist-${l.id}`,
        date: d.date,
        type: "Distribution",
        itemName: l.itemVariant.item.name,
        size: l.itemVariant.size,
        quantity: l.quantity,
        campaignName: d.campaign.name,
      });
    }
  }
  for (const r of returns) {
    timeline.push({
      id: `ret-${r.id}`,
      date: r.date,
      type: "Retour",
      itemName: r.itemVariant.item.name,
      size: r.itemVariant.size,
      quantity: r.quantity,
      detail: r.reusable ? "Réutilisable" : "Non réutilisable",
    });
  }
  for (const c of corrections) {
    const item = c.distributionLine?.itemVariant.item ?? c.return?.itemVariant.item;
    const size = c.distributionLine?.itemVariant.size ?? c.return?.itemVariant.size ?? "";
    timeline.push({
      id: `corr-${c.id}`,
      date: c.date,
      type: "Correction",
      itemName: item?.name ?? "—",
      size,
      quantity: c.newQuantity,
      detail: `${c.oldQuantity} → ${c.newQuantity} (${c.reason})`,
    });
  }

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    employee,
    activeCampaign,
    currentlyHeld,
    newCampaignLines,
    missingCategories,
    timeline,
  };
}

export type EmployeeDetail = NonNullable<Awaited<ReturnType<typeof getEmployeeDetail>>>;
