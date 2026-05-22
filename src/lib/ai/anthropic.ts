import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function callClaude({
  systemPrompt,
  userMessage,
  model = "claude-sonnet-4-20250514",
  maxTokens = 2000,
  imageData,
  imageMediaType,
}: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  imageData?: string;
  imageMediaType?: ImageMediaType;
}): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const userContent =
    imageData && imageMediaType
      ? [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: imageMediaType,
              data: imageData,
            },
          },
          {
            type: "text" as const,
            text: userMessage,
          },
        ]
      : userMessage;

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const content = response.content[0];
  if (content.type !== "text")
    throw new Error("Unexpected response type from Claude");

  return {
    text: content.text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
