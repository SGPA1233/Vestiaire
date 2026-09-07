export function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchesEmployeeQuery(
  firstName: string,
  lastName: string,
  query: string
): boolean {
  const nq = normalizeForSearch(query.trim());
  if (!nq) return true;
  const full = normalizeForSearch(`${firstName} ${lastName}`);
  const fullRev = normalizeForSearch(`${lastName} ${firstName}`);
  return full.includes(nq) || fullRev.includes(nq);
}
