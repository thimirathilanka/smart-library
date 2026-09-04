import type { MemberRole } from "@/lib/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: MemberRole;
  }

  interface Session {
    user: {
      id: string;
      role: MemberRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: MemberRole;
  }
}
