import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { NewUserForm } from "./NewUserForm";
import { ToggleUserButton } from "./ToggleUserButton";
import { requireAdminPage } from "@/lib/authz";
import { AccessLinkButton } from "./AccessLinkButton";

export default async function UtilisateursPage() {
  const currentUser = await requireAdminPage();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{u.name}</span>
                  <Pill color={u.role === "ADMIN" ? "green" : "slate"}>
                    {u.role === "ADMIN" ? "Administrateur" : "Lecture seule"}
                  </Pill>
                  {!u.active && <Pill color="red">Désactivé</Pill>}
                </div>
                <p className="text-xs text-slate-400">
                  {u.email} · dernière connexion{" "}
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : "jamais"}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                {u.active && <AccessLinkButton userId={u.id} />}
                {currentUser.id !== u.id && (
                  <ToggleUserButton userId={u.id} active={u.active} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-800">Nouveau compte</h2>
        <NewUserForm />
      </Card>
    </div>
  );
}
