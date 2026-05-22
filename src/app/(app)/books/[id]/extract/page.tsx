import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ExtractForm } from "@/components/ExtractForm";
import { extractInsight } from "./actions";
import type { Book, Profile } from "@/types";

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

  const [{ data: bookData }, { data: profileData }] = await Promise.all([
    supabase
      .from("books")
      .select("id, title, author")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase.from("profiles").select("default_output_language").eq("id", user.id).single(),
  ]);

  if (!bookData) notFound();
  const book = bookData as Pick<Book, "id" | "title" | "author">;
  const profile = profileData as Pick<Profile, "default_output_language"> | null;

  const boundAction = extractInsight.bind(null, id);

  return (
    <ExtractForm
      bookId={book.id}
      bookTitle={book.title}
      bookAuthor={book.author}
      defaultLanguage={profile?.default_output_language ?? "English"}
      action={boundAction}
    />
  );
}
