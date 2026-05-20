"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function addBook(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Title is required");

  const { data: book, error } = await supabase
    .from("books")
    .insert({
      user_id: user.id,
      title,
      author: (formData.get("author") as string) || null,
      genre: (formData.get("genre") as string) || null,
      status: (formData.get("status") as string) || "reading",
    })
    .select("id")
    .single();

  if (error || !book) throw new Error("Failed to create book");

  redirect(`/books/${book.id}`);
}

export async function updateBookStatus(bookId: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  await supabase
    .from("books")
    .update({ status })
    .eq("id", bookId)
    .eq("user_id", user.id);
}
