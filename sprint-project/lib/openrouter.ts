import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildRewritePrompt, type BuildPromptInput } from "@/lib/prompt";

if (
  process.env.NODE_ENV === "production" &&
  process.env.E2E_TEST_MODE === "true"
) {
  throw new Error("E2E_TEST_MODE must not be enabled in production.");
}

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), "prompts", "system-prompt.md"),
  "utf-8"
);

const MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5";

export type RewriteResult = {
  text: string;
  model: string;
  usage?: { totalTokens: number; cost: number | null };
};

export async function rewriteSection(
  input: BuildPromptInput
): Promise<RewriteResult> {
  if (process.env.E2E_TEST_MODE === "true") {
    return {
      text: `[E2E_TEST_MODE mock rewrite]\n\n${input.sourceText.slice(0, 200)}`,
      model: MODEL,
      usage: { totalTokens: 42, cost: 0.0007 },
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const userPrompt = buildRewritePrompt(input);

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        usage: { include: true },
      }),
      signal: AbortSignal.timeout(60_000),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenRouter request failed (${response.status}): ${body.slice(0, 500)}`
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number; cost?: number };
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenRouter returned an empty response.");
  }

  const usage =
    typeof data.usage?.total_tokens === "number"
      ? {
          totalTokens: data.usage.total_tokens,
          cost: typeof data.usage.cost === "number" ? data.usage.cost : null,
        }
      : undefined;

  return { text, model: MODEL, usage };
}
