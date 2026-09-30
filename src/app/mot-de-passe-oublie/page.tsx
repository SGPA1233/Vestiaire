import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-green-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-brand-green-100/70">
            Indiquez votre adresse email professionnelle.
          </p>
        </div>
        <Card>
          <div className="flex flex-col gap-4 text-sm">
            <p className="text-brand-green-950/80">
              Pour protéger les comptes administrateurs, aucun lien de réinitialisation
              n&apos;est généré depuis cette page publique.
            </p>
            <p className="text-brand-green-950/60">
              Demandez à un autre administrateur SGPA de générer un lien d&apos;accès unique
              depuis Paramètres → Utilisateurs. En cas d&apos;indisponibilité de tous les
              administrateurs, utilisez la procédure de récupération conservée par SGPA.
            </p>
            <Link href="/login" className="text-center text-brand-green-700 hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
