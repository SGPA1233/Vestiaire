"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ emailed: boolean; resetUrl?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await requestPasswordReset(email);
    setResult(res);
    setLoading(false);
  }

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
          {result ? (
            <div className="flex flex-col gap-4 text-sm">
              {result.emailed ? (
                <p className="text-brand-green-950/80">
                  Si un compte existe avec cette adresse, un email de réinitialisation vient
                  d&apos;être envoyé.
                </p>
              ) : (
                <>
                  <p className="text-brand-green-950/80">
                    Aucun serveur email n&apos;est configuré (ou l&apos;adresse est inconnue).
                    Un administrateur peut utiliser ce lien pour réinitialiser le mot de
                    passe :
                  </p>
                  <p className="break-all rounded-lg bg-cream-100 px-3 py-2 font-mono text-xs">
                    {result.resetUrl}
                  </p>
                </>
              )}
              <Link href="/login" className="text-center text-brand-green-700 hover:underline">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
              </Button>
              <Link href="/login" className="text-center text-sm text-brand-green-950/50 hover:text-brand-green-800">
                Retour à la connexion
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
