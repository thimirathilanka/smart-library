import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    "/library",
    "/library/:path*",
    "/membership",
    "/membership/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
