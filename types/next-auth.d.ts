import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    isMember: boolean;
    isAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      isMember: boolean;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isMember?: boolean;
    isAdmin?: boolean;
  }
}
