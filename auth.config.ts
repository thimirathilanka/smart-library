import type { NextAuthConfig } from "next-auth";

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
      const user = auth?.user as { isAdmin?: boolean; isAuthor?: boolean } | undefined;
      const isLoggedIn = Boolean(auth?.user);
      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }
      if (
        (pathname.startsWith("/library") ||
          pathname.startsWith("/membership") ||
          pathname.startsWith("/author")) &&
        !isLoggedIn
      ) {
        return false;
      }
      if (pathname.startsWith("/author") && !user?.isAuthor) {
        return Response.redirect(new URL("/", request.nextUrl));
      }
      if (pathname.startsWith("/admin") && !user?.isAdmin) {
        if (!isLoggedIn) return false;
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.isMember = user.isMember;
        token.isAdmin = user.isAdmin;
        token.isAuthor = user.isAuthor;
      }
      if (trigger === "update" && session) {
        if (typeof session.isMember === "boolean") token.isMember = session.isMember;
        if (typeof session.isAuthor === "boolean") token.isAuthor = session.isAuthor;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.isMember = Boolean(token.isMember);
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.isAuthor = Boolean(token.isAuthor);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
