import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import { requireAdminPage } from "@/lib/authz";

export default async function AuditLogPage() {
  await requireAdminPage();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Journal d&apos;audit</h1>
        <p className="mt-1 text-sm text-slate-500">
          Les 200 dernières actions effectuées dans l&apos;application.
        </p>
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {logs.map((log) => (
            <li key={log.id} className="flex flex-col gap-1 px-5 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-700">
                  {log.user?.email ?? "Système"}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
              <p className="text-slate-500">{log.description}</p>
            </li>
          ))}
          {logs.length === 0 && (
            <li className="px-5 py-8 text-center text-slate-400">Aucune action enregistrée.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
