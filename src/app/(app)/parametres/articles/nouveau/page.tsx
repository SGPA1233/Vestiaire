import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/config";
import { createItem } from "../actions";

export default function NouvelArticlePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Ajouter un article</h1>
      <form action={createItem} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Nom de l&apos;article</Label>
            <Input id="name" name="name" required placeholder="Veste opérationnelle 2026" />
          </div>
          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Select id="category" name="category" required defaultValue="">
              <option value="" disabled>
                Choisir...
              </option>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sizes">Tailles disponibles (séparées par des virgules)</Label>
            <Input id="sizes" name="sizes" placeholder="XS, S, M, L, XL, XXL" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model">Modèle (facultatif)</Label>
              <Input id="model" name="model" />
            </div>
            <div>
              <Label htmlFor="stockThreshold">Seuil d&apos;alerte de stock</Label>
              <Input id="stockThreshold" name="stockThreshold" type="number" min={0} defaultValue={5} />
            </div>
            <div>
              <Label htmlFor="supplier">Fournisseur (facultatif)</Label>
              <Input id="supplier" name="supplier" />
            </div>
            <div>
              <Label htmlFor="supplierRef">Référence fournisseur (facultatif)</Label>
              <Input id="supplierRef" name="supplierRef" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Checkbox name="active" defaultChecked />
            Actif
          </label>
        </Card>
        <div>
          <Button type="submit" size="lg">
            Créer l&apos;article
          </Button>
        </div>
      </form>
    </div>
  );
}
