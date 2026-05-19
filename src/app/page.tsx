// Server Component — env vars checked here, never sent to the browser
const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className={ok ? "text-green-500" : "text-red-500"}>
        {ok ? "✓" : "✗"}
      </span>
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="text-xs text-zinc-400 dark:text-zinc-600">
        {ok ? "present" : "missing"}
      </span>
    </li>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950 px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Applied Intelligence
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Foundation ready — no features yet.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Environment
          </p>
          <ul className="space-y-2">
            <StatusRow label="NEXT_PUBLIC_SUPABASE_URL" ok={supabaseConfigured} />
            <StatusRow label="ANTHROPIC_API_KEY" ok={anthropicConfigured} />
          </ul>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Copy <code className="font-mono">.env.local.example</code> →{" "}
          <code className="font-mono">.env.local</code> and fill in your keys.
        </p>
      </div>
    </main>
  );
}
