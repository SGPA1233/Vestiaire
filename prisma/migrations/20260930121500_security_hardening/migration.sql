-- Invalider les anciennes sessions lors d'un changement de mot de passe ou d'accès.
ALTER TABLE "users"
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Les anciens jetons étaient stockés en clair. Ils ne doivent plus rester utilisables.
DELETE FROM "password_reset_tokens";

-- Limitation persistante des tentatives de connexion et de réinitialisation.
CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_limit_buckets_updatedAt_idx" ON "rate_limit_buckets"("updatedAt");
