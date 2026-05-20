"use server";

import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/anthropic";
import {
  buildInsightSystemPrompt,
  buildInsightUserPrompt,
} from "@/lib/prompts/books";
import { redirect } from "next/navigation";
import type { Book, InsightAIResponse, OutputStyleGuide, Profile } from "@/types";

export async function extractInsight(bookId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const passage = (formData.get("passage") as string)?.trim();
  const reactionNote = (formData.get("reaction_note") as string)?.trim() || undefined;

  if (!passage) throw new Error("Passage is required");

  // Fetch profile (required for personalisation)
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profileData) redirect("/onboarding");
  const profile = profileData as Profile;

  // Fetch book
  const { data: bookData } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .eq("user_id", user.id)
    .single();
  if (!bookData) throw new Error("Book not found");
  const book = bookData as Book;

  // Fetch style guide for user's preferred language
  const { data: styleGuideData } = await supabase
    .from("output_style_guides")
    .select("*")
    .eq("language", profile.default_output_language)
    .single();
  if (!styleGuideData) throw new Error("Style guide not found — check DB seed");
  const styleGuide = styleGuideData as OutputStyleGuide;

  // Build prompts
  const systemPrompt = buildInsightSystemPrompt(profile, styleGuide);
  const userMessage = buildInsightUserPrompt({ book, passage, reactionNote });

  // Call Claude
  const startTime = Date.now();
  const { text: rawResponse, inputTokens, outputTokens } = await callClaude({
    systemPrompt,
    userMessage,
  });
  const latencyMs = Date.now() - startTime;

  // Parse JSON response
  let parsed: InsightAIResponse;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error(`Claude returned non-JSON. Raw: ${rawResponse.slice(0, 200)}`);
  }

  // Save insight
  const { data: insight, error: insightError } = await supabase
    .from("book_insights")
    .insert({
      user_id: user.id,
      book_id: bookId,
      source_type: "text",
      source_text: passage,
      user_reaction_note: reactionNote ?? null,
      ai_core_idea: parsed.core_idea,
      ai_why_it_matters: parsed.why_it_matters,
      ai_raw_response: parsed,
      output_language: profile.default_output_language,
    })
    .select("id")
    .single();

  if (insightError || !insight) throw new Error("Failed to save insight");

  // Save actions
  if (parsed.actions?.length) {
    await supabase.from("insight_actions").insert(
      parsed.actions.map((action) => ({
        insight_id: insight.id,
        user_id: user.id,
        action_text: action.action_text,
        context_tags: action.context_tags ?? [],
        suggested_timeframe: action.suggested_timeframe ?? null,
      }))
    );
  }

  // Log AI call
  await supabase.from("ai_outputs").insert({
    user_id: user.id,
    module: "books",
    action: "extract_insight",
    input_payload: { book_id: bookId, passage, reaction_note: reactionNote ?? null },
    output_payload: parsed,
    model_used: "claude-sonnet-4-20250514",
    tokens_input: inputTokens,
    tokens_output: outputTokens,
    latency_ms: latencyMs,
  });

  // Schedule resurfacing check-ins
  const now = new Date();
  const resurfaceDays = [7, 14, 30];
  await supabase.from("resurfacing_queue").insert(
    resurfaceDays.map((days) => ({
      user_id: user.id,
      insight_id: insight.id,
      scheduled_for: new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
      resurface_type: `${days}d`,
    }))
  );

  // Increment book insight count
  await supabase
    .from("books")
    .update({ total_insights: book.total_insights + 1 })
    .eq("id", bookId);

  redirect(`/books/${bookId}`);
}
