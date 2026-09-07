import { prisma } from "@/lib/prisma";
import { REQUIRED_CATEGORIES_FOR_EQUIPPED } from "@/lib/config";

export type DotationStatus = "A_EQUIPER" | "PARTIEL" | "EQUIPE";

export const STATUS_LABELS: Record<DotationStatus, string> = {
  A_EQUIPER: "À équiper",
  PARTIEL: "Partiellement équipé",
  EQUIPE: "Équipé",
};

export const STATUS_COLORS: Record<DotationStatus, string> = {
  A_EQUIPER: "red",
  PARTIEL: "orange",
  EQUIPE: "green",
};

export async function getActiveCampaign() {
  return prisma.campaign.findFirst({ where: { isActive: true } });
}

/**
 * Statut dérivé à partir des catégories reçues (quantité > 0 encore en cours
 * ou non) dans la campagne active, comparées à REQUIRED_CATEGORIES_FOR_EQUIPPED.
 */
export async function getEmployeeStatusMap(
  employeeIds: string[],
  activeCampaignId: string | null
): Promise<Record<string, DotationStatus>> {
  const map: Record<string, DotationStatus> = {};
  for (const id of employeeIds) map[id] = "A_EQUIPER";
  if (!activeCampaignId || employeeIds.length === 0) return map;

  const lines = await prisma.distributionLine.findMany({
    where: {
      distribution: {
        employeeId: { in: employeeIds },
        campaignId: activeCampaignId,
      },
    },
    include: {
      distribution: { select: { employeeId: true } },
      itemVariant: { include: { item: true } },
    },
  });

  const categoriesByEmployee = new Map<string, Set<string>>();
  for (const line of lines) {
    const empId = line.distribution.employeeId;
    if (!categoriesByEmployee.has(empId)) categoriesByEmployee.set(empId, new Set());
    categoriesByEmployee.get(empId)!.add(line.itemVariant.item.category);
  }

  for (const id of employeeIds) {
    const received = categoriesByEmployee.get(id);
    if (!received || received.size === 0) {
      map[id] = "A_EQUIPER";
      continue;
    }
    const requiredMet = REQUIRED_CATEGORIES_FOR_EQUIPPED.filter((c) => received.has(c));
    if (requiredMet.length === REQUIRED_CATEGORIES_FOR_EQUIPPED.length) {
      map[id] = "EQUIPE";
    } else {
      map[id] = "PARTIEL";
    }
  }

  return map;
}
