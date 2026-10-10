import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { getMemberByEmail, getMemberById } from "@/lib/data/members";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt(args) {
      const token = await authConfig.callbacks.jwt(args);
      if (args.trigger === "update" && token.id) {
        const member = await getMemberById(String(token.id));
        token.isMember = Boolean(member?.isMember);
        token.isAuthor = Boolean(member?.isAuthor);
      }
      return token;
    },
  },
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
          isAuthor: Boolean(member.isAuthor),
        };
      },
    }),
  ],
});
