"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "sans-serif" }}>
          <div style={{ maxWidth: 520, textAlign: "center" }}>
            <h1>Le site n&apos;a pas pu charger</h1>
            <p>Le service est temporairement indisponible. Aucune donnée n&apos;a été supprimée.</p>
            <button type="button" onClick={reset} style={{ padding: "12px 18px", cursor: "pointer" }}>
              Réessayer
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
