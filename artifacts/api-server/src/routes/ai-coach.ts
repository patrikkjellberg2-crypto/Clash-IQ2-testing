import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const DEFAULT_CLAN_TAG = "#2Q0Q82C9R";
const CLASH_API_BASE_URL = process.env.CLASH_API_BASE_URL || "https://cocproxy.royaleapi.dev/v1";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const MAX_PROMPT_CHARS = 24000;
const MAX_OUTPUT_TOKENS = 5000;

type Dict = Record<string, any>;

async function callGroqModel(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured. Add GROQ_API_KEY to the Render test service and redeploy.",
    );
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are CLASHIQ AI Coach. Always answer in English, even if the question is written in another language. Accuracy comes first. Use only verified supplied Clash API facts. Be specific, tactical and complete. Never invent missing facts. Follow the requested plain-text section structure exactly. You must finish every requested section before stopping.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.15,
      reasoning_effort: "medium",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const err: any = new Error(
      `Groq ${GROQ_MODEL} HTTP ${response.status}: ${String(data?.error?.message || data?.error?.type || "Groq API error")}`,
    );
    err.httpStatus = response.status;
    throw err;
  }

  const answer = data?.choices?.[0]?.message?.content?.trim() || "";
  if (!answer) throw new Error(`Groq ${GROQ_MODEL} returned an empty response`);
  return answer;
}

function isBusyError(error: any) {
  const status = Number(error?.httpStatus || 0);
  const message = String(error?.message || error).toLowerCase();
  return (
    [429, 500, 502, 503, 504].includes(status) ||
    message.includes("overload") ||
    message.includes("unavailable") ||
    message.includes("rate limit") ||
    message.includes("fetch failed") ||
    message.includes("empty response")
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGroq(prompt: string) {
  try {
    return await callGroqModel(prompt);
  } catch (error: any) {
    console.warn("Groq attempt 1/2 failed:", String(error?.message || error));
    if (!isBusyError(error)) throw error;
    await sleep(1200);
    return await callGroqModel(prompt);
  }
}

async function handleCoach(req: Request, res: Response, requireAuth = false) {
  try {
    if (requireAuth) {
      const apiKey = process.env.MECKA_API_KEY;
      const providedKey = req.header("X-Mecka-API-Key");
      if (!apiKey) return res.status(500).json({ error: "ClashIQ API authentication is not configured" });
      if (!providedKey || providedKey !== apiKey) return res.status(401).json({ error: "Unauthorized" });
    }

    const requestedTag = typeof req.body?.clanTag === "string" && req.body.clanTag.trim()
      ? req.body.clanTag
      : DEFAULT_CLAN_TAG;
    const tag = normalizeTag(requestedTag);
    if (!/^#[0-9A-Z]{3,15}$/.test(tag)) {
      return res.status(400).json({ error: "Enter a valid Clash clan tag." });
    }
    const mode = req.body?.mode === "opponent" ? "opponent" : req.body?.mode === "question" ? "question" : "clan";
    const question = typeof req.body?.question === "string" ? req.body.question.slice(0, 1000) : "";

    const data = await getClanData(tag);
    const prompt = buildPrompt(data, mode, question);
    if (prompt.length > MAX_PROMPT_CHARS) throw new Error(`AI war data exceeded the safety limit (${prompt.length} characters).`);

    const answer = await callGroq(prompt);
    return res.json({ answer, mode, clanTag: tag });
  } catch (error: any) {
    console.error("AI Coach error:", error);
    const message = error?.message || "AI Coach failed";
    if (isBusyError(error)) {
      return res.status(503).json({
        error: "The AI is overloaded right now. Please wait a moment and press Analyze again.",
        detail: message,
      });
    }
    return res.status(500).json({ error: message });
  }
}

router.post("/ai/coach", (req, res) => handleCoach(req, res, false));
router.post("/ai/chatgpt/coach", (req, res) => handleCoach(req, res, true));

export default router;
