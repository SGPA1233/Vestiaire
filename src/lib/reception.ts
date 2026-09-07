import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export interface ReceptionLineInput {
  itemVariantId: string;
  quantity: number;
}

export interface CreateReceptionParams {
  lines: ReceptionLineInput[];
  supplier?: string;
  orderReference?: string;
  date?: Date;
  createdByUserId: string;
}

export async function createReception(params: CreateReceptionParams) {
  const { lines, supplier, orderReference, date, createdByUserId } = params;
  const validLines = lines.filter((l) => l.quantity > 0);
  if (validLines.length === 0) throw new Error("Ajoutez au moins une ligne avec une quantité.");

  return prisma.$transaction(async (tx) => {
    const movements = [];
    for (const line of validLines) {
      const movement = await tx.stockMovement.create({
        data: {
          itemVariantId: line.itemVariantId,
          type: "RECEPTION",
          quantity: line.quantity,
          supplier,
          orderReference,
          date: date ?? new Date(),
          createdByUserId,
        },
      });
      movements.push(movement);
    }

    await writeAuditLog(
      {
        userId: createdByUserId,
        action: "STOCK_RECEPTION",
        entityType: "StockMovement",
        description: `Réception de stock : ${validLines.length} ligne(s)${
          supplier ? ` — fournisseur ${supplier}` : ""
        }${orderReference ? ` — commande ${orderReference}` : ""}`,
      },
      tx
    );

    return movements;
  });
}
