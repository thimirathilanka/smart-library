import { MyLibrary } from "@/components/library/MyLibrary";
import { auth } from "@/auth";
import { listBooks } from "@/lib/data/books";
import { getMemberLibrary } from "@/lib/data/members";
import { listPapers } from "@/lib/data/papers";

export const metadata = {
  title: "My Library",
};

export default async function LibraryPage() {
  const session = await auth();
  const name = session?.user?.name ?? "you";
  const library = session?.user?.id
    ? await getMemberLibrary(session.user.id)
    : { saved: [], history: [], favorites: [] };
  const [books, papers] = await Promise.all([listBooks(), listPapers()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Personal shelf
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">My Library</h1>
      <p className="mt-2 text-muted">
        Favorites and saved titles for {name}, plus reading history.
      </p>
      <div className="mt-8">
        <MyLibrary library={library} books={books} papers={papers} />
      </div>
    </div>
  );
}
