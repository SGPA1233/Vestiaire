import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

export interface RateLimitRule {
  maxEvents: number;
  windowMs: number;
}

const RATE_LIMIT_ACTION = "RATE_LIMIT_EVENT";
const RATE_LIMIT_ENTITY = "RateLimit";

function rateLimitSecret(): string {
  return process.env.AUTH_SECRET ?? "development-rate-limit-secret";
}

export function makeRateLimitKey(action: string, ...parts: Array<string | null | undefined>): string {
  const normalized = [action, ...parts.map((part) => part?.trim().toLowerCase() ?? "-")].join("|");
  return createHmac("sha256", rateLimitSecret()).update(normalized).digest("hex");
}

export function getRequestIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || headers.get("x-real-ip") || "unknown").slice(0, 128);
}

export async function isRateLimited(key: string, rule: RateLimitRule): Promise<boolean> {
  const windowCutoff = new Date(Date.now() - rule.windowMs);
  const count = await prisma.auditLog.count({
    where: {
      action: RATE_LIMIT_ACTION,
      entityType: RATE_LIMIT_ENTITY,
      entityId: key,
      createdAt: { gte: windowCutoff },
    },
  });
  return count >= rule.maxEvents;
}

export async function recordRateLimitEvent(key: string): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: RATE_LIMIT_ACTION,
      entityType: RATE_LIMIT_ENTITY,
      entityId: key,
      description: "Tentative refusée par la protection anti-abus",
    },
  });
}

export async function clearRateLimit(key: string): Promise<void> {
  await prisma.auditLog.deleteMany({
    where: {
      action: RATE_LIMIT_ACTION,
      entityType: RATE_LIMIT_ENTITY,
      entityId: key,
    },
  });
}

export const LOGIN_RATE_LIMIT: RateLimitRule = {
  maxEvents: 8,
  windowMs: 30 * 60 * 1000,
};

export const PASSWORD_SETUP_RATE_LIMIT: RateLimitRule = {
  maxEvents: 10,
  windowMs: 60 * 60 * 1000,
};
