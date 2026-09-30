import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

export interface RateLimitRule {
  maxEvents: number;
  windowMs: number;
  blockMs: number;
}

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
  const now = new Date();
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });
  if (!bucket) return false;
  if (bucket.blockedUntil && bucket.blockedUntil > now) return true;

  const windowCutoff = new Date(now.getTime() - rule.windowMs);
  return bucket.windowStart > windowCutoff && bucket.count >= rule.maxEvents;
}

export async function recordRateLimitEvent(key: string, rule: RateLimitRule): Promise<void> {
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - rule.windowMs);

  await prisma.$transaction(async (tx) => {
    const bucket = await tx.rateLimitBucket.findUnique({ where: { key } });

    if (!bucket || bucket.windowStart <= windowCutoff) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          windowStart: now,
          blockedUntil: rule.maxEvents <= 1 ? new Date(now.getTime() + rule.blockMs) : null,
        },
        update: {
          count: 1,
          windowStart: now,
          blockedUntil: rule.maxEvents <= 1 ? new Date(now.getTime() + rule.blockMs) : null,
        },
      });
      return;
    }

    const nextCount = bucket.count + 1;
    await tx.rateLimitBucket.update({
      where: { key },
      data: {
        count: nextCount,
        blockedUntil:
          nextCount >= rule.maxEvents ? new Date(now.getTime() + rule.blockMs) : bucket.blockedUntil,
      },
    });
  });
}

export async function clearRateLimit(key: string): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({ where: { key } });
}

export const LOGIN_RATE_LIMIT: RateLimitRule = {
  maxEvents: 8,
  windowMs: 15 * 60 * 1000,
  blockMs: 30 * 60 * 1000,
};

export const PASSWORD_SETUP_RATE_LIMIT: RateLimitRule = {
  maxEvents: 10,
  windowMs: 60 * 60 * 1000,
  blockMs: 60 * 60 * 1000,
};
