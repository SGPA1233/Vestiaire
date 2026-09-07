import { auth } from "@/auth";
import { redirect } from "next/navigation";

export class UnauthorizedError extends Error {
  constructor(message = "Action non autorisée") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new UnauthorizedError("Cette action nécessite un compte administrateur.");
  }
  return session.user;
}

/** À utiliser en haut d'une page serveur pour restreindre l'accès aux administrateurs. */
export async function requireAdminPage(redirectTo: string = "/parametres") {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(redirectTo);
  }
  return session.user;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError("Vous devez être connecté.");
  }
  return session.user;
}
