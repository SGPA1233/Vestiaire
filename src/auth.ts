import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import {
  clearRateLimit,
  getRequestIp,
  isRateLimited,
  LOGIN_RATE_LIMIT,
  makeRateLimitKey,
  recordRateLimitEvent,
} from "@/lib/rate-limit";

const dummyPasswordHash = bcrypt.hash("not-a-real-user-password", 12);

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password || email.length > 254 || password.length > 256) return null;

        const rateLimitKey = makeRateLimitKey("login", email, getRequestIp(request.headers));
        if (await isRateLimited(rateLimitKey, LOGIN_RATE_LIMIT)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const valid = await bcrypt.compare(password, user?.passwordHash ?? (await dummyPasswordHash));
        if (!user || !user.active || !valid) {
          await recordRateLimitEvent(rateLimitKey, LOGIN_RATE_LIMIT);
          return null;
        }

        await clearRateLimit(rateLimitKey);

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        await writeAuditLog({
          userId: user.id,
          action: "LOGIN",
          entityType: "User",
          entityId: user.id,
          description: `Connexion de ${user.email}`,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id as string;
        token.sessionVersion = (user as { sessionVersion: number }).sessionVersion;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "READONLY";
        session.user.sessionVersion = token.sessionVersion as number;
      }
      return session;
    },
  },
});
