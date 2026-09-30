import { Providers } from "@/components/layout/Providers";
import { AppShell } from "@/components/layout/AppShell";

// Les pages internes dépendent toutes de l'identité courante et de PostgreSQL.
// Elles ne doivent jamais être évaluées pendant la compilation.
export const dynamic = "force-dynamic";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
