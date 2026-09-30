import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "READONLY";
      sessionUpdatedAt: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "READONLY";
    sessionUpdatedAt: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "READONLY";
    sessionUpdatedAt: string;
  }
}
