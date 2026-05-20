import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Plus, Lightbulb, CheckCircle2, Circle, Clock } from "lucide-react";
import type { Book, InsightWithActions } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  reading: "bg-blue-50 text-blue-700",
  finished: "bg-green-50 text-green-700",
  abandoned: "bg-zinc-100 text-zinc-500",
};

const ACTION_STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Circle size={14} className="text-zinc-300" />,
  tried_worked: <CheckCircle2 size={14} className="text-green-500" />,
  tried_flopped: <CheckCircle2 size={14} className="text-red-400" />,
  skipped: <Circle size={14} className="text-zinc-200" />,
};

function InsightCard({ insight }: { insight: InsightWithActions }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
      {/* Core idea */}
      <p className="text-zinc-900 leading-relaxed">{insight.ai_core_idea}</p>

      {/* Why it matters */}
      {insight.ai_why_it_matters && (
        <p className="text-sm text-zinc-500 leading-relaxed border-l-2 border-zinc-200 pl-3">
          {insight.ai_why_it_matters}
        </p>
      )}

      {/* Actions */}
      {insight.insight_actions.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Actions
          </p>
          <ul className="space-y-2">
            {insight.insight_actions.map((action) => (
              <li key={action.id} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">
                  {ACTION_STATUS_ICON[action.status] ?? ACTION_STATUS_ICON.pending}
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm text-zinc-700">{action.action_text}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {action.suggested_timeframe && (
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock size={10} />
                        {action.suggested_timeframe}
                      </span>
                    )}
                    {action.context_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-zinc-300">
        {new Date(insight.created_at).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

export default async function BookPage({
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

  const { data: bookData } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!bookData) notFound();
  const book = bookData as Book;

  const { data: insightsData } = await supabase
    .from("book_insights")
    .select("*, insight_actions(*)")
    .eq("book_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const insights = (insightsData ?? []) as InsightWithActions[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/books"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft size={14} />
          All books
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-zinc-900">{book.title}</h1>
            {book.author && (
              <p className="text-zinc-500">{book.author}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[book.status] ?? STATUS_COLOR.reading}`}
              >
                {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
              </span>
              {book.genre && (
                <span className="text-xs text-zinc-400">{book.genre}</span>
              )}
            </div>
          </div>

          <Link
            href={`/books/${id}/extract`}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Plus size={14} />
            Extract insight
          </Link>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Lightbulb size={14} />
          <span>
            {insights.length} insight{insights.length !== 1 ? "s" : ""}
          </span>
        </div>

        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 text-center">
            <Lightbulb size={28} className="mb-3 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500">No insights yet</p>
            <p className="mt-1 text-sm text-zinc-400">
              Paste a passage and Claude will extract the insight.
            </p>
            <Link
              href={`/books/${id}/extract`}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              <Plus size={14} />
              Extract first insight
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
