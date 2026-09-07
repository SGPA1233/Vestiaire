import { prisma } from "@/lib/prisma";
import { getActiveCampaign, getEmployeeStatusMap, DotationStatus } from "@/lib/status";
import { matchesEmployeeQuery } from "@/lib/search";

export async function getCurrentlyHeldLines(employeeId: string) {
  return prisma.distributionLine.findMany({
    where: {
      distribution: { employeeId, countsAsCurrentlyHeld: true },
      quantityRemaining: { gt: 0 },
    },
    include: {
      itemVariant: { include: { item: true } },
      distribution: true,
    },
    orderBy: { distribution: { date: "desc" } },
  });
}

export interface EmployeeWithStatus {
  id: string;
  firstName: string;
  lastName: string;
  active: boolean;
  operational: boolean;
  status: DotationStatus;
}

export async function getEmployeesWithStatus(): Promise<EmployeeWithStatus[]> {
  const [employees, activeCampaign] = await Promise.all([
    prisma.employee.findMany({ orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    getActiveCampaign(),
  ]);
  const statusMap = await getEmployeeStatusMap(
    employees.map((e) => e.id),
    activeCampaign?.id ?? null
  );

  return employees.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    active: e.active,
    operational: e.operational,
    status: statusMap[e.id],
  }));
}

export async function searchEmployees(query: string, opts?: { activeOnly?: boolean }) {
  const employees = await prisma.employee.findMany({
    where: opts?.activeOnly ? { active: true } : {},
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  if (!query.trim()) return employees;
  return employees.filter((e) => matchesEmployeeQuery(e.firstName, e.lastName, query));
}
