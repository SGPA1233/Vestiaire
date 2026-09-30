import { createHash, randomBytes } from "crypto";

export function createPasswordToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("hex");
  return { rawToken, tokenHash: hashPasswordToken(rawToken) };
}

export function hashPasswordToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function getAppBaseUrl(): string {
  const explicit = process.env.APP_URL ?? process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export function buildPasswordSetupUrl(rawToken: string): string {
  const url = new URL("/reinitialiser-mot-de-passe", getAppBaseUrl());
  url.searchParams.set("token", rawToken);
  return url.toString();
}
