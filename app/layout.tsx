import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nextgen Digital Library",
    template: "%s · Nextgen Digital Library",
  },
  description:
    "An online academic library for books and research papers. Read in the browser.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? "Member",
        email: session.user.email ?? "",
        isMember: Boolean(session.user.isMember),
        isAdmin: Boolean(session.user.isAdmin),
      }
    : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
