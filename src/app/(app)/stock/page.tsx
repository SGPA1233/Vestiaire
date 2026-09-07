import { getStockOverview } from "@/lib/stock";
import { LinkButton } from "@/components/ui/Button";
import { StockListClient } from "./StockListClient";

export default async function StockPage() {
  const overview = await getStockOverview();

  const rows = overview.map((r) => ({
    id: r.variant.id,
    itemName: r.variant.item.name,
    category: r.variant.item.category,
    size: r.variant.size,
    stock: r.stock,
    threshold: r.variant.item.stockThreshold,
    status: r.status,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} référence(s)</p>
        </div>
        <LinkButton href="/stock/reception">+ Réception de stock</LinkButton>
      </div>

      <StockListClient rows={rows} />
    </div>
  );
}
