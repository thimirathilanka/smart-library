import { BookOpen, FileText, Users, Eye } from "lucide-react";
import { HeroSearch } from "@/components/home/HeroSearch";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PaperCard } from "@/components/papers/PaperCard";
import { BookCover } from "@/components/ui/BookCover";
import { AccessBadge } from "@/components/ui/AccessBadge";
import {
  featuredBooks,
  latestPapers,
  libraryStats,
  recentlyAdded,
} from "@/lib/mock-data";
import { formatCompact } from "@/lib/format";
import Link from "next/link";

export default function HomePage() {
  const stats = [
    { label: "Total books", value: libraryStats.totalBooks, icon: BookOpen },
    { label: "Research papers", value: libraryStats.researchPapers, icon: FileText },
    { label: "Active members", value: libraryStats.activeMembers, icon: Users },
    { label: "Reads this month", value: libraryStats.readsThisMonth, icon: Eye },
  ];
  const recent = recentlyAdded();

  return (
    <div>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-navy-soft/40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <p className="text-center text-xs font-semibold tracking-[0.28em] text-gold uppercase">
            Online research collections
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-center font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
            A quiet place to read the world&apos;s scholarship
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-7 text-white/75 sm:text-lg">
            Welcome to Nextgen Digital Library. Search the catalog, open books and papers
            in your browser, and keep a personal shelf of what you are reading.
          </p>
          <HeroSearch />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="animate-fade-up rounded-2xl border border-white/40 bg-white/80 p-5 shadow-lg backdrop-blur-md"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">{stat.label}</p>
                  <Icon className="size-4 text-navy-soft" />
                </div>
                <p className="mt-3 font-serif text-3xl text-navy">{formatCompact(stat.value)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Collection"
          title="Featured books"
          description="Hand-picked titles from the current digital collection."
          href="/books"
          action="Browse all books"
        />
        <FeaturedCarousel books={featuredBooks()} />
      </section>

      <section className="bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Scholarship"
            title="Latest research publications"
            description="Recently indexed journal articles and conference papers."
            href="/research"
            action="Browse all papers"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {latestPapers().map((paper) => (
              <PaperCard key={paper._id} paper={paper} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="New arrivals"
          title="Recently added resources"
          description="The newest books and papers added to the digital catalog."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recent.map((item) =>
            item.book ? (
              <Link
                key={item.book._id}
                href={`/books/${item.book._id}`}
                className="flex gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <BookCover book={item.book} size="sm" className="w-16 shrink-0" />
                <div>
                  <p className="text-[11px] tracking-wide text-navy-soft uppercase">Book</p>
                  <h3 className="font-serif text-lg text-navy">{item.book.title}</h3>
                  <p className="mt-1 text-sm text-muted">{item.book.author}</p>
                  <div className="mt-2">
                    <AccessBadge access={item.book.access} />
                  </div>
                </div>
              </Link>
            ) : item.paper ? (
              <Link
                key={item.paper._id}
                href={`/research/${item.paper._id}`}
                className="rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-[11px] tracking-wide text-navy-soft uppercase">Paper</p>
                <h3 className="mt-1 line-clamp-2 font-serif text-lg text-navy">{item.paper.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.paper.authors.join(", ")}</p>
                <p className="mt-2 text-xs text-navy-mid">{item.paper.venue}</p>
              </Link>
            ) : null,
          )}
        </div>
      </section>
    </div>
  );
}
