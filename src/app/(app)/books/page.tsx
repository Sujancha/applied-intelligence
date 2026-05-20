import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus, BookOpen, Lightbulb } from "lucide-react";
import type { Book } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  reading: "Reading",
  finished: "Finished",
  abandoned: "Abandoned",
};

const STATUS_COLOR: Record<string, string> = {
  reading: "bg-blue-50 text-blue-700",
  finished: "bg-green-50 text-green-700",
  abandoned: "bg-zinc-100 text-zinc-500",
};

function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="font-semibold text-zinc-900 leading-snug">{book.title}</h2>
          {book.author && (
            <p className="text-sm text-zinc-500">{book.author}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[book.status] ?? STATUS_COLOR.reading}`}
        >
          {STATUS_LABEL[book.status] ?? book.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-400">
        {book.genre && <span>{book.genre}</span>}
        <span className="flex items-center gap-1">
          <Lightbulb size={12} />
          {book.total_insights} insight{book.total_insights !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}

export default async function BooksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  // Redirect to onboarding if no profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const list = (books ?? []) as Book[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Your books</h1>
        <Link
          href="/books/new"
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
          Add book
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-20 text-center">
          <BookOpen size={32} className="mb-3 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">No books yet</p>
          <p className="mt-1 text-sm text-zinc-400">
            Add your first book and start extracting insights.
          </p>
          <Link
            href="/books/new"
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Plus size={14} />
            Add book
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
