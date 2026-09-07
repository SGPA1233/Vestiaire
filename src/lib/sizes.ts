const CLOTHING_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Unique"];

export function compareSizes(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  const aIsNum = a.trim() !== "" && !Number.isNaN(na);
  const bIsNum = b.trim() !== "" && !Number.isNaN(nb);

  if (aIsNum && bIsNum) return na - nb;
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
