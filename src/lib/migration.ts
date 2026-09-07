import { prisma } from "@/lib/prisma";
import { matchesEmployeeQuery } from "@/lib/search";
import { ItemCategory } from "@prisma/client";

export interface ParsedMigrationRow {
  employeeNameRaw: string;
  category: ItemCategory;
  size?: string;
  quantity: number;
  dateRaw?: Date;
}

const CATEGORY_ALIASES: Record<string, ItemCategory> = {
  CHAUSSURES: "CHAUSSURES",
  "CHAUSSURES DE SECURITE": "CHAUSSURES",
  "CHAUSSURES DE SÉCURITÉ": "CHAUSSURES",
  BOTTES: "BOTTES",
  BOTTE: "BOTTES",
};

export function parseMigrationCsv(text: string): { rows: ParsedMigrationRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ParsedMigrationRow[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { rows, errors };

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

  const idx = {
    prenom: header.indexOf("prenom") !== -1 ? header.indexOf("prenom") : header.indexOf("prénom"),
    nom: header.indexOf("nom"),
    categorie: header.indexOf("categorie") !== -1 ? header.indexOf("categorie") : header.indexOf("catégorie"),
    taille: header.indexOf("taille"),
    quantite: header.indexOf("quantite") !== -1 ? header.indexOf("quantite") : header.indexOf("quantité"),
    date: header.indexOf("date"),
  };

  if (idx.prenom === -1 || idx.nom === -1 || idx.categorie === -1) {
    errors.push(
      "En-têtes attendus : prenom, nom, categorie, taille, quantite, date (séparateur , ou ;)"
    );
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    const prenom = cols[idx.prenom] ?? "";
    const nom = cols[idx.nom] ?? "";
    const categorieRaw = (cols[idx.categorie] ?? "").toUpperCase();
    const category = CATEGORY_ALIASES[categorieRaw];

    if (!prenom || !nom) {
      errors.push(`Ligne ${i + 1} : prénom ou nom manquant`);
      continue;
    }
    if (!category) {
      errors.push(`Ligne ${i + 1} : catégorie inconnue "${cols[idx.categorie]}" (attendu Chaussures ou Bottes)`);
      continue;
    }

    const quantity = idx.quantite !== -1 ? parseInt(cols[idx.quantite], 10) || 1 : 1;
    const size = idx.taille !== -1 ? cols[idx.taille] : undefined;
    const dateStr = idx.date !== -1 ? cols[idx.date] : undefined;
    const dateRaw = dateStr ? parseDate(dateStr) : undefined;

    rows.push({
      employeeNameRaw: `${prenom} ${nom}`,
      category,
      size: size || undefined,
      quantity,
      dateRaw,
    });
  }

  return { rows, errors };
}

function parseDate(s: string): Date | undefined {
  const m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? `20${y}` : y;
    return new Date(`${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`);
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function importMigrationRows(rows: ParsedMigrationRow[]) {
  const employees = await prisma.employee.findMany();

  const items = rows.map((row) => {
    const match = employees.find((e) =>
      matchesEmployeeQuery(e.firstName, e.lastName, row.employeeNameRaw)
    );
    return {
      employeeNameRaw: row.employeeNameRaw,
      employeeId: match?.id,
      category: row.category,
      size: row.size,
      quantity: row.quantity,
      dateRaw: row.dateRaw,
      status: "TO_CONFIRM" as const,
    };
  });

  await prisma.migrationImportItem.createMany({ data: items });
  return {
    total: items.length,
    matched: items.filter((i) => i.employeeId).length,
    unmatched: items.filter((i) => !i.employeeId).length,
  };
}
