import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function correctDistributionLine(params: {
  lineId: string;
  newQuantity: number;
  reason: string;
  userId: string;
}) {
  const { lineId, newQuantity, reason, userId } = params;

  return prisma.$transaction(async (tx) => {
    const line = await tx.distributionLine.findUnique({
      where: { id: lineId },
      include: { distribution: true },
    });
    if (!line) throw new Error("Ligne introuvable");

    const oldQuantity = line.quantity;
    const alreadyReturned = oldQuantity - line.quantityRemaining;
    if (newQuantity < alreadyReturned) {
      throw new Error(
        `Impossible : ${alreadyReturned} unité(s) déjà retournée(s), la nouvelle quantité ne peut pas être inférieure.`
      );
    }

    const delta = newQuantity - oldQuantity;

    await tx.distributionLine.update({
      where: { id: lineId },
      data: {
        quantity: newQuantity,
        quantityRemaining: newQuantity - alreadyReturned,
      },
    });

    if (line.distribution.affectsStock && delta !== 0) {
      await tx.stockMovement.create({
        data: {
          itemVariantId: line.itemVariantId,
          type: "CORRECTION",
          quantity: -delta,
          createdByUserId: userId,
          note: `Correction : ${reason}`,
        },
      });
    }

    const correction = await tx.correction.create({
      data: {
        targetType: "DISTRIBUTION_LINE",
        distributionLineId: lineId,
        oldQuantity,
        newQuantity,
        reason,
        createdByUserId: userId,
      },
    });

    await writeAuditLog(
      {
        userId,
        action: "CORRECTION",
        entityType: "DistributionLine",
        entityId: lineId,
        description: `Correction de ${oldQuantity} à ${newQuantity} — ${reason}`,
      },
      tx
    );

    return correction;
  });
}

export async function correctReturn(params: {
  returnId: string;
  newQuantity: number;
  reason: string;
  userId: string;
}) {
  const { returnId, newQuantity, reason, userId } = params;

  return prisma.$transaction(async (tx) => {
    const ret = await tx.return.findUnique({
      where: { id: returnId },
      include: { distributionLine: { include: { distribution: true } } },
    });
    if (!ret) throw new Error("Retour introuvable");

    const oldQuantity = ret.quantity;
    const delta = newQuantity - oldQuantity;

    await tx.return.update({ where: { id: returnId }, data: { quantity: newQuantity } });

    if (ret.distributionLine) {
      await tx.distributionLine.update({
        where: { id: ret.distributionLine.id },
        data: { quantityRemaining: { decrement: delta } },
      });
    }

    if (ret.distributionLine?.distribution.affectsStock && ret.reusable && delta !== 0) {
      await tx.stockMovement.create({
        data: {
          itemVariantId: ret.itemVariantId,
          type: "CORRECTION",
          quantity: delta,
          createdByUserId: userId,
          note: `Correction retour : ${reason}`,
        },
      });
    }

    const correction = await tx.correction.create({
      data: {
        targetType: "RETURN",
        returnId,
        oldQuantity,
        newQuantity,
        reason,
        createdByUserId: userId,
      },
    });

    await writeAuditLog(
      {
        userId,
        action: "CORRECTION",
        entityType: "Return",
        entityId: returnId,
        description: `Correction de ${oldQuantity} à ${newQuantity} — ${reason}`,
      },
      tx
    );

    return correction;
  });
}
