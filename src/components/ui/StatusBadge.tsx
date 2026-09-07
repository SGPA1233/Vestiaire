import clsx from "clsx";
import { DotationStatus, STATUS_LABELS } from "@/lib/status";
import { StockStatus } from "@/lib/stock";

const dotationColors: Record<DotationStatus, string> = {
  A_EQUIPER: "bg-red-50 text-red-700 ring-1 ring-red-200",
  PARTIEL: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  EQUIPE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

export function DotationStatusBadge({ status }: { status: DotationStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        dotationColors[status]
      )}
    >
      <span
        className={clsx("h-1.5 w-1.5 rounded-full", {
          "bg-red-500": status === "A_EQUIPER",
          "bg-orange-500": status === "PARTIEL",
          "bg-emerald-500": status === "EQUIPE",
        })}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

const stockColors: Record<StockStatus, string> = {
  OK: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  LOW: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  OUT: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

const stockLabels: Record<StockStatus, string> = {
  OK: "Stock OK",
  LOW: "Stock faible",
  OUT: "Rupture",
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        stockColors[status]
      )}
    >
      {stockLabels[status]}
    </span>
  );
}

export function Pill({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: "slate" | "green" | "red";
}) {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", colors[color])}>
      {children}
    </span>
  );
}
