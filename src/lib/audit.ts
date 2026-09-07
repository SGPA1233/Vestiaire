import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function writeAuditLog(
  params: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    description: string;
  },
  db: Db = prisma
) {
  await db.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      description: params.description,
    },
  });
}
