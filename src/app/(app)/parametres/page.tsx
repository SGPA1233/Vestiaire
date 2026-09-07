import Link from "next/link";
import { auth } from "@/auth";
import { Card } from "@/components/ui/Card";

const SECTIONS = [
  {
    href: "/parametres/articles",
    title: "Articles",
    desc: "Catalogue des vêtements, tailles disponibles, seuils de stock.",
    icon: "👕",
  },
  {
    href: "/parametres/campagnes",
    title: "Campagnes de dotation",
    desc: "Créer une nouvelle campagne, activer la campagne en cours.",
    icon: "📅",
  },
  {
    href: "/parametres/utilisateurs",
    title: "Utilisateurs",
    desc: "Comptes administrateurs et lecture seule.",
    icon: "🔑",
    adminOnly: true,
  },
  {
    href: "/parametres/migration",
    title: "Migration ancien système",
    desc: "Vérifier et importer les chaussures/bottes actives depuis l'ancien Google Sheets.",
    icon: "📥",
    adminOnly: true,
  },
  {
    href: "/parametres/import",
    title: "Import initial",
    desc: "Importer les collaborateurs, leurs tailles et le stock initial de la nouvelle commande.",
    icon: "📋",
    adminOnly: true,
  },
  {
    href: "/parametres/audit",
    title: "Journal d'audit",
    desc: "Qui a fait quoi, et quand — traçabilité de toutes les actions.",
    icon: "🧾",
    adminOnly: true,
  },
];

export default async function ParametresPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.filter((s) => !s.adminOnly || isAdmin).map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="flex items-start gap-4 transition-transform hover:-translate-y-0.5">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <h2 className="font-semibold text-slate-800">{s.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
