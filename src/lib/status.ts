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

export interface RequiredItem {
  id: string;
  name: string;
  category: string;
}

/**
 * Tous les articles actifs des catégories requises pour être "Équipé" —
 * chacun doit être reçu individuellement (ex: les 3 t-shirts, les 2 vestes),
 * pas seulement un article de la catégorie.
 */
export async function getRequiredItems(): Promise<RequiredItem[]> {
  return prisma.item.findMany({
    where: { category: { in: REQUIRED_CATEGORIES_FOR_EQUIPPED }, active: true },
    select: { id: true, name: true, category: true },
  });
}

/**
 * Statut dérivé à partir des articles précis reçus (dans la campagne active),
 * comparés à la liste des articles requis (getRequiredItems).
 */
export async function getEmployeeStatusMap(
  employeeIds: string[],
  activeCampaignId: string | null
): Promise<Record<string, DotationStatus>> {
  const map: Record<string, DotationStatus> = {};
  for (const id of employeeIds) map[id] = "A_EQUIPER";
  if (!activeCampaignId || employeeIds.length === 0) return map;

  const requiredItems = await getRequiredItems();

  const lines = await prisma.distributionLine.findMany({
    where: {
      distribution: {
        employeeId: { in: employeeIds },
        campaignId: activeCampaignId,
      },
    },
    include: {
      distribution: { select: { employeeId: true } },
      itemVariant: { select: { itemId: true } },
    },
  });

  const itemsByEmployee = new Map<string, Set<string>>();
  for (const line of lines) {
    const empId = line.distribution.employeeId;
    if (!itemsByEmployee.has(empId)) itemsByEmployee.set(empId, new Set());
    itemsByEmployee.get(empId)!.add(line.itemVariant.itemId);
  }

  for (const id of employeeIds) {
    const received = itemsByEmployee.get(id);
    if (!received || received.size === 0) {
      map[id] = "A_EQUIPER";
      continue;
    }
    const allReceived = requiredItems.every((item) => received.has(item.id));
    map[id] = allReceived ? "EQUIPE" : "PARTIEL";
  }

  return map;
}

export interface EquipmentGap {
  employeeId: string;
  firstName: string;
  lastName: string;
  missing: { itemId: string; itemName: string; category: string; size: string | null }[];
}

/**
 * Liste, pour la campagne active, les collaborateurs actifs ayant reçu au
 * moins un article mais à qui il manque encore un article requis précis —
 * avec la taille habituelle à commander pour chaque article manquant.
 */
export async function getEquipmentGaps(): Promise<EquipmentGap[]> {
  const activeCampaign = await getActiveCampaign();
  if (!activeCampaign) return [];

  const requiredItems = await getRequiredItems();

  const employees = await prisma.employee.findMany({
    where: { active: true },
    include: { sizes: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const lines = await prisma.distributionLine.findMany({
    where: {
      distribution: {
        employeeId: { in: employees.map((e) => e.id) },
        campaignId: activeCampaign.id,
      },
    },
    include: {
      distribution: { select: { employeeId: true } },
      itemVariant: { select: { itemId: true } },
    },
  });

  const itemsByEmployee = new Map<string, Set<string>>();
  for (const line of lines) {
    const empId = line.distribution.employeeId;
    if (!itemsByEmployee.has(empId)) itemsByEmployee.set(empId, new Set());
    itemsByEmployee.get(empId)!.add(line.itemVariant.itemId);
  }

  const gaps: EquipmentGap[] = [];
  for (const employee of employees) {
    const received = itemsByEmployee.get(employee.id);
    if (!received || received.size === 0) continue; // rien reçu = pas encore traité

    const missingItems = requiredItems.filter((item) => !received.has(item.id));
    if (missingItems.length === 0) continue; // équipé

    const sizeMap = Object.fromEntries(employee.sizes.map((s) => [s.category, s.size]));
    gaps.push({
      employeeId: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      missing: missingItems.map((item) => ({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        size: sizeMap[item.category] ?? null,
      })),
    });
  }

  return gaps;
}
