import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export class InsufficientStockError extends Error {
  constructor(public itemLabel: string, public available: number, public requested: number) {
    super(`Stock insuffisant pour ${itemLabel} : disponible ${available}, demandé ${requested}`);
    this.name = "InsufficientStockError";
  }
}

export interface PerceptionLineInput {
  itemVariantId: string;
  quantity: number;
}

export interface PerceptionReturnInput {
  distributionLineId: string;
  quantity: number;
  reusable: boolean;
}

export interface CreatePerceptionParams {
  employeeId: string;
  campaignId: string;
  createdByUserId: string;
  lines: PerceptionLineInput[];
  returns: PerceptionReturnInput[];
  note?: string;
  force?: boolean; // admin uniquement : outrepasser le contrôle de stock
}

export async function createPerception(params: CreatePerceptionParams) {
  const { employeeId, campaignId, createdByUserId, lines, returns, note, force } = params;

  return prisma.$transaction(async (tx) => {
    // 1. Vérifier le stock disponible pour chaque ligne demandée.
    if (lines.length > 0) {
      const variantIds = lines.map((l) => l.itemVariantId);
      const variants = await tx.itemVariant.findMany({
        where: { id: { in: variantIds } },
        include: { item: true },
      });
      const stockSums = await tx.stockMovement.groupBy({
        by: ["itemVariantId"],
        where: { itemVariantId: { in: variantIds } },
        _sum: { quantity: true },
      });
      const stockMap = new Map(stockSums.map((s) => [s.itemVariantId, s._sum.quantity ?? 0]));

      for (const line of lines) {
        if (line.quantity <= 0) continue;
        const variant = variants.find((v) => v.id === line.itemVariantId);
        const available = stockMap.get(line.itemVariantId) ?? 0;
        if (!force && available < line.quantity) {
          throw new InsufficientStockError(
            variant ? `${variant.item.name} (${variant.size})` : line.itemVariantId,
            available,
            line.quantity
          );
        }
      }
    }

    // 2. Créer la distribution + ses lignes.
    const activeLines = lines.filter((l) => l.quantity > 0);
    const distribution = await tx.distribution.create({
      data: {
        employeeId,
        campaignId,
        createdByUserId,
        note,
        source: "NORMAL",
        affectsStock: true,
        countsAsCurrentlyHeld: true,
        lines: {
          create: activeLines.map((l) => ({
            itemVariantId: l.itemVariantId,
            quantity: l.quantity,
            quantityRemaining: l.quantity,
          })),
        },
      },
      include: { lines: true },
    });

    for (const line of activeLines) {
      await tx.stockMovement.create({
        data: {
          itemVariantId: line.itemVariantId,
          type: "DISTRIBUTION",
          quantity: -line.quantity,
          createdByUserId,
          note: `Distribution à ${employeeId}`,
        },
      });
    }

    // 3. Traiter les retours.
    const createdReturns = [];
    for (const ret of returns) {
      if (ret.quantity <= 0) continue;
      const distLine = await tx.distributionLine.findUnique({
        where: { id: ret.distributionLineId },
        include: { distribution: true },
      });
      if (!distLine) throw new Error("Ligne de distribution introuvable pour le retour");
      if (!force && ret.quantity > distLine.quantityRemaining) {
        throw new Error(
          `Quantité de retour (${ret.quantity}) supérieure à la quantité en possession (${distLine.quantityRemaining})`
        );
      }

      await tx.distributionLine.update({
        where: { id: distLine.id },
        data: { quantityRemaining: { decrement: ret.quantity } },
      });

      const returnRow = await tx.return.create({
        data: {
          employeeId,
          distributionLineId: distLine.id,
          itemVariantId: distLine.itemVariantId,
          quantity: ret.quantity,
          reusable: ret.reusable,
          createdByUserId,
        },
      });
      createdReturns.push(returnRow);

      if (distLine.distribution.affectsStock) {
        await tx.stockMovement.create({
          data: {
            itemVariantId: distLine.itemVariantId,
            type: ret.reusable ? "RETURN_REUSABLE" : "RETURN_NONREUSABLE",
            quantity: ret.reusable ? ret.quantity : 0,
            createdByUserId,
            note: ret.reusable
              ? `Retour réutilisable de ${employeeId}`
              : `Retour non réutilisable (mis au rebut) de ${employeeId}`,
          },
        });
      }
    }

    await writeAuditLog(
      {
        userId: createdByUserId,
        action: "PERCEPTION",
        entityType: "Distribution",
        entityId: distribution.id,
        description: `Perception enregistrée pour le collaborateur ${employeeId} : ${activeLines.length} ligne(s) distribuée(s), ${createdReturns.length} retour(s)`,
      },
      tx
    );

    return { distribution, returns: createdReturns };
  }, { timeout: 15000 });
}
