import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  const allConfigured = supabaseConfigured && anthropicConfigured;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="max-w-sm w-full space-y-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-900">
            <BookOpen size={20} />
            <h1 className="text-2xl font-semibold">Applied Intelligence</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Turn what you read into what you do.
          </p>
        </div>

        <div className="space-y-3">
          {user ? (
            <Link
              href="/books"
              className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Go to your books
            </Link>
          ) : (
            <>
              <Link
                href="/auth/sign-up"
                className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
              >
                Get started
              </Link>
              <Link
                href="/auth/sign-in"
                className="flex w-full items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        {/* Dev env status */}
        {!allConfigured && (
          <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Environment
            </p>
            <ul className="space-y-1.5">
              {[
                { label: "NEXT_PUBLIC_SUPABASE_URL", ok: supabaseConfigured },
                { label: "ANTHROPIC_API_KEY", ok: anthropicConfigured },
              ].map(({ label, ok }) => (
                <li key={label} className="flex items-center gap-2 text-sm">
                  <span className={ok ? "text-green-500" : "text-red-500"}>
                    {ok ? "✓" : "✗"}
                  </span>
                  <span className="font-mono text-xs text-zinc-600">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
