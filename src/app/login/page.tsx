import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-green-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold-500 text-base font-bold text-brand-green-950">
            DV
          </div>
          <h1 className="text-2xl font-bold text-white">Dotation Vêtements</h1>
          <p className="mt-1 text-sm text-brand-green-100/70">
            Connexion à l&apos;espace de gestion interne
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
