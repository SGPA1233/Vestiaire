import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, max-age=0",
};

type DatabaseStatus =
  | "configuration_missing"
  | "authentication_failed"
  | "database_unreachable"
  | "database_error";

function classifyDatabaseError(error: unknown): DatabaseStatus {
  const candidate = error as { code?: string; errorCode?: string; message?: string };
  const code = candidate?.errorCode ?? candidate?.code;
  const message = candidate?.message ?? "";

  if (code === "P1000") return "authentication_failed";
  if (code === "P1001") return "database_unreachable";
  if (
    code === "P1012" ||
    message.includes("Environment variable not found") ||
    message.includes("DATABASE_URL")
  ) {
    return "configuration_missing";
  }
  return "database_error";
}

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { status: 200, headers });
  } catch (error) {
    return NextResponse.json(
      { status: "unavailable", reason: classifyDatabaseError(error) },
      { status: 503, headers }
    );
  }
}
