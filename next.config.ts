import type { NextConfig } from "next";

// Remarque : "output: standalone" (utile pour Docker/VPS) est volontairement
// omis ici — l'application est déployée sur Vercel, qui gère son propre
// packaging optimisé. Si vous repassez un jour sur Docker/VPS, réactivez-le.
const nextConfig: NextConfig = {};

export default nextConfig;
