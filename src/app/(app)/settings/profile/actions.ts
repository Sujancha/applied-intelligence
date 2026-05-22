"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const readingGenresRaw = (formData.get("reading_genres") as string) ?? "";
  const readingGenres = readingGenresRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const commonObjectionsRaw =
    (formData.get("common_objections") as string) ?? "";
  const commonObjections = commonObjectionsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await supabase
    .from("profiles")
    .update({
      display_name:
        (formData.get("display_name") as string)?.trim() || undefined,
      default_output_language:
        (formData.get("default_output_language") as string) || undefined,
      tone_preference:
        (formData.get("tone_preference") as string) || undefined,
      directness: (formData.get("directness") as string) || undefined,
      humour_style: (formData.get("humour_style") as string) || undefined,
      location: (formData.get("location") as string)?.trim() || null,
      job_title: (formData.get("job_title") as string)?.trim() || null,
      industry: (formData.get("industry") as string)?.trim() || null,
      business_type: (formData.get("business_type") as string)?.trim() || null,
      target_clients:
        (formData.get("target_clients") as string)?.trim() || null,
      common_objections: commonObjections.length ? commonObjections : null,
      sport: (formData.get("sport") as string)?.trim() || null,
      team_role: (formData.get("team_role") as string)?.trim() || null,
      team_name: (formData.get("team_name") as string)?.trim() || null,
      team_level: (formData.get("team_level") as string) || null,
      captaincy_style:
        (formData.get("captaincy_style") as string)?.trim() || null,
      reading_genres: readingGenres.length ? readingGenres : null,
      why_i_read: (formData.get("why_i_read") as string)?.trim() || null,
    })
    .eq("id", user.id);

  redirect("/settings/profile?saved=1");
}
