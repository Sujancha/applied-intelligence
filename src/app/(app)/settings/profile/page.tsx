import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { updateProfile } from "./actions";
import type { Profile } from "@/types";

function Field({
  label,
  name,
  placeholder,
  required,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string | null;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-700" htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
      <input
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
      />
    </div>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-700" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default async function SettingsProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profileData) redirect("/onboarding");

  const p = profileData as Profile;

  return (
    <div className="max-w-xl">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold text-zinc-900">Profile</h1>
        <p className="text-sm text-zinc-500">
          This context feeds every AI response. Fill in as much as is relevant.
        </p>
      </div>

      {saved === "1" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Profile saved.
        </div>
      )}

      <form action={updateProfile} className="space-y-8">
        {/* Identity */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Identity
          </h2>
          <Field
            label="Your name"
            name="display_name"
            required
            defaultValue={p.display_name}
          />
          <Field
            label="Location"
            name="location"
            placeholder="e.g. Sydney, Australia"
            defaultValue={p.location}
          />
          <Select
            label="Preferred output language"
            name="default_output_language"
            defaultValue={p.default_output_language}
            options={[
              { value: "English", label: "English" },
              { value: "Nepali", label: "Nepali (spoken bilingual style)" },
              { value: "Both", label: "Both (English + Nepali)" },
            ]}
          />
        </section>

        {/* Communication style */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Communication style
          </h2>
          <Select
            label="Tone"
            name="tone_preference"
            defaultValue={p.tone_preference}
            options={[
              { value: "casual", label: "Casual" },
              { value: "formal", label: "Formal" },
              { value: "balanced", label: "Balanced" },
            ]}
          />
          <Select
            label="Directness"
            name="directness"
            defaultValue={p.directness}
            options={[
              { value: "direct", label: "Direct" },
              { value: "diplomatic", label: "Diplomatic" },
              { value: "balanced", label: "Balanced" },
            ]}
          />
          <Select
            label="Humour"
            name="humour_style"
            defaultValue={p.humour_style}
            options={[
              { value: "dry", label: "Dry" },
              { value: "warm", label: "Warm" },
              { value: "none", label: "None" },
            ]}
          />
        </section>

        {/* Professional */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Professional context
          </h2>
          <Field
            label="Job title"
            name="job_title"
            placeholder="e.g. Product Manager"
            defaultValue={p.job_title}
          />
          <Field
            label="Industry"
            name="industry"
            placeholder="e.g. Technology"
            defaultValue={p.industry}
          />
          <Field
            label="Business / side hustle"
            name="business_type"
            placeholder="e.g. Photography & Videography"
            defaultValue={p.business_type}
          />
          <Field
            label="Target clients"
            name="target_clients"
            placeholder="e.g. Cricket clubs, weddings, small businesses"
            defaultValue={p.target_clients}
          />
          <Field
            label="Common objections"
            name="common_objections"
            placeholder="e.g. too expensive, can do it ourselves"
            hint="Comma-separated"
            defaultValue={p.common_objections?.join(", ") ?? ""}
          />
        </section>

        {/* Sport */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Sport & leadership
          </h2>
          <Field
            label="Sport"
            name="sport"
            placeholder="e.g. Cricket"
            defaultValue={p.sport}
          />
          <Field
            label="Your role"
            name="team_role"
            placeholder="e.g. Captain"
            defaultValue={p.team_role}
          />
          <Field
            label="Team name"
            name="team_name"
            placeholder="e.g. Warriors CC"
            defaultValue={p.team_name}
          />
          <Select
            label="Team level"
            name="team_level"
            defaultValue={p.team_level}
            options={[
              { value: "community", label: "Community" },
              { value: "competitive", label: "Competitive" },
              { value: "semi-pro", label: "Semi-pro" },
              { value: "professional", label: "Professional" },
            ]}
          />
          <Field
            label="Captaincy style"
            name="captaincy_style"
            placeholder="e.g. Lead by example, quiet intensity, direct but supportive"
            defaultValue={p.captaincy_style}
          />
        </section>

        {/* Reading */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Reading context
          </h2>
          <Field
            label="Genres"
            name="reading_genres"
            placeholder="e.g. self-help, business, psychology"
            hint="Comma-separated"
            defaultValue={p.reading_genres?.join(", ") ?? ""}
          />
          <Field
            label="Why do you read?"
            name="why_i_read"
            placeholder="e.g. To find practical tools I can apply immediately"
            defaultValue={p.why_i_read}
          />
        </section>

        <SubmitButton loadingText="Saving…">Save profile</SubmitButton>
      </form>
    </div>
  );
}
