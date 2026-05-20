import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { createProfile } from "./actions";

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
  defaultValue?: string;
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
        defaultValue={defaultValue}
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
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-700" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
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
    <div className="max-w-xl">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Set up your profile
        </h1>
        <p className="text-sm text-zinc-500">
          This context feeds every AI response. The more you add, the more
          personalised the output.
        </p>
      </div>

      <form action={createProfile} className="space-y-8">
        {/* Identity */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Identity
          </h2>
          <Field label="Your name" name="display_name" placeholder="Sujan" required />
          <Select
            label="Preferred output language"
            name="default_output_language"
            defaultValue="English"
            options={[
              { value: "English", label: "English" },
              { value: "Nepali", label: "Nepali (bilingual)" },
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
            defaultValue="casual"
            options={[
              { value: "casual", label: "Casual" },
              { value: "formal", label: "Formal" },
              { value: "balanced", label: "Balanced" },
            ]}
          />
          <Select
            label="Directness"
            name="directness"
            defaultValue="direct"
            options={[
              { value: "direct", label: "Direct" },
              { value: "diplomatic", label: "Diplomatic" },
              { value: "balanced", label: "Balanced" },
            ]}
          />
          <Select
            label="Humour"
            name="humour_style"
            defaultValue="dry"
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
          <Field label="Job title" name="job_title" placeholder="e.g. Product Manager" />
          <Field label="Industry" name="industry" placeholder="e.g. Technology" />
          <Field
            label="Business / side hustle"
            name="business_type"
            placeholder="e.g. Photography & Videography"
          />
          <Field
            label="Target clients"
            name="target_clients"
            placeholder="e.g. Cricket clubs, weddings, small businesses"
          />
        </section>

        {/* Sport / captaincy */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Sport & leadership
          </h2>
          <Field label="Sport" name="sport" placeholder="e.g. Cricket" />
          <Field label="Your role" name="team_role" placeholder="e.g. Captain" />
          <Field label="Team name" name="team_name" placeholder="e.g. Warriors CC" />
          <Select
            label="Team level"
            name="team_level"
            defaultValue="community"
            options={[
              { value: "community", label: "Community" },
              { value: "competitive", label: "Competitive" },
              { value: "semi-pro", label: "Semi-pro" },
              { value: "professional", label: "Professional" },
            ]}
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
          />
          <Field
            label="Why do you read?"
            name="why_i_read"
            placeholder="e.g. To find practical tools I can apply immediately"
          />
        </section>

        <SubmitButton loadingText="Saving…">Save & go to books</SubmitButton>
      </form>
    </div>
  );
}
