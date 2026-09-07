import { ItemCategory } from "@prisma/client";

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  TSHIRT: "T-shirt",
  POLO: "Polo",
  SWEATSHIRT: "Sweatshirt",
  VESTE: "Veste",
  PANTALON: "Pantalon",
  CHAUSSURES: "Chaussures de sécurité",
  BOTTES: "Bottes",
  CASQUETTE: "Casquette",
  ACCESSOIRE: "Accessoire",
  AUTRE: "Autre",
};

export const CATEGORY_ORDER: ItemCategory[] = [
  "TSHIRT",
  "POLO",
  "SWEATSHIRT",
  "VESTE",
  "PANTALON",
  "CHAUSSURES",
  "BOTTES",
  "CASQUETTE",
  "ACCESSOIRE",
  "AUTRE",
];

// Catégories utilisées pour la fiche de tailles habituelles d'un collaborateur.
export const SIZE_CATEGORIES: ItemCategory[] = [
  "POLO",
  "TSHIRT",
  "SWEATSHIRT",
  "VESTE",
  "PANTALON",
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

export const SIZE_SUGGESTIONS: Record<string, string[]> = {
  TSHIRT: ["XS", "S", "M", "L", "XL", "XXL"],
  POLO: ["XS", "S", "M", "L", "XL", "XXL"],
  SWEATSHIRT: ["XS", "S", "M", "L", "XL", "XXL"],
  VESTE: ["XS", "S", "M", "L", "XL", "XXL"],
  PANTALON: ["34", "36", "38", "40", "42", "44", "46", "48", "50"],
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
