const CLOTHING_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Unique"];

export function compareSizes(a: string, b: string): number {
  // Nombre pur ("42") ou nombre préfixé (taille allemande "C42") : on compare
  // sur la partie numérique pour trier logiquement plutôt qu'alphabétiquement.
  const ma = a.match(/\d+/);
  const mb = b.match(/\d+/);
  const na = ma ? Number(ma[0]) : NaN;
  const nb = mb ? Number(mb[0]) : NaN;
  const aIsNum = ma !== null;
  const bIsNum = mb !== null;

  if (aIsNum && bIsNum && na !== nb) return na - nb;
  if (aIsNum !== bIsNum) return aIsNum ? -1 : 1;

  const ia = CLOTHING_ORDER.indexOf(a.toUpperCase());
  const ib = CLOTHING_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== ib) return ia === -1 ? 1 : -1;

  return a.localeCompare(b);
}

export function sortSizes<T>(items: T[], getSize: (item: T) => string): T[] {
  return [...items].sort((a, b) => compareSizes(getSize(a), getSize(b)));
}
