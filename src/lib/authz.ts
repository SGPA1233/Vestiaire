import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export class UnauthorizedError extends Error {
  constructor(message = "Action non autorisée") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError("Vous devez être connecté.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      sessionVersion: true,
    },
  });

  if (
    !user?.active ||
    user.sessionVersion !== session.user.sessionVersion
  ) {
    throw new UnauthorizedError("Cette session n'est plus valide. Reconnectez-vous.");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") {
    throw new UnauthorizedError("Cette action nécessite un compte administrateur.");
  }
  return user;
}

/** À utiliser en haut d'une page serveur pour restreindre l'accès aux administrateurs. */
export async function requireAdminPage(redirectTo: string = "/parametres") {
  const user = await requireUserPage();
  if (user.role !== "ADMIN") {
    redirect(redirectTo);
  }
  return user;
}

export async function requireUser() {
  return getCurrentUser();
}

export async function requireUserPage() {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login?session=expired");
    }
    throw error;
  }
}
