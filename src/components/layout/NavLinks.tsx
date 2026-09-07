"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/", label: "Tableau de bord", icon: "🏠" },
  { href: "/collaborateurs", label: "Collaborateurs", icon: "👥" },
  { href: "/perception", label: "Nouvelle perception", icon: "➕" },
  { href: "/stock", label: "Stock", icon: "📦" },
  { href: "/historique", label: "Historique", icon: "🕘" },
  { href: "/parametres", label: "Paramètres", icon: "⚙️" },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors border-l-2",
              active
                ? "bg-white/10 border-brand-gold-500 text-white"
                : "border-transparent text-brand-green-100/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
