import { ItemCategory } from "@prisma/client";
import { SIZE_CATEGORIES } from "@/lib/config";

function detectDelimiter(line: string): string {
  return line.includes(";") ? ";" : ",";
}

function parseCsvLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

const YES_VALUES = new Set(["oui", "yes", "true", "1", "actif", "operationnel"]);

function parseBool(raw: string | undefined, defaultValue = true): boolean {
  if (raw === undefined || raw.trim() === "") return defaultValue;
  return YES_VALUES.has(raw.trim().toLowerCase());
}

// --- Collaborateurs + tailles -----------------------------------------------

export interface ParsedEmployeeRow {
  firstName: string;
  lastName: string;
  active: boolean;
  operational: boolean;
  sizes: Partial<Record<ItemCategory, string>>;
}

export interface ParseEmployeeResult {
  rows: ParsedEmployeeRow[];
  errors: string[];
}

const SIZE_COLUMN_MAP: Record<string, ItemCategory> = {
  polo: "POLO",
  tshirt: "TSHIRT",
  "t-shirt": "TSHIRT",
  sweatshirt: "SWEATSHIRT",
  veste: "VESTE",
  pantalon: "PANTALON",
  chaussures: "CHAUSSURES",
  bottes: "BOTTES",
};

export function parseEmployeeCsv(text: string): ParseEmployeeResult {
  const errors: string[] = [];
  const rows: ParsedEmployeeRow[] = [];
  const lines = parseCsvLines(text);
  if (lines.length === 0) return { rows, errors };

  const delimiter = detectDelimiter(lines[0]);
  const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

  const idxPrenom = header.indexOf("prenom") !== -1 ? header.indexOf("prenom") : header.indexOf("prénom");
  const idxNom = header.indexOf("nom");
  const idxActif = header.indexOf("actif");
  const idxOperationnel =
    header.indexOf("operationnel") !== -1 ? header.indexOf("operationnel") : header.indexOf("opérationnel");

  if (idxPrenom === -1 || idxNom === -1) {
    errors.push("En-têtes attendus au minimum : prenom, nom (+ actif, operationnel, et tailles en colonnes optionnelles)");
    return { rows, errors };
  }

  const sizeIdx: Partial<Record<ItemCategory, number>> = {};
  for (const [col, cat] of Object.entries(SIZE_COLUMN_MAP)) {
    const i = header.indexOf(col);
    if (i !== -1) sizeIdx[cat] = i;
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    const firstName = cols[idxPrenom] ?? "";
    const lastName = cols[idxNom] ?? "";
    if (!firstName || !lastName) {
      errors.push(`Ligne ${i + 1} : prénom ou nom manquant`);
      continue;
    }

    const sizes: Partial<Record<ItemCategory, string>> = {};
    for (const cat of SIZE_CATEGORIES) {
      const colIndex = sizeIdx[cat];
      if (colIndex !== undefined && cols[colIndex]) sizes[cat] = cols[colIndex];
    }

    rows.push({
      firstName,
      lastName,
      active: parseBool(idxActif !== -1 ? cols[idxActif] : undefined, true),
      operational: parseBool(idxOperationnel !== -1 ? cols[idxOperationnel] : undefined, true),
      sizes,
    });
  }

  return { rows, errors };
}

// --- Stock initial -----------------------------------------------------------

export interface ParsedStockRow {
  category: ItemCategory;
  size: string;
  quantity: number;
  supplier?: string;
  orderReference?: string;
}

export interface ParseStockResult {
  rows: ParsedStockRow[];
  errors: string[];
}

const CATEGORY_ALIASES: Record<string, ItemCategory> = {
  TSHIRT: "TSHIRT",
  "T-SHIRT": "TSHIRT",
  POLO: "POLO",
  SWEATSHIRT: "SWEATSHIRT",
  VESTE: "VESTE",
  PANTALON: "PANTALON",
  CHAUSSURES: "CHAUSSURES",
  "CHAUSSURES DE SECURITE": "CHAUSSURES",
  "CHAUSSURES DE SÉCURITÉ": "CHAUSSURES",
  BOTTES: "BOTTES",
  CASQUETTE: "CASQUETTE",
  ACCESSOIRE: "ACCESSOIRE",
};

export function parseStockCsv(text: string): ParseStockResult {
  const errors: string[] = [];
  const rows: ParsedStockRow[] = [];
  const lines = parseCsvLines(text);
  if (lines.length === 0) return { rows, errors };

  const delimiter = detectDelimiter(lines[0]);
  const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

  const idxCat = header.indexOf("categorie") !== -1 ? header.indexOf("categorie") : header.indexOf("catégorie");
  const idxTaille = header.indexOf("taille");
  const idxQte = header.indexOf("quantite") !== -1 ? header.indexOf("quantite") : header.indexOf("quantité");
  const idxFournisseur = header.indexOf("fournisseur");
  const idxRef = header.indexOf("reference") !== -1 ? header.indexOf("reference") : header.indexOf("référence");

  if (idxCat === -1 || idxTaille === -1 || idxQte === -1) {
    errors.push("En-têtes attendus : categorie, taille, quantite (+ fournisseur, reference en option)");
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    const categoryRaw = (cols[idxCat] ?? "").toUpperCase();
    const category = CATEGORY_ALIASES[categoryRaw];
    if (!category) {
      errors.push(`Ligne ${i + 1} : catégorie inconnue "${cols[idxCat]}"`);
      continue;
    }
    const size = cols[idxTaille];
    const quantity = parseInt(cols[idxQte], 10);
    if (!size || Number.isNaN(quantity) || quantity <= 0) {
      errors.push(`Ligne ${i + 1} : taille ou quantité invalide`);
      continue;
    }

    rows.push({
      category,
      size,
      quantity,
      supplier: idxFournisseur !== -1 ? cols[idxFournisseur] || undefined : undefined,
      orderReference: idxRef !== -1 ? cols[idxRef] || undefined : undefined,
    });
  }

  return { rows, errors };
}
