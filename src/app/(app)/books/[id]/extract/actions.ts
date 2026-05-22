"use server";

import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/ai/anthropic";
import {
  buildInsightSystemPrompt,
  buildInsightUserPrompt,
} from "@/lib/prompts/books";
import { redirect } from "next/navigation";
import type { Book, InsightAIResponse, OutputStyleGuide, Profile } from "@/types";

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type ImageMediaType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export async function extractInsight(bookId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const sourceType = (formData.get("source_type") as string) || "text";
  const passage = (formData.get("passage") as string)?.trim() || undefined;
  const reactionNote =
    (formData.get("reaction_note") as string)?.trim() || undefined;

  // Validate inputs
  if (sourceType === "text" && !passage) throw new Error("Passage is required");

  // Handle image
  let imageData: string | undefined;
  let imageMediaType: ImageMediaType | undefined;

  if (sourceType === "image") {
    const imageFile = formData.get("image") as File | null;
    if (!imageFile || imageFile.size === 0) throw new Error("Image is required");
    if (!(SUPPORTED_IMAGE_TYPES as readonly string[]).includes(imageFile.type)) {
      throw new Error(`Unsupported image type: ${imageFile.type}. Use JPG, PNG, or WEBP.`);
    }
    const buffer = await imageFile.arrayBuffer();
    imageData = Buffer.from(buffer).toString("base64");
    imageMediaType = imageFile.type as ImageMediaType;
  }

  // Fetch profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profileData) redirect("/onboarding");
  const profile = profileData as Profile;

  // Determine effective output language (per-extract override takes priority)
  const effectiveLanguage =
    (formData.get("output_language") as string) ||
    profile.default_output_language;

  // Fetch style guide(s)
  let styleGuide: OutputStyleGuide;
  let secondStyleGuide: OutputStyleGuide | undefined;

  if (effectiveLanguage === "Both") {
    const [{ data: enData }, { data: neData }] = await Promise.all([
      supabase
        .from("output_style_guides")
        .select("*")
        .eq("language", "English")
        .single(),
      supabase
        .from("output_style_guides")
        .select("*")
        .eq("language", "Nepali")
        .single(),
    ]);
    if (!enData || !neData)
      throw new Error("Style guides not found — check DB seed");
    styleGuide = enData as OutputStyleGuide;
    secondStyleGuide = neData as OutputStyleGuide;
  } else {
    const { data: guideData } = await supabase
      .from("output_style_guides")
      .select("*")
      .eq("language", effectiveLanguage)
      .single();
    if (!guideData)
      throw new Error("Style guide not found — check DB seed");
    styleGuide = guideData as OutputStyleGuide;
  }

  // Fetch book
  const { data: bookData } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .eq("user_id", user.id)
    .single();
  if (!bookData) throw new Error("Book not found");
  const book = bookData as Book;

  // Build prompts
  const systemPrompt = buildInsightSystemPrompt(
    profile,
    styleGuide,
    secondStyleGuide
  );

  let userMessage: string;
  if (sourceType === "image") {
    const bookLine = `Book: "${book.title}"${book.author ? ` by ${book.author}` : ""}${book.genre ? ` (${book.genre})` : ""}`;
    const reactionLine = reactionNote
      ? `\nMy reaction / why this hit me: ${reactionNote}\n`
      : "";
    const contextLine = passage ? `\nAdditional context: ${passage}\n` : "";
    userMessage = `First, extract all readable text from this book page image. Then analyse the extracted text and provide the insight.\n\n${bookLine}${reactionLine}${contextLine}`;
  } else {
    userMessage = buildInsightUserPrompt({
      book,
      passage: passage!,
      reactionNote,
    });
  }

  // Call Claude
  const startTime = Date.now();
  const {
    text: rawResponse,
    inputTokens,
    outputTokens,
  } = await callClaude({
    systemPrompt,
    userMessage,
    imageData,
    imageMediaType,
  });
  const latencyMs = Date.now() - startTime;

  // Parse JSON response
  let parsed: InsightAIResponse;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error(
      `Claude returned non-JSON. Raw: ${rawResponse.slice(0, 200)}`
    );
  }

  // Save insight
  const { data: insight, error: insightError } = await supabase
    .from("book_insights")
    .insert({
      user_id: user.id,
      book_id: bookId,
      source_type: sourceType === "image" ? "image" : "text",
      source_text: sourceType === "text" ? (passage ?? null) : null,
      // TODO: Upload image to Supabase Storage and save URL in source_image_url
      source_image_url: null,
      user_reaction_note: reactionNote ?? null,
      ai_core_idea: parsed.core_idea,
      ai_why_it_matters: parsed.why_it_matters,
      ai_raw_response: parsed,
      output_language: effectiveLanguage,
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
    input_payload: {
      book_id: bookId,
      source_type: sourceType,
      passage: sourceType === "text" ? passage : null,
      reaction_note: reactionNote ?? null,
      output_language: effectiveLanguage,
    },
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
      scheduled_for: new Date(
        now.getTime() + days * 24 * 60 * 60 * 1000
      ).toISOString(),
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
