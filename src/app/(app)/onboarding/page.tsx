import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { createProfile } from "./actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  if (existing) redirect("/books");

  return (
    <div className="max-w-md">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Quick setup</h1>
        <p className="text-sm text-zinc-500">
          Three questions and you&apos;re in. You can add more context later.
        </p>
      </div>

      <form action={createProfile} className="space-y-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="display_name">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            id="display_name"
            name="display_name"
            required
            placeholder="Sujan"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-zinc-700">
            Preferred output language
          </legend>
          {[
            { value: "English", label: "English" },
            { value: "Nepali", label: "Nepali (spoken bilingual style)" },
            { value: "Both", label: "Both (English + Nepali)" },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="default_output_language"
                value={value}
                defaultChecked={value === "English"}
                className="accent-zinc-900"
              />
              <span className="text-sm text-zinc-700">{label}</span>
            </label>
          ))}
        </fieldset>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700" htmlFor="why_i_read">
            Why do you read?{" "}
            <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <input
            id="why_i_read"
            name="why_i_read"
            placeholder="e.g. To find practical tools I can apply immediately"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <SubmitButton loadingText="Setting up…">Get started</SubmitButton>
      </form>
    </div>
  );
}
