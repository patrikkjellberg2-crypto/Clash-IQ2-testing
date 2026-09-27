import express, { Request, Response } from "express";
import { listPlayerPerformance } from "../lib/war-archive";

const router = express.Router();

const CLASH_API_BASE =
  process.env.CLASH_API_BASE_URL ||
  "https://cocproxy.royaleapi.dev/v1";

const CLASHKING_API_BASE =
  process.env.CLASHKING_API_BASE_URL ||
  "https://api.clashk.ing";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";

const MAX_INPUT_CHARS = 14000;
const MAX_OUTPUT_TOKENS = 1800;

type AnyObject = Record<string, any>;

function cleanTag(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function fetchJson<T>(
  base: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();
  let data: any = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error?.message ||
        data?.reason ||
        `API error ${response.status}`,
    );
  }

  return data as T;
}

async function supercellGet<T>(path: string): Promise<T> {
  const token = process.env.CLASH_API_TOKEN;

  if (!token) {
    throw new Error("CLASH_API_TOKEN saknas i Render.");
  }

  return fetchJson<T>(CLASH_API_BASE, path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function clashKingGet<T>(path: string): Promise<T> {
  return fetchJson<T>(CLASHKING_API_BASE, path);
}

function compactAttack(attack: AnyObject) {
  return {
    attackerTag: str(attack?.attackerTag),
    defenderTag: str(attack?.defenderTag),
    stars: num(attack?.stars),
    destruction: num(attack?.destructionPercentage),
    order: num(attack?.order),
  };
}

function compactMember(member: AnyObject) {
  const attacks = Array.isArray(member?.attacks)
    ? member.attacks.slice(0, 2).map(compactAttack)
    : [];

  return {
    tag: str(member?.tag),
    name: str(member?.name, "Unknown"),
    position: num(member?.mapPosition ?? member?.clanRank),
    townHall: num(member?.townhallLevel ?? member?.townHallLevel),
    attacksUsed: attacks.length,
    attacks,
    bestOpponentAttack: member?.bestOpponentAttack
      ? {
          stars: num(member.bestOpponentAttack.stars),
          destruction: num(
            member.bestOpponentAttack.destructionPercentage,
          ),
        }
      : null,
  };
}

function compactSide(side: AnyObject | null) {
  const clan = side?.clan ?? side ?? {};

  const members = Array.isArray(clan?.members)
    ? clan.members
        .map(compactMember)
        .sort(
          (a: AnyObject, b: AnyObject) => a.position - b.position,
        )
        .slice(0, 30)
    : [];

  return {
    tag: str(clan?.tag),
    name: str(clan?.name),
    stars: num(clan?.stars),
    destruction: num(clan?.destructionPercentage),
    attacks: num(clan?.attacks),
    members,
  };
}

function compactWar(war: AnyObject) {
  return {
    state: str(war?.state, "unknown"),
    teamSize: num(war?.teamSize),
    attacksPerMember: num(war?.attacksPerMember, 2),
    clan: compactSide(war?.clan),
    opponent: compactSide(war?.opponent),
    startTime: str(war?.startTime),
    endTime: str(war?.endTime),
  };
}

async function getWarForPlanner(clanTag: string): Promise<AnyObject> {
  /*
   * ClashKing is the primary source for war metadata.
   * Its current public endpoint exposes the stored war pointer,
   * while the full live war board is still obtained from the
   * official Clash API when a token is configured.
   */
  const basic = await clashKingGet<AnyObject | null>(
    `/v2/war/${encodeURIComponent(clanTag)}/basic`,
  );

  if (!basic) {
    throw new Error("ClashKing har ingen registrerad aktuell war för klanen.");
  }

  if (process.env.CLASH_API_TOKEN) {
    try {
      return await supercellGet<AnyObject>(
        `/clans/${encodeURIComponent(clanTag)}/currentwar`,
      );
    } catch {
      // Fall through to stored ClashKing data when possible.
    }
  }

  const endTime = str(basic?.endTime);
  if (endTime) {
    try {
      const stored = await clashKingGet<AnyObject | null>(
        `/v2/war/${encodeURIComponent(clanTag)}/previous/${encodeURIComponent(endTime)}`,
      );

      if (stored && typeof stored === "object") {
        return stored;
      }
    } catch {
      // No stored completed war available.
    }
  }

  throw new Error(
    "ClashKing hittade kriget, men full live-war-data kunde inte hämtas. Lägg till CLASH_API_TOKEN för live War Planner.",
  );
}

async function callGeminiModel(model: string, prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  const response = await fetch(`${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      systemInstruction: { parts: [{ text: "You are CLASHIQ AI War Coach. Use only supplied verified Clash data. Always finish the requested JSON. Never invent missing facts." }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 3000,
        temperature: 0.1,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: "low" },
      },
    })
  });
  const data = await response.json();
  if (!response.ok) { const error: any = new Error(`Gemini ${model} HTTP ${response.status}: ${String(data?.error?.message || data?.error?.status || "Gemini API error")}`); error.httpStatus = response.status; throw error; }
  const answer = data?.candidates?.[0]?.content?.parts?.map((part: any) => typeof part?.text === "string" && !part?.thought ? part.text : "").join("").trim() || "";
  if (!answer) throw new Error(`Gemini ${model} returned an empty response`);
  return answer;
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function isBusyError(error: any) {
  const status = Number(error?.httpStatus || 0); const message = String(error?.message || error).toLowerCase();
  return [429, 500, 502, 503, 504].includes(status) || message.includes("overload") || message.includes("unavailable") || message.includes("high demand") || message.includes("quota") || message.includes("rate limit") || message.includes("fetch failed") || message.includes("empty response");
}
async function callGemini(prompt: string): Promise<string> {
  const models = Array.from(new Set([GEMINI_MODEL, "gemini-3.7-flash", "gemini-3.6-flash", GEMINI_FALLBACK_MODEL]));
  let lastError: any = null;
  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { return await callGeminiModel(model, prompt); }
      catch (error: any) { lastError = error; const status = Number(error?.httpStatus || 0); if (status === 404) break; if (!isBusyError(error)) throw error; if (attempt < 3) await sleep(1000 * attempt); }
    }
  }
  throw lastError || new Error("Gemini is unavailable");
}
const SYSTEM_PROMPT = `
You are CLASHIQ AI WAR COACH for Clash of Clans.

Create a practical attack plan from the supplied war data.

Rules:
- Only use players and enemy bases present in the data.
- Never invent tags, names, Town Hall levels or attacks.
- Respect attacks already used.
- Never assign the same target twice.
- Never recommend the same attacker twice in one generated plan.
- Do not recommend a player who has already used all attacks.
- Existing planner assignments are authoritative: never overwrite or contradict a LOCKED or COMPLETED assignment.
- Do not assign an attacker who already has an existing target in the planner unless the supplied planner state explicitly says that assignment is unlocked and still needs a better target.
- Prefer leaving an attacker unassigned rather than inventing a weak matchup.
- Prefer realistic Town Hall matchups.
- Use PLAYER FORM INTELLIGENCE when selecting attackers. Favor improving form for difficult 3-star attempts when the matchup supports it.
- Treat declining form as a planning risk, not proof of poor skill. Use stable/improving players for higher-confidence assignments when the matchup is otherwise similar.
- Include recent average stars, destruction or 3-star rate in the reason when those metrics materially affect the recommendation.
- Prioritize strong 3-star opportunities.
- Use safe 2-star attacks when appropriate.
- Use cleanup when an enemy base has already been attacked but not cleared.
- Consider score and destruction.
- Keep reasons short.
- Respond in Swedish.

Return ONLY valid JSON.

JSON:
{
  "warStatus": "WINNING",
  "summary": "kort svensk sammanfattning",
  "recommendations": [
    {
      "attackerTag": "#PLAYER",
      "attackerName": "Player",
      "attackerTownhall": 17,
      "attackerPosition": 1,
      "targetPosition": 1,
      "targetName": "Enemy",
      "targetTownhall": 17,
      "score": 95,
      "confidence": "HIGH",
      "purpose": "3-star attempt",
      "reason": "Kort praktisk anledning."
    }
  ],
  "notes": ["kort svensk kommentar"]
}

warStatus: WINNING | LOSING | CLOSE
confidence: HIGH | MEDIUM | LOW
purpose: 3-star attempt | safe 2-star | cleanup
Maximum 15 recommendations.
Maximum 5 notes.
`;

router.post("/ai/war-planner", async (req: Request, res: Response) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY saknas i Render.",
      });
    }

    const clanTag = cleanTag(req.body?.clanTag);

    if (!clanTag) {
      return res.status(400).json({ error: "clanTag krävs." });
    }

    const plannerAssignments = Array.isArray(req.body?.assignments)
      ? req.body.assignments
          .map((item: any) => ({
            attackerTag: cleanTag(item?.attackerTag),
            targetPosition: num(item?.targetPosition, 0),
            locked: Boolean(item?.locked),
            completed: Boolean(item?.completed),
          }))
          .filter((item: any) => item.attackerTag)
          .slice(0, 60)
      : [];

    const plannerData = JSON.stringify(plannerAssignments);

    const war = await getWarForPlanner(clanTag);

    if (!war || typeof war !== "object") {
      return res.status(404).json({
        error: "ClashKing returnerade ingen war-data.",
      });
    }

    const state = str(war?.state, "unknown").toLowerCase();

    if (state === "notinwar") {
      return res.status(400).json({
        error: "Det finns inget aktivt krig att analysera.",
      });
    }

    const compact = compactWar(war);
    const performance = await listPlayerPerformance(clanTag).catch(() => []);
    const performanceByTag = new Map(performance.map((row: any) => [String(row.playerTag || "").toUpperCase(), row]));
    const performanceData = compact.clan.members.map((member: AnyObject) => {
      const row = performanceByTag.get(String(member.tag || "").toUpperCase());
      if (!row) return null;
      return { tag: row.playerTag, name: row.playerName, form: row.trend, recentWars: num(row.recentWars), recentAvgStars: num(row.recentAvgStars), recentAvgDestruction: num(row.recentAvgDestruction), threeStarRate: num(row.threeStarRate), attacksUsed: num(row.attacksUsed), missedAttacks: num(row.missedAttacks) };
    }).filter(Boolean);
    const warData = JSON.stringify(compact);
    const intelligenceData = JSON.stringify(performanceData);

    if ((warData.length + intelligenceData.length + plannerData.length) > MAX_INPUT_CHARS) {
      return res.status(413).json({
        error: `War-data är fortfarande för stor efter komprimering (${warData.length} tecken).`,
      });
    }

    const output = await callGemini(
      `${SYSTEM_PROMPT}\n\nCURRENT WAR DATA:\n${warData}\n\nPLAYER FORM INTELLIGENCE (use this when choosing attackers):\n${intelligenceData}\n\nCURRENT WAR PLANNER ASSIGNMENTS (locked/completed entries are authoritative; do not replace them):\n${plannerData}`,
    );

    let plan: AnyObject;

    try {
      const cleaned = output
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();

      try {
        plan = JSON.parse(cleaned);
      } catch {
        const first = cleaned.indexOf("{");
        const last = cleaned.lastIndexOf("}");
        if (first === -1 || last === -1 || last <= first) {
          throw new Error("AI returnerade ogiltig JSON.");
        }
        plan = JSON.parse(cleaned.slice(first, last + 1));
      }
    } catch (error) {
      console.error("AI WAR PLANNER JSON PARSE ERROR:", error);
      throw new Error("AI:n returnerade en ogiltig attackplan. Försök igen.");
    }

    const rawRecommendations = Array.isArray(plan?.recommendations)
      ? plan.recommendations
      : [];

    const ourMembers = Array.isArray(compact?.clan?.members)
      ? compact.clan.members
      : [];

    const enemyMembers = Array.isArray(compact?.opponent?.members)
      ? compact.opponent.members
      : [];

    const attackersByTag = new Map(
      ourMembers.map((member: AnyObject) => [
        member.tag.toUpperCase(),
        member,
      ]),
    );

    const attackersByPosition = new Map(
      ourMembers.map((member: AnyObject) => [member.position, member]),
    );

    const targetsByPosition = new Map(
      enemyMembers.map((member: AnyObject) => [member.position, member]),
    );

    const usedTargets = new Set<number>();
    const usedAttackers = new Set<string>();
    const maxAttacks = num(war?.attacksPerMember, 2);

    for (const assignment of plannerAssignments) {
      if (assignment.targetPosition > 0) {
        usedTargets.add(assignment.targetPosition);
      }
      if (assignment.attackerTag && (assignment.locked || assignment.completed)) {
        usedAttackers.add(assignment.attackerTag);
      }
    }

    const recommendations = rawRecommendations
      .slice(0, 15)
      .map((item: AnyObject) => {
        const attackerTag = str(item?.attackerTag).toUpperCase();
        const attacker =
          attackersByTag.get(attackerTag) ||
          attackersByPosition.get(num(item?.attackerPosition));
        const target = targetsByPosition.get(
          num(item?.targetPosition),
        );

        if (!attacker || !target) return null;
        if (usedTargets.has(target.position)) return null;
        if (usedAttackers.has(attacker.tag.toUpperCase())) return null;
        if (attacker.attacksUsed >= maxAttacks) return null;

        usedTargets.add(target.position);
        usedAttackers.add(attacker.tag.toUpperCase());

        return {
          attackerTag: attacker.tag,
          attackerName: attacker.name,
          attackerTownhall: attacker.townHall,
          attackerPosition: attacker.position,
          targetPosition: target.position,
          targetName: target.name,
          targetTownhall: target.townHall,
          score: Math.max(0, Math.min(100, num(item?.score))),
          confidence:
            item?.confidence === "HIGH" || item?.confidence === "LOW"
              ? item.confidence
              : "MEDIUM",
          purpose:
            item?.purpose === "3-star attempt" ||
            item?.purpose === "safe 2-star" ||
            item?.purpose === "cleanup"
              ? item.purpose
              : "3-star attempt",
          reason: str(item?.reason, "Praktisk matchning.").slice(0, 220),
        };
      })
      .filter(Boolean);

    const warStatus =
      plan?.warStatus === "WINNING" || plan?.warStatus === "LOSING"
        ? plan.warStatus
        : "CLOSE";

    const notes = Array.isArray(plan?.notes)
      ? plan.notes
          .filter((note: unknown) => typeof note === "string")
          .map((note: string) => note.trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    return res.json({
      plan: {
        warStatus,
        summary: str(plan?.summary, "AI-plan skapad."),
        recommendations,
        notes,
      },
    });
  } catch (error: any) {
    console.error("AI WAR PLANNER ERROR:", error);

    const message =
      str(error?.message) || "Kunde inte skapa AI-planen.";

    if (
      message.includes("429") ||
      message.toLowerCase().includes("rate limit") ||
      message.includes("tokens per min")
    ) {
      return res.status(429).json({
        error: "AI rate limit nådd. Försök igen om en kort stund.",
      });
    }

    return res.status(500).json({ error: message });
  }
});

export default router;
