import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { extractInsight } from "./actions";
import type { Book } from "@/types";

export default async function ExtractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: bookData } = await supabase
    .from("books")
    .select("id, title, author")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!bookData) notFound();
  const book = bookData as Pick<Book, "id" | "title" | "author">;

  const boundAction = extractInsight.bind(null, id);

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/books/${id}`}
          className="text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Extract insight</h1>
          <p className="text-sm text-zinc-500">
            {book.title}
            {book.author ? ` — ${book.author}` : ""}
          </p>
        </div>
      </div>

      <form action={boundAction} className="space-y-5">
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-zinc-700"
            htmlFor="passage"
          >
            Paste the passage <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-zinc-400">
            A sentence, paragraph, or any chunk of text you want to unpack.
          </p>
          <textarea
            id="passage"
            name="passage"
            required
            rows={8}
            placeholder="Paste the text from the book here…"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-zinc-700"
            htmlFor="reaction_note"
          >
            Why did this hit you?{" "}
            <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-zinc-400">
            Your reaction helps Claude personalise the insight to your situation.
          </p>
          <textarea
            id="reaction_note"
            name="reaction_note"
            rows={3}
            placeholder="e.g. This made me think of how I price my photography jobs…"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none resize-y"
          />
        </div>

        <SubmitButton loadingText="Extracting insight…">
          Extract insight
        </SubmitButton>
      </form>
    </div>
  );
}
