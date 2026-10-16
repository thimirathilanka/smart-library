import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { getMemberByEmail, hasActiveMembership } from "@/lib/data/members";
import { recordActivity } from "@/lib/data/activity";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  logger: {
    error(error) {
      // Auth.js deletes a session cookie it cannot decrypt. This commonly follows
      // a local secret change, so keep the app usable while requiring a fresh login.
      if ("type" in error && error.type === "JWTSessionError") {
        console.warn("[auth] An invalid session cookie was cleared. Sign in again to continue.");
        return;
      }
      console.error(error);
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
          isMember: hasActiveMembership(member),
          isAdmin: Boolean(member.isAdmin),
          isAuthor: Boolean(member.isAuthor),
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      await recordActivity({ actorId: user.id ?? null, action: "auth.signed_in", detail: "Signed in" });
    },
  },
});
