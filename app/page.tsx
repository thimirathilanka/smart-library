import { ArrowRight, BookOpen, FileText, Play, Users, Eye } from "lucide-react";
import { auth } from "@/auth";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { BookCover } from "@/components/ui/BookCover";
import { featuredBooks, mostViewedBook } from "@/lib/data/books";
import { latestPapers } from "@/lib/data/papers";
import { getLibraryStats, recentlyAdded } from "@/lib/data/catalog";
import { getRecommendedBooks } from "@/lib/data/recommendations";
import { formatCompact } from "@/lib/format";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  const memberId = session?.user?.id;

  const [statsData, shelf, lead, papers, recent] = await Promise.all([
    getLibraryStats(),
    memberId ? getRecommendedBooks(memberId) : featuredBooks().then((books) => ({ books, personalized: false })),
    mostViewedBook(),
    latestPapers(),
    recentlyAdded(),
  ]);
  const stats = [
    { label: "Total books", value: statsData.totalBooks, icon: BookOpen },
    { label: "Research papers", value: statsData.researchPapers, icon: FileText },
    { label: "Active members", value: statsData.activeMembers, icon: Users },
    { label: "Reads this month", value: statsData.readsThisMonth, icon: Eye },
  ];

  const personalized = shelf.personalized;
  const shelfBooks = lead ? shelf.books.filter((book) => book._id !== lead._id) : shelf.books;

  return (
    <div className="overflow-hidden bg-[#101311] text-white">
      <section className="relative isolate border-b border-white/10">
        {lead ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-cover bg-[position:65%_38%] opacity-70"
            style={{
              backgroundImage: lead.coverId
                ? `url(/api/books/${lead._id}/cover)`
                : `linear-gradient(135deg, ${lead.cover.from}, ${lead.cover.to})`,
            }}
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#101311_0%,rgba(16,19,17,.88)_32%,rgba(16,19,17,.28)_72%,rgba(16,19,17,.12)_100%),linear-gradient(0deg,#101311_0%,transparent_48%)]" />
        <div className="mx-auto grid min-h-[490px] max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 md:min-h-[550px] md:grid-cols-[1.15fr_.85fr] md:py-16 lg:px-10">
          <div className="relative z-10 max-w-2xl animate-fade-up">
            <div className="mb-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.24em] text-[#e50914] uppercase">
              The Nextgen collection
            </div>
            {lead ? (
              <>
                <p className="mb-3 text-sm font-medium text-white/65">Most viewed · {lead.category}</p>
                <h1 className="max-w-xl font-serif text-4xl leading-[1.08] text-white sm:text-5xl lg:text-6xl">
                  {lead.title}
                </h1>
                <p className="mt-4 text-sm text-white/75 sm:text-base">
                  {lead.author} <span className="px-2 text-white/35">/</span> {lead.year}
                  {lead.rating > 0 ? <span className="px-2 text-[#e50914]">★ {lead.rating.toFixed(1)}</span> : null}
                </p>
                <p className="mt-5 line-clamp-3 max-w-lg text-sm leading-7 text-white/65 sm:text-base">
                  {lead.description}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/books/${lead._id}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-[#f3f3f1] px-5 text-sm font-semibold text-[#151715] transition hover:bg-[#dededb]"
                  >
                    <Play className="size-4 fill-current" />
                    Explore title
                  </Link>
                  <Link
                    href="/books"
                    className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-white/25 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
                  >
                    <BookOpen className="size-4" />
                    Browse collection
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="max-w-xl font-serif text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
                  A world of ideas, ready when you are.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
                  Explore books and research selected for curious minds.
                </p>
                <Link href="/books" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-sm bg-[#f3f3f1] px-5 text-sm font-semibold text-[#151715]">
                  <BookOpen className="size-4" /> Browse the library
                </Link>
              </>
            )}
          </div>
          {lead ? (
            <Link
              href={`/books/${lead._id}`}
              aria-label={`Explore ${lead.title}`}
              className="group relative mx-auto hidden w-full max-w-[250px] animate-fade-up md:block lg:max-w-[290px]"
              style={{ animationDelay: "120ms" }}
            >
              <div className="absolute -inset-x-12 -inset-y-10 -z-10 bg-black/30 blur-2xl" />
              <BookCover book={lead} size="hero" className="!max-w-none rounded-[2px] shadow-[0_28px_70px_-24px_rgba(0,0,0,.9)] transition duration-500 group-hover:-translate-y-2 group-hover:rotate-1" />
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-2 border-b border-white/10 px-5 py-5 sm:px-8 md:grid-cols-4 lg:px-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`flex items-center gap-3 py-3 ${index > 1 ? "border-white/10 md:border-l md:pl-6" : ""} ${index === 1 ? "border-l border-white/10 pl-4 md:pl-6" : ""}`}>
              <Icon className="size-4 shrink-0 text-[#e50914]" />
              <div>
                <p className="font-serif text-xl leading-none text-white sm:text-2xl">{formatCompact(stat.value)}</p>
                <p className="mt-1 text-[10px] tracking-[0.12em] text-white/45 uppercase sm:text-[11px]">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </section>

      {shelfBooks.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 pt-12 pb-10 sm:px-8 lg:px-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-[#e50914] uppercase">Curated for you</p>
              <h2 className="font-serif text-2xl text-white sm:text-3xl">
                {personalized ? "Based on your reading" : "Featured books"}
              </h2>
            </div>
            <Link href="/books" className="group mb-1 inline-flex shrink-0 items-center gap-2 text-xs font-medium text-white/55 transition hover:text-white sm:text-sm">
              View all <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
          <FeaturedCarousel books={shelfBooks} />
        </section>
      ) : null}

      {papers.length > 0 ? (
        <section className="border-t border-white/10 bg-[#151816]">
          <div className="mx-auto max-w-7xl px-5 py-11 sm:px-8 lg:px-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-[#e50914] uppercase">Ideas in motion</p>
                <h2 className="font-serif text-2xl text-white sm:text-3xl">Latest research</h2>
              </div>
              <Link href="/research" className="group mb-1 inline-flex shrink-0 items-center gap-2 text-xs font-medium text-white/55 transition hover:text-white sm:text-sm">
                All research <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid gap-x-10 md:grid-cols-2">
              {papers.map((paper) => (
                <Link key={paper._id} href={`/research/${paper._id}`} className="group border-t border-white/10 py-5 transition hover:border-[#c7aa70]/60">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[#e50914] uppercase">{paper.field} <span className="px-1 text-white/25">/</span> {paper.year}</p>
                  <h3 className="mt-2 line-clamp-2 font-serif text-lg leading-snug text-white/90 transition group-hover:text-white sm:text-xl">{paper.title}</h3>
                  <p className="mt-2 line-clamp-1 text-xs text-white/45">{paper.authors.join(" · ")} <span className="px-1 text-white/20">/</span> {paper.venue}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-11 sm:px-8 lg:px-10">
          <div className="mb-5">
            <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-[#e50914] uppercase">Just added</p>
            <h2 className="font-serif text-2xl text-white sm:text-3xl">New to the library</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((item) => {
              const isBook = Boolean(item.book);
              const title = item.book?.title ?? item.paper?.title ?? "Untitled resource";
              const href = item.book ? `/books/${item.book._id}` : `/research/${item.paper?._id}`;
              return (
                <Link key={`${item.kind}-${item.book?._id ?? item.paper?._id}`} href={href} className="group flex min-w-0 items-center gap-4 border-t border-white/10 py-3 transition hover:border-[#c7aa70]/50">
                  {item.book ? (
                    <BookCover book={item.book} size="sm" className="w-12 shrink-0 opacity-85 transition group-hover:opacity-100" />
                  ) : (
                    <span className="flex aspect-[3/4] w-12 shrink-0 items-center justify-center bg-white/[0.06] text-[#c7aa70]"><FileText className="size-5" /></span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold tracking-[0.16em] text-[#e50914] uppercase">{isBook ? "Book" : "Research"}</span>
                    <span className="mt-1 block line-clamp-2 font-serif text-base leading-snug text-white/85 group-hover:text-white">{title}</span>
                    <span className="mt-1 block truncate text-xs text-white/45">{item.book?.author ?? item.paper?.authors.join(" · ")}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
