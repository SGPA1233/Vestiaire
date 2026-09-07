import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Input, Label, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { createCampaign, activateCampaign } from "./actions";

export default async function CampagnesPage() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Campagnes de dotation</h1>

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {campaigns.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  {c.isActive && <Pill color="green">Active</Pill>}
                  {c.isArchive && <Pill>Archive</Pill>}
                </div>
                <p className="text-xs text-slate-400">Créée le {formatDate(c.createdAt)}</p>
              </div>
              {!c.isActive && (
                <form action={activateCampaign.bind(null, c.id)}>
                  <Button type="submit" variant="secondary" size="sm">
                    Activer
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Nouvelle campagne</h2>
        <form action={createCampaign} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Nom de la campagne</Label>
            <Input id="name" name="name" required placeholder="Dotation opérationnelle 2027" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Checkbox name="isArchive" />
            Campagne d&apos;archive (historique ancien, n&apos;affecte pas le stock)
          </label>
          <div>
            <Button type="submit">Créer la campagne</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
