import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHistoryRows, HistoryFilters } from "@/lib/historique";
import { toCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const filters: HistoryFilters = {
    employeeId: searchParams.get("employeeId") ?? undefined,
    itemId: searchParams.get("itemId") ?? undefined,
    campaignId: searchParams.get("campaignId") ?? undefined,
    action: (searchParams.get("action") as HistoryFilters["action"]) ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  };

  const rows = await getHistoryRows(filters);

  const csv = toCsv(
    ["Date", "Collaborateur", "Article", "Taille", "Quantité", "Action", "Campagne", "Utilisateur"],
    rows.map((r) => [
      formatDateTime(r.date),
      r.employeeName,
      r.itemName,
      r.size,
      r.quantity,
      r.action,
      r.campaignName ?? "",
      r.userName ?? "",
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="historique-dotation-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
