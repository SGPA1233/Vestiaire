import { ItemCategory } from "@prisma/client";

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  TSHIRT: "T-shirt",
  DEBARDEUR: "Débardeur",
  POLO: "Polo",
  SWEATSHIRT: "Sweat à capuche",
  VESTE: "Veste",
  PANTALON: "Pantalon",
  SHORT: "Short",
  CHAUSSURES: "Chaussures",
  BOTTES: "Bottes",
  CASQUETTE: "Casquette",
  ACCESSOIRE: "Accessoire",
  AUTRE: "Autre",
};

export const CATEGORY_ORDER: ItemCategory[] = [
  "TSHIRT",
  "DEBARDEUR",
  "POLO",
  "SWEATSHIRT",
  "VESTE",
  "PANTALON",
  "SHORT",
  "CHAUSSURES",
  "BOTTES",
  "CASQUETTE",
  "ACCESSOIRE",
  "AUTRE",
];

// Catégories utilisées pour la fiche de tailles habituelles d'un collaborateur —
// alignées sur les articles réellement distribués (pas de Polo commandé).
export const SIZE_CATEGORIES: ItemCategory[] = [
  "TSHIRT",
  "DEBARDEUR",
  "SWEATSHIRT",
  "VESTE",
  "PANTALON",
  "SHORT",
  "CHAUSSURES",
  "BOTTES",
];

// Catégories considérées comme nécessaires pour qu'un collaborateur soit
// "Équipé" dans la campagne active. Ajustable ici sans toucher au reste du code.
export const REQUIRED_CATEGORIES_FOR_EQUIPPED: ItemCategory[] = [
  "TSHIRT",
  "VESTE",
  "PANTALON",
  "CHAUSSURES",
];

const PANT_SIZES = Array.from({ length: 60 - 34 + 1 }, (_, i) => String(34 + i));

export const SIZE_SUGGESTIONS: Record<string, string[]> = {
  TSHIRT: ["XS", "S", "M", "L", "XL", "XXL"],
  DEBARDEUR: ["XS", "S", "M", "L", "XL", "XXL"],
  POLO: ["XS", "S", "M", "L", "XL", "XXL"],
  SWEATSHIRT: ["XS", "S", "M", "L", "XL", "XXL"],
  VESTE: ["XS", "S", "M", "L", "XL", "XXL"],
  PANTALON: PANT_SIZES,
  SHORT: PANT_SIZES,
  CHAUSSURES: [
    "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48",
  ],
  BOTTES: [
    "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48",
  ],
  CASQUETTE: ["Unique"],
  ACCESSOIRE: ["Unique"],
  AUTRE: [],
};

export const ACTION_LABELS: Record<string, string> = {
  Distribution: "Distribution",
  Retour: "Retour",
  Échange: "Échange",
  Correction: "Correction",
};
