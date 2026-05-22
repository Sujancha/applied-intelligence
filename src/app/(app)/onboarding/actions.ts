"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const displayName = (formData.get("display_name") as string)?.trim();
  if (!displayName) throw new Error("Display name is required");

  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    default_output_language:
      (formData.get("default_output_language") as string) || "English",
    why_i_read: (formData.get("why_i_read") as string)?.trim() || null,
  });

  redirect("/books");
}
