import type { NextAuthConfig } from "next-auth";
import type { MemberPlan } from "@/lib/types";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const user = auth?.user as { isAdmin?: boolean } | undefined;
      const isLoggedIn = Boolean(auth?.user);
      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }
      if (pathname.startsWith("/library") && !isLoggedIn) return false;
      if (pathname.startsWith("/admin") && !user?.isAdmin) {
        if (!isLoggedIn) return false;
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.plan = (token.plan as MemberPlan) ?? "free";
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
