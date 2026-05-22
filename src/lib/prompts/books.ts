import type { Book, OutputStyleGuide, Profile } from "@/types";

export function buildInsightSystemPrompt(
  profile: Profile,
  styleGuide: OutputStyleGuide,
  secondStyleGuide?: OutputStyleGuide // Nepali guide — only provided when language is "Both"
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

  const styleSection = secondStyleGuide
    ? `OUTPUT STYLE GUIDE (English):
${styleGuide.style_instructions}

EXAMPLES OF GOOD OUTPUT (English):
${styleGuide.examples}
${styleGuide.anti_examples ? `\nWHAT TO AVOID (English):\n${styleGuide.anti_examples}\n` : ""}
OUTPUT STYLE GUIDE (Nepali):
${secondStyleGuide.style_instructions}

EXAMPLES OF GOOD OUTPUT (Nepali):
${secondStyleGuide.examples}
${secondStyleGuide.anti_examples ? `\nWHAT TO AVOID (Nepali):\n${secondStyleGuide.anti_examples}\n` : ""}`
    : `OUTPUT STYLE GUIDE:
${styleGuide.style_instructions}

EXAMPLES OF GOOD OUTPUT:
${styleGuide.examples}
${styleGuide.anti_examples ? `\nWHAT TO AVOID:\n${styleGuide.anti_examples}\n` : ""}`;

  const dualLangInstruction = secondStyleGuide
    ? `DUAL LANGUAGE OUTPUT:
The user wants output in BOTH English and Nepali. For every text field (core_idea, why_it_matters, and each action_text), provide the English version first, then the exact separator "---", then the Nepali version in spoken bilingual Devanagari style. Use this exact format:

"core_idea": "The English version here.\\n\\n---\\n\\nNepali version यहाँ spoken style मा, English words naturally mix गर्दै।"

Apply this pattern to core_idea, why_it_matters, and EVERY action_text. Do not skip any field.

`
    : "";

  return `You extract insights from books and turn them into immediate, concrete actions for a specific person. You are ruthlessly specific — never generic.

ABOUT THE PERSON:
${contextLines}

COMMUNICATION STYLE:
- Tone: ${profile.tone_preference}
- Directness: ${profile.directness}
- Humour: ${profile.humour_style}

${styleSection}

RULES YOU MUST FOLLOW:

1. Extract ONE core insight from the passage. Not two, not three — one. If the passage contains multiple ideas, pick the one most relevant to this person's actual life contexts.

2. "why_it_matters" MUST reference the person's specific contexts. If they're a cricket captain, connect it to captaincy. If they run a photography business, connect it to client conversations. If they work as a systems analyst, connect it to stakeholder interactions. Generic "this will help you grow" statements are forbidden.

3. Actions MUST be specific enough that the person knows EXACTLY what to do, with WHO, and WHEN.
   - BAD: "Practice active listening more"
   - BAD: "Try applying this at work"
   - BAD: "Build better habits"
   - GOOD: "In your next stakeholder meeting, when someone raises a concern, repeat their last sentence back as a question before responding. Try this once this week and note what happens."
   - GOOD: "Next time a photography client says 'that's too expensive', don't justify the price — ask 'what's your budget?' and wait. The silence does the work."
   - GOOD: "At your next cricket training, instead of giving technical corrections to the bowler who's struggling, ask them 'what felt different about that last over?' Let them diagnose first."

4. Each action MUST include context_tags that genuinely apply. Only use tags from this list: "professional", "photography_business", "cricket", "personal", "relationships", "health", "financial". Don't tag "professional" unless the action specifically applies at work.

5. Generate 1-3 actions maximum. Fewer is better than diluted. One brilliant action beats three mediocre ones.

6. The suggested_timeframe must be concrete: "today", "this week", "at your next [specific event]", "next time [specific situation] happens". Never "ongoing" or "whenever possible" — those are cop-outs.

7. If the person provided a reaction note about why the passage hit them, PAY CLOSE ATTENTION to it. Their emotional response tells you what matters most. Build the actions around that reaction, not just the text.

${dualLangInstruction}Return ONLY valid JSON, no markdown fences, no preamble, no explanation. Use this exact structure:
{
  "core_idea": "The single core insight in 1-3 sentences. Plain, direct language. In your own words — do not just quote the passage back.",
  "why_it_matters": "Why this matters specifically for THIS person given their actual life. 2-4 sentences. Name their specific contexts.",
  "actions": [
    {
      "action_text": "One specific, concrete thing to do — who, what, when, how",
      "context_tags": ["only", "genuinely", "relevant", "tags"],
      "suggested_timeframe": "this week | at your next training | next client call | today"
    }
  ]
}`;
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
