import { Input, Label, Select, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SIZE_CATEGORIES, CATEGORY_LABELS, SIZE_SUGGESTIONS } from "@/lib/config";
import type { ItemCategory } from "@prisma/client";

export interface EmployeeFormDefaults {
  firstName?: string;
  lastName?: string;
  active?: boolean;
  operational?: boolean;
  note?: string;
  sizes?: Partial<Record<ItemCategory, string>>;
}

export function EmployeeForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaults?: EmployeeFormDefaults;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Informations</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" required defaultValue={defaults?.firstName} />
          </div>
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" name="lastName" required defaultValue={defaults?.lastName} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Checkbox name="active" defaultChecked={defaults?.active ?? true} />
            Actif
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Checkbox name="operational" defaultChecked={defaults?.operational ?? true} />
            Opérationnel
          </label>
        </div>

        <div className="mt-4">
          <Label htmlFor="note">Note (facultatif)</Label>
          <Input id="note" name="note" defaultValue={defaults?.note} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-800">Tailles habituelles</h2>
        <p className="mb-4 text-sm text-slate-500">
          Utilisées pour pré-remplir automatiquement les tailles lors d&apos;une perception.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SIZE_CATEGORIES.map((cat) => (
            <div key={cat}>
              <Label htmlFor={`size_${cat}`}>{CATEGORY_LABELS[cat]}</Label>
              <Select id={`size_${cat}`} name={`size_${cat}`} defaultValue={defaults?.sizes?.[cat] ?? ""}>
                <option value="">—</option>
                {SIZE_SUGGESTIONS[cat]?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
