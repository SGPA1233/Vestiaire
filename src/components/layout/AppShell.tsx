import { auth } from "@/auth";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";
import { SignOutButton } from "./SignOutButton";

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-green-950 p-4 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gold-500 text-sm font-bold text-brand-green-950">
            DV
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-cream-50">
              Dotation Vêtements
            </div>
            <div className="text-[11px] uppercase tracking-wide text-brand-green-100/60">
              Gestion interne
            </div>
          </div>
        </div>
        <NavLinks />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-black/5 bg-cream-50/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <MobileMenu />
            <span className="text-sm font-semibold text-brand-green-950 md:hidden">
              Dotation Vêtements
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-brand-green-950">
                {session?.user?.name}
              </div>
              <div className="text-xs text-brand-green-700">
                {session?.user?.role === "ADMIN" ? "Administrateur" : "Lecture seule"}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-100 text-xs font-bold text-brand-green-800">
              {initials(session?.user?.name)}
            </div>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
