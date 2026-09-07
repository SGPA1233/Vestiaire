import { auth } from "@/auth";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";
import { SignOutButton } from "./SignOutButton";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 px-2 pt-2">
          <div className="text-lg font-bold text-slate-900">Dotation Vêtements</div>
          <div className="text-xs text-slate-400">Gestion interne</div>
        </div>
        <NavLinks />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <MobileMenu />
            <span className="text-sm font-semibold text-slate-800 md:hidden">
              Dotation Vêtements
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700">
                {session?.user?.name}
              </div>
              <div className="text-xs text-slate-400">
                {session?.user?.role === "ADMIN" ? "Administrateur" : "Lecture seule"}
              </div>
            </div>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
