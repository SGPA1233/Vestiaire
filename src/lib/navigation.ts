/**
 * N'accepte que les destinations internes. Les valeurs proviennent de l'URL
 * de connexion et doivent donc être considérées comme non fiables.
 */
export function safeInternalPath(value: string | null | undefined, fallback = "/"): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const base = new URL("https://app.invalid");
    const parsed = new URL(value, base);
    if (parsed.origin !== base.origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
