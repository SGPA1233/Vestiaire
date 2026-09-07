import { prisma } from "@/lib/prisma";

export interface HistoryFilters {
  employeeId?: string;
  itemId?: string;
  campaignId?: string;
  action?: "Distribution" | "Retour" | "Correction";
  dateFrom?: string;
  dateTo?: string;
}

export interface HistoryRow {
  id: string;
  date: Date;
  employeeName: string;
  employeeId: string;
  itemName: string;
  size: string;
  quantity: number;
  action: "Distribution" | "Retour" | "Correction";
  campaignName: string | null;
  userName: string | null;
}

function dateRange(filters: HistoryFilters) {
  const gte = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
  const lte = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`) : undefined;
  if (!gte && !lte) return undefined;
  return { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
}

export async function getHistoryRows(filters: HistoryFilters): Promise<HistoryRow[]> {
  const range = dateRange(filters);
  const rows: HistoryRow[] = [];

  if (!filters.action || filters.action === "Distribution") {
    const lines = await prisma.distributionLine.findMany({
      where: {
        distribution: {
          employeeId: filters.employeeId,
          campaignId: filters.campaignId,
          date: range,
        },
        itemVariant: filters.itemId ? { itemId: filters.itemId } : undefined,
      },
      include: {
        distribution: { include: { employee: true, campaign: true, createdByUser: true } },
        itemVariant: { include: { item: true } },
      },
    });
    for (const l of lines) {
      rows.push({
        id: `dist-${l.id}`,
        date: l.distribution.date,
        employeeName: `${l.distribution.employee.firstName} ${l.distribution.employee.lastName}`,
        employeeId: l.distribution.employeeId,
        itemName: l.itemVariant.item.name,
        size: l.itemVariant.size,
        quantity: l.quantity,
        action: "Distribution",
        campaignName: l.distribution.campaign.name,
        userName: l.distribution.createdByUser.name,
      });
    }
  }

  if (!filters.action || filters.action === "Retour") {
    const returns = await prisma.return.findMany({
      where: {
        employeeId: filters.employeeId,
        date: range,
        itemVariant: filters.itemId ? { itemId: filters.itemId } : undefined,
      },
      include: { employee: true, itemVariant: { include: { item: true } }, createdByUser: true },
    });
    for (const r of returns) {
      rows.push({
        id: `ret-${r.id}`,
        date: r.date,
        employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
        employeeId: r.employeeId,
        itemName: r.itemVariant.item.name,
        size: r.itemVariant.size,
        quantity: r.quantity,
        action: "Retour",
        campaignName: null,
        userName: r.createdByUser.name,
      });
    }
  }

  if (!filters.action || filters.action === "Correction") {
    const corrections = await prisma.correction.findMany({
      where: { date: range },
      include: {
        distributionLine: {
          include: {
            distribution: { include: { employee: true } },
            itemVariant: { include: { item: true } },
          },
        },
        return: { include: { employee: true, itemVariant: { include: { item: true } } } },
        createdByUser: true,
      },
    });
    for (const c of corrections) {
      const employee = c.distributionLine?.distribution.employee ?? c.return?.employee;
      const item = c.distributionLine?.itemVariant.item ?? c.return?.itemVariant.item;
      const size = c.distributionLine?.itemVariant.size ?? c.return?.itemVariant.size ?? "";
      if (filters.employeeId && employee?.id !== filters.employeeId) continue;
      if (filters.itemId && item?.id !== filters.itemId) continue;
      rows.push({
        id: `corr-${c.id}`,
        date: c.date,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "—",
        employeeId: employee?.id ?? "",
        itemName: item?.name ?? "—",
        size,
        quantity: c.newQuantity,
        action: "Correction",
        campaignName: null,
        userName: c.createdByUser.name,
      });
    }
  }

  rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  return rows;
}
