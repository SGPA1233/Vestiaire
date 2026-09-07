import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Pill } from "@/components/ui/StatusBadge";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/config";
import { sortSizes } from "@/lib/sizes";

export default async function ArticlesPage() {
  const items = await prisma.item.findMany({ include: { variants: true } });
  items.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-slate-900">Articles</h1>
        <LinkButton href="/parametres/articles/nouveau">+ Ajouter un article</LinkButton>
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/parametres/articles/${item.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    {!item.active && <Pill color="red">Inactif</Pill>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {CATEGORY_LABELS[item.category]} ·{" "}
                    {sortSizes(item.variants, (v) => v.size)
                      .map((v) => v.size)
                      .join(", ")}
                  </p>
                </div>
                <span className="text-xs text-slate-400">Seuil : {item.stockThreshold}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
