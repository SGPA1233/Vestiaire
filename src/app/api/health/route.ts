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
  | "connection_pooler_misconfigured"
  | "schema_unavailable"
  | "client_initialization_error"
  | "database_error";

function classifyDatabaseError(error: unknown): DatabaseStatus {
  const candidate = error as { code?: string; errorCode?: string; message?: string };
  const code = candidate?.errorCode ?? candidate?.code;
  const message = candidate?.message ?? "";
  const normalizedMessage = message.toLowerCase();

  if (
    code === "P1000" ||
    normalizedMessage.includes("authentication failed") ||
    normalizedMessage.includes("password authentication failed") ||
    normalizedMessage.includes("tenant or user not found")
  ) {
    return "authentication_failed";
  }
  if (
    code === "P1001" ||
    normalizedMessage.includes("can't reach database server") ||
    normalizedMessage.includes("connection timed out") ||
    normalizedMessage.includes("econnrefused")
  ) {
    return "database_unreachable";
  }
  if (
    code === "P1012" ||
    message.includes("Environment variable not found") ||
    message.includes("DATABASE_URL")
  ) {
    return "configuration_missing";
  }
  if (normalizedMessage.includes("prepared statement")) {
    return "connection_pooler_misconfigured";
  }
  if (code === "P2021" || normalizedMessage.includes("does not exist in the current database")) {
    return "schema_unavailable";
  }
  if (error instanceof Error && error.name === "PrismaClientInitializationError") {
    return "client_initialization_error";
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
