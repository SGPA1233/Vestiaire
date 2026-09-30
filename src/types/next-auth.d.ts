import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "READONLY";
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "READONLY";
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "READONLY";
    sessionVersion: number;
  }
}
