import type { Book, OutputStyleGuide, Profile } from "@/types";

export function buildInsightSystemPrompt(
  profile: Profile,
  styleGuide: OutputStyleGuide
): string {
  const contextLines = [
    `Name: ${profile.display_name}`,
    profile.job_title &&
      `Job: ${profile.job_title}${profile.industry ? ` in ${profile.industry}` : ""}`,
    profile.business_type &&
      `Business: ${profile.business_type}${profile.target_clients ? ` — clients: ${profile.target_clients}` : ""}`,
    profile.sport &&
      profile.team_role &&
      `Sport/Leadership: ${profile.team_role} of ${profile.team_name || "their team"} (${profile.team_level || "community"} level)`,
    profile.reading_genres?.length &&
      `Reads: ${profile.reading_genres.join(", ")}`,
    profile.why_i_read && `Why they read: ${profile.why_i_read}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You extract insights from books and make them immediately actionable for a specific person.

PERSON'S CONTEXT:
${contextLines}

COMMUNICATION STYLE:
- Tone: ${profile.tone_preference}
- Directness: ${profile.directness}
- Humour: ${profile.humour_style}

OUTPUT STYLE GUIDE:
${styleGuide.style_instructions}

EXAMPLES OF GOOD OUTPUT:
${styleGuide.examples}

${styleGuide.anti_examples ? `WHAT TO AVOID:\n${styleGuide.anti_examples}\n\n` : ""}Return ONLY valid JSON, no markdown, no preamble. Use this exact structure:
{
  "core_idea": "The insight in 1-3 sentences. Plain, direct language.",
  "why_it_matters": "Why this matters specifically for this person. 2-4 sentences. Reference their actual contexts where relevant.",
  "actions": [
    {
      "action_text": "One specific, concrete thing to do",
      "context_tags": ["professional", "photography_business", "cricket", "personal"],
      "suggested_timeframe": "today | this week | next meeting | ongoing"
    }
  ]
}

Generate 1-3 actions. Be specific. Only include context_tags that genuinely apply.`;
}

export function buildInsightUserPrompt({
  book,
  passage,
  reactionNote,
}: {
  book: Book;
  passage: string;
  reactionNote?: string;
}): string {
  const bookLine = `Book: "${book.title}"${book.author ? ` by ${book.author}` : ""}${book.genre ? ` (${book.genre})` : ""}`;
  const reactionLine = reactionNote
    ? `\nMy reaction / why this hit me: ${reactionNote}\n`
    : "";
  return `${bookLine}${reactionLine}\nPassage:\n${passage}`;
}
