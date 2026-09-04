import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-gold" />
            <p className="font-serif text-xl">Nextgen Digital Library</p>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
            An online research library for scholars, students, and the public.
            Read books and papers in the browser—no physical loans, no file
            downloads.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] text-gold uppercase">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/80">
            <Link href="/books" className="hover:text-white">Books</Link>
            <Link href="/research" className="hover:text-white">Research Papers</Link>
            <Link href="/library" className="hover:text-white">My Library</Link>
          </div>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] text-gold uppercase">Contact</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/80">
            <span>Independent digital library</span>
            <span>Collections &amp; Metadata</span>
            <span>hello@nextgen.library</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Nextgen Digital Library
      </div>
    </footer>
  );
}
