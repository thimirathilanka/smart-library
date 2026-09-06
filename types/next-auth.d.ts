import type { MemberPlan } from "@/lib/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    plan: MemberPlan;
    isAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      plan: MemberPlan;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    plan?: MemberPlan;
    isAdmin?: boolean;
  }
}
