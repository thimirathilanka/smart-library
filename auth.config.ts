import type { NextAuthConfig } from "next-auth";
import type { MemberRole } from "@/lib/types";

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
      const role = (auth?.user as { role?: MemberRole } | undefined)?.role;
      const isLoggedIn = Boolean(auth?.user);
      const isStaff = role === "Admin" || role === "Librarian";
      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }
      if (pathname.startsWith("/library") && !isLoggedIn) return false;
      if (pathname.startsWith("/admin") && !isStaff) {
        if (!isLoggedIn) return false;
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: MemberRole }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = (token.role as MemberRole) ?? "Student";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
