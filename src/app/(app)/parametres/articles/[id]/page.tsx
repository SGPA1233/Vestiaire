import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/config";
import { sortSizes } from "@/lib/sizes";
import { updateItem } from "../actions";

export default async function ModifierArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id }, include: { variants: true } });
  if (!item) notFound();

  const variants = sortSizes(item.variants, (v) => v.size);
  const action = updateItem.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Modifier {item.name}</h1>
      <form action={action} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Nom de l&apos;article</Label>
            <Input id="name" name="name" required defaultValue={item.name} />
          </div>
          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Select id="category" name="category" required defaultValue={item.category}>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model">Modèle (facultatif)</Label>
              <Input id="model" name="model" defaultValue={item.model ?? ""} />
            </div>
            <div>
              <Label htmlFor="stockThreshold">Seuil d&apos;alerte de stock</Label>
              <Input
                id="stockThreshold"
                name="stockThreshold"
                type="number"
                min={0}
                defaultValue={item.stockThreshold}
              />
            </div>
            <div>
              <Label htmlFor="supplier">Fournisseur (facultatif)</Label>
              <Input id="supplier" name="supplier" defaultValue={item.supplier ?? ""} />
            </div>
            <div>
              <Label htmlFor="supplierRef">Référence fournisseur (facultatif)</Label>
              <Input id="supplierRef" name="supplierRef" defaultValue={item.supplierRef ?? ""} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Checkbox name="active" defaultChecked={item.active} />
            Actif
          </label>
        </Card>

        <Card>
          <h2 className="mb-1 text-base font-semibold text-slate-800">Tailles</h2>
          <p className="mb-4 text-sm text-slate-500">
            Décochez une taille pour la désactiver (l&apos;historique est conservé).
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {variants.map((v) => (
              <label key={v.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="hidden" name="variantId" value={v.id} />
                <Checkbox name={`variantActive_${v.id}`} defaultChecked={v.active} />
                {v.size}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Label htmlFor="newSizes">Ajouter de nouvelles tailles (séparées par des virgules)</Label>
            <Input id="newSizes" name="newSizes" placeholder="XXXL" />
          </div>
        </Card>

        <div>
          <Button type="submit" size="lg">
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
