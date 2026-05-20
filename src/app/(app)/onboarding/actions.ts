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

  const readingGenresRaw = (formData.get("reading_genres") as string) ?? "";
  const readingGenres = readingGenresRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    default_output_language:
      (formData.get("default_output_language") as string) || "English",
    tone_preference: (formData.get("tone_preference") as string) || "casual",
    directness: (formData.get("directness") as string) || "direct",
    humour_style: (formData.get("humour_style") as string) || "dry",
    job_title: (formData.get("job_title") as string) || null,
    industry: (formData.get("industry") as string) || null,
    business_type: (formData.get("business_type") as string) || null,
    target_clients: (formData.get("target_clients") as string) || null,
    sport: (formData.get("sport") as string) || null,
    team_role: (formData.get("team_role") as string) || null,
    team_name: (formData.get("team_name") as string) || null,
    team_level: (formData.get("team_level") as string) || null,
    reading_genres: readingGenres.length ? readingGenres : null,
    why_i_read: (formData.get("why_i_read") as string) || null,
  });

  redirect("/books");
}
