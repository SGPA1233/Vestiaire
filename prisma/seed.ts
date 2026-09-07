import { PrismaClient, ItemCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ITEM_CATALOG: {
  name: string;
  category: ItemCategory;
  sizes: string[];
  threshold: number;
}[] = [
  { name: "T-shirt opérationnel 2026", category: "TSHIRT", sizes: ["XS", "S", "M", "L", "XL", "XXL"], threshold: 5 },
  { name: "Polo opérationnel 2026", category: "POLO", sizes: ["XS", "S", "M", "L", "XL", "XXL"], threshold: 5 },
  { name: "Sweatshirt opérationnel 2026", category: "SWEATSHIRT", sizes: ["XS", "S", "M", "L", "XL", "XXL"], threshold: 5 },
  { name: "Veste opérationnelle 2026", category: "VESTE", sizes: ["XS", "S", "M", "L", "XL", "XXL"], threshold: 5 },
  { name: "Pantalon opérationnel 2026", category: "PANTALON", sizes: ["34", "36", "38", "40", "42", "44", "46", "48", "50"], threshold: 5 },
  { name: "Chaussures de sécurité 2026", category: "CHAUSSURES", sizes: ["38", "39", "40", "41", "42", "43", "44", "45", "46"], threshold: 3 },
  { name: "Bottes de sécurité 2026", category: "BOTTES", sizes: ["38", "39", "40", "41", "42", "43", "44", "45", "46"], threshold: 3 },
  { name: "Casquette opérationnelle 2026", category: "CASQUETTE", sizes: ["Unique"], threshold: 5 },
];

const DEMO_EMPLOYEES = [
  { firstName: "Chloé", lastName: "Padé", sizes: { TSHIRT: "S", VESTE: "S", PANTALON: "34", CHAUSSURES: "39" } },
  { firstName: "Dylan", lastName: "Morel", sizes: { TSHIRT: "XL", VESTE: "XL", PANTALON: "50", CHAUSSURES: "44" } },
  { firstName: "Maeva", lastName: "Madrid", sizes: { TSHIRT: "M", VESTE: "M", PANTALON: "38", CHAUSSURES: "40" } },
  { firstName: "Nicolas", lastName: "Godeau", sizes: { TSHIRT: "L", VESTE: "L", PANTALON: "42", CHAUSSURES: "44", BOTTES: "44" } },
];

async function main() {
  console.log("Seed : création des données de base...");

  // --- Utilisateur administrateur ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@entreprise.ch";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMoi123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrateur",
      role: "ADMIN",
      passwordHash,
    },
  });
  console.log(`Compte administrateur prêt : ${adminEmail} / ${adminPassword}`);

  // --- Campagnes ---
  const archiveCampaign = await prisma.campaign.upsert({
    where: { name: "Anciennes dotations" },
    update: {},
    create: { name: "Anciennes dotations", isActive: false, isArchive: true },
  });

  const activeCampaign = await prisma.campaign.upsert({
    where: { name: "Dotation opérationnelle 2026" },
    update: { isActive: true },
    create: { name: "Dotation opérationnelle 2026", isActive: true, isArchive: false },
  });

  // --- Catalogue d'articles + variantes + stock initial ---
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });

  for (const entry of ITEM_CATALOG) {
    const item = await prisma.item.upsert({
      where: { id: `seed-${entry.category}` },
      update: {},
      create: {
        id: `seed-${entry.category}`,
        name: entry.name,
        category: entry.category,
        active: true,
        stockThreshold: entry.threshold,
      },
    });

    for (const size of entry.sizes) {
      const variant = await prisma.itemVariant.upsert({
        where: { itemId_size: { itemId: item.id, size } },
        update: {},
        create: { itemId: item.id, size, active: true },
      });

      const existingMovement = await prisma.stockMovement.findFirst({
        where: { itemVariantId: variant.id, type: "RECEPTION" },
      });
      if (!existingMovement) {
        await prisma.stockMovement.create({
          data: {
            itemVariantId: variant.id,
            type: "RECEPTION",
            quantity: 20,
            supplier: "Fournisseur démo",
            orderReference: "CMD-2026-001",
            note: "Stock initial (données de démonstration)",
            createdByUserId: admin.id,
          },
        });
      }
    }
  }

  // --- Collaborateurs de démonstration ---
  for (const emp of DEMO_EMPLOYEES) {
    const employee = await prisma.employee.upsert({
      where: { id: `seed-${emp.firstName}-${emp.lastName}` },
      update: {},
      create: {
        id: `seed-${emp.firstName}-${emp.lastName}`,
        firstName: emp.firstName,
        lastName: emp.lastName,
        active: true,
        operational: true,
      },
    });

    for (const [category, size] of Object.entries(emp.sizes)) {
      await prisma.employeeSize.upsert({
        where: { employeeId_category: { employeeId: employee.id, category: category as ItemCategory } },
        update: { size },
        create: { employeeId: employee.id, category: category as ItemCategory, size },
      });
    }
  }

  console.log("Seed terminé.");
  console.log(`Campagne active : ${activeCampaign.name}`);
  console.log(`Campagne archive : ${archiveCampaign.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
