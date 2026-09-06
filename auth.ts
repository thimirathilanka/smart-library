import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { getMemberByEmail } from "@/lib/data/members";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const member = await getMemberByEmail(email);
        if (!member || member.status === "Suspended") return null;
        const valid = await compare(password, member.passwordHash);
        if (!valid) return null;

        return {
          id: member._id,
          name: member.name,
          email: member.email,
          isMember: Boolean(member.isMember),
          isAdmin: Boolean(member.isAdmin),
        };
      },
    }),
  ],
});
