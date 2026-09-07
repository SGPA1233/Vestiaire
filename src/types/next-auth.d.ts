import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "READONLY";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "READONLY";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "READONLY";
  }
}
