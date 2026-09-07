/**
 * Crée (ou met à jour) un compte administrateur.
 *
 * Usage :
 *   npx tsx scripts/create-admin.ts --email admin@entreprise.ch --password "MotDePasse!" --name "Prénom Nom"
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const email = getArg("email");
  const password = getArg("password");
  const name = getArg("name") ?? "Administrateur";

  if (!email || !password) {
    console.error(
      'Usage: npx tsx scripts/create-admin.ts --email <email> --password "<mot de passe>" --name "<nom>"'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, name, role: "ADMIN", active: true },
    create: {
      email: email.toLowerCase(),
      name,
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log(`Compte administrateur prêt : ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
