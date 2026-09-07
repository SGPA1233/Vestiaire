"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import {
  parseEmployeeCsv,
  parseStockCsv,
  ParsedEmployeeRow,
  ParsedStockRow,
} from "@/lib/import-csv";

export async function previewEmployeeImport(text: string) {
  await requireAdmin();
  return parseEmployeeCsv(text);
}

export async function confirmEmployeeImport(rows: ParsedEmployeeRow[]) {
  const user = await requireAdmin();

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const employee = await tx.employee.create({
        data: {
          firstName: row.firstName,
          lastName: row.lastName,
          active: row.active,
          operational: row.operational,
        },
      });
      const sizeEntries = Object.entries(row.sizes) as [string, string][];
      if (sizeEntries.length > 0) {
        await tx.employeeSize.createMany({
          data: sizeEntries.map(([category, size]) => ({
            employeeId: employee.id,
            category: category as never,
            size,
          })),
        });
      }
    }

    await writeAuditLog(
      {
        userId: user.id,
        action: "IMPORT_EMPLOYEES",
        entityType: "Employee",
        description: `Import initial de ${rows.length} collaborateur(s)`,
      },
      tx
    );
  });

  revalidatePath("/collaborateurs");
  revalidatePath("/");
  return { imported: rows.length };
}

export async function previewStockImport(text: string) {
  await requireAdmin();
  return parseStockCsv(text);
}

export async function confirmStockImport(rows: ParsedStockRow[]) {
  const user = await requireAdmin();

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      let item = await tx.item.findFirst({ where: { category: row.category, active: true } });
      if (!item) {
        item = await tx.item.create({
          data: { name: `${row.category} (import initial)`, category: row.category, active: true },
        });
      }
      let variant = await tx.itemVariant.findFirst({ where: { itemId: item.id, size: row.size } });
      if (!variant) {
        variant = await tx.itemVariant.create({ data: { itemId: item.id, size: row.size, active: true } });
      }
      await tx.stockMovement.create({
        data: {
          itemVariantId: variant.id,
          type: "RECEPTION",
          quantity: row.quantity,
          supplier: row.supplier,
          orderReference: row.orderReference,
          note: "Import initial du stock",
          createdByUserId: user.id,
        },
      });
    }

    await writeAuditLog(
      {
        userId: user.id,
        action: "IMPORT_STOCK",
        entityType: "StockMovement",
        description: `Import initial de stock : ${rows.length} ligne(s)`,
      },
      tx
    );
  });

  revalidatePath("/stock");
  revalidatePath("/");
  return { imported: rows.length };
}
