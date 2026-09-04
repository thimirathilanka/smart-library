import { MyLibrary } from "@/components/library/MyLibrary";
import { currentUser } from "@/lib/mock-data";

export const metadata = {
  title: "My Library",
};

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-navy-soft uppercase">
        Personal shelf
      </p>
      <h1 className="mt-2 font-serif text-4xl text-navy">My Library</h1>
      <p className="mt-2 text-muted">
        Saved papers, reading history, and favorites for {currentUser.name}.
      </p>
      <div className="mt-8">
        <MyLibrary />
      </div>
    </div>
  );
}
