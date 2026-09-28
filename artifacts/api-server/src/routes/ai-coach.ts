import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const DEFAULT_CLAN_TAG = "#2Q0Q82C9R";
const CLASH_API_BASE_URL = process.env.CLASH_API_BASE_URL || "https://cocproxy.royaleapi.dev/v1";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const MAX_PROMPT_CHARS = 24000;
const MAX_OUTPUT_TOKENS = 5000;

type Dict = Record<string, any>;

function normalizeTag(tag: string) {
  const value = String(tag || "").trim().toUpperCase().replace(/\s+/g, "");
  return value.startsWith("#") ? value : `#${value}`;
}

async function parseJsonResponse(response: Response, source: string) {
  const raw = await response.text();

  try {
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid JSON";
    throw new Error(`${source} returned invalid JSON: ${detail}`);
  }
}

async function fetchClashKingFallback(path: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`https://api.clashk.ing${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ClashKing HTTP ${response.status}`);
    }

    return await parseJsonResponse(response, "ClashKing");
  } finally {
    clearTimeout(timeout);
  }
}

async function clashFetch(path: string, fallback: any = null) {
  const token = process.env.CLASH_API_TOKEN?.trim();

  // Clash IQ already uses ClashKing elsewhere as a resilient public fallback.
  // Keep AI Coach from failing when the official proxy returns a truncated or
  // malformed JSON payload (which otherwise surfaces as a raw JSON.parse error).
  if (token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(`${CLASH_API_BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (fallback !== null) return fallback;
        return await fetchClashKingFallback(path);
      }

      try {
        return await parseJsonResponse(response, "Clash API");
      } catch (error) {
        if (fallback !== null) {
          try {
            return await fetchClashKingFallback(path);
          } catch {
            return fallback;
          }
        }
        return await fetchClashKingFallback(path);
      }
    } catch (error) {
      if (fallback !== null) {
        try {
          return await fetchClashKingFallback(path);
        } catch {
          return fallback;
        }
      }
      return await fetchClashKingFallback(path);
    } finally {
      clearTimeout(timeout);
    }
  }

  return await fetchClashKingFallback(path);
}


type WarTestScenario = {
  id: string;
  label: string;
  expected: string;
  currentWar: Dict;
};

const WAR_TEST_SCENARIOS: WarTestScenario[] = [
  {
    id: "no-attacks",
    label: "01 · No attacks",
    expected: "No individual enemy should be called an active threat.",
    currentWar: {
      state: "inWar",
      teamSize: 5,
      attacksPerMember: 2,
      clan: {
        tag: "#2Q0Q82C9R",
        name: "BHABE DHEMONS",
        stars: 8,
        destructionPercentage: 72.4,
        attacks: 4,
        members: [
          { mapPosition: 1, name: "Alpha", townhallLevel: 18, attacks: [] },
          { mapPosition: 2, name: "Bravo", townhallLevel: 17, attacks: [] },
          { mapPosition: 3, name: "Charlie", townhallLevel: 17, attacks: [] },
          { mapPosition: 4, name: "Delta", townhallLevel: 16, attacks: [] },
          { mapPosition: 5, name: "Echo", townhallLevel: 15, attacks: [] },
        ],
      },
      opponent: {
        tag: "#TESTENEMY1",
        name: "Test Opponent",
        stars: 7,
        destructionPercentage: 69.1,
        attacks: 0,
        members: [
          { mapPosition: 1, name: "rudy", townhallLevel: 18, attacks: [] },
          { mapPosition: 2, name: "Jc Jan", townhallLevel: 18, attacks: [] },
          { mapPosition: 3, name: "Weak_new", townhallLevel: 17, attacks: [] },
          { mapPosition: 4, name: "Flamingo", townhallLevel: 15, attacks: [] },
          { mapPosition: 5, name: "nas", townhallLevel: 15, attacks: [] },
        ],
      },
    },
  },
  {
    id: "active-th18",
    label: "02 · Active TH18 threat",
    expected: "rudy should be identified from his recorded 3-star/100% attack, not merely his TH18 level.",
    currentWar: {
      state: "inWar",
      teamSize: 5,
      attacksPerMember: 2,
      clan: {
        tag: "#2Q0Q82C9R",
        name: "BHABE DHEMONS",
        stars: 7,
        destructionPercentage: 65,
        attacks: 5,
        members: [
          { mapPosition: 1, name: "Alpha", townhallLevel: 18, attacks: [] },
          { mapPosition: 2, name: "Bravo", townhallLevel: 17, attacks: [] },
          { mapPosition: 3, name: "Charlie", townhallLevel: 17, attacks: [] },
          { mapPosition: 4, name: "Delta", townhallLevel: 16, attacks: [] },
          { mapPosition: 5, name: "Echo", townhallLevel: 15, attacks: [] },
        ],
      },
      opponent: {
        tag: "#TESTENEMY1",
        name: "Test Opponent",
        stars: 9,
        destructionPercentage: 88.2,
        attacks: 5,
        members: [
          { mapPosition: 1, name: "rudy", townhallLevel: 18, attacks: [
            { defender: { mapPosition: 1 }, stars: 3, destructionPercentage: 100 },
          ] },
          { mapPosition: 2, name: "Jc Jan", townhallLevel: 18, attacks: [
            { defender: { mapPosition: 2 }, stars: 1, destructionPercentage: 63 },
          ] },
          { mapPosition: 3, name: "Weak_new", townhallLevel: 17, attacks: [
            { defender: { mapPosition: 3 }, stars: 2, destructionPercentage: 78 },
          ] },
          { mapPosition: 4, name: "Flamingo", townhallLevel: 15, attacks: [] },
          { mapPosition: 5, name: "nas", townhallLevel: 15, attacks: [] },
        ],
      },
    },
  },
  {
    id: "lower-th-outperforms",
    label: "03 · TH15 outperforms TH18",
    expected: "Flamingo should receive more threat attention than the inactive TH18 players because Flamingo has the strongest recorded attack.",
    currentWar: {
      state: "inWar",
      teamSize: 5,
      attacksPerMember: 2,
      clan: {
        tag: "#2Q0Q82C9R",
        name: "BHABE DHEMONS",
        stars: 9,
        destructionPercentage: 81,
        attacks: 6,
        members: [
          { mapPosition: 1, name: "Alpha", townhallLevel: 18, attacks: [] },
          { mapPosition: 2, name: "Bravo", townhallLevel: 17, attacks: [] },
          { mapPosition: 3, name: "Charlie", townhallLevel: 17, attacks: [] },
          { mapPosition: 4, name: "Delta", townhallLevel: 16, attacks: [] },
          { mapPosition: 5, name: "Echo", townhallLevel: 15, attacks: [] },
        ],
      },
      opponent: {
        tag: "#TESTENEMY1",
        name: "Test Opponent",
        stars: 8,
        destructionPercentage: 79.5,
        attacks: 6,
        members: [
          { mapPosition: 1, name: "rudy", townhallLevel: 18, attacks: [] },
          { mapPosition: 2, name: "Jc Jan", townhallLevel: 18, attacks: [] },
          { mapPosition: 3, name: "Weak_new", townhallLevel: 17, attacks: [
            { defender: { mapPosition: 3 }, stars: 1, destructionPercentage: 55 },
          ] },
          { mapPosition: 4, name: "Flamingo", townhallLevel: 15, attacks: [
            { defender: { mapPosition: 4 }, stars: 3, destructionPercentage: 100 },
            { defender: { mapPosition: 5 }, stars: 3, destructionPercentage: 100 },
          ] },
          { mapPosition: 5, name: "nas", townhallLevel: 15, attacks: [] },
        ],
      },
    },
  },
  {
    id: "remaining-attacks",
    label: "04 · Remaining attack risk",
    expected: "Threat assessment should mention the enemy has substantial unused attack capacity; inactive players are potential future threats, not active attackers.",
    currentWar: {
      state: "inWar",
      teamSize: 5,
      attacksPerMember: 2,
      clan: {
        tag: "#2Q0Q82C9R",
        name: "BHABE DHEMONS",
        stars: 10,
        destructionPercentage: 86,
        attacks: 8,
        members: [
          { mapPosition: 1, name: "Alpha", townhallLevel: 18, attacks: [
            { defender: { mapPosition: 1 }, stars: 3, destructionPercentage: 100 },
          ] },
          { mapPosition: 2, name: "Bravo", townhallLevel: 17, attacks: [] },
          { mapPosition: 3, name: "Charlie", townhallLevel: 17, attacks: [] },
          { mapPosition: 4, name: "Delta", townhallLevel: 16, attacks: [] },
          { mapPosition: 5, name: "Echo", townhallLevel: 15, attacks: [] },
        ],
      },
      opponent: {
        tag: "#TESTENEMY1",
        name: "Test Opponent",
        stars: 7,
        destructionPercentage: 70,
        attacks: 2,
        members: [
          { mapPosition: 1, name: "rudy", townhallLevel: 18, attacks: [] },
          { mapPosition: 2, name: "Jc Jan", townhallLevel: 18, attacks: [] },
          { mapPosition: 3, name: "Weak_new", townhallLevel: 17, attacks: [] },
          { mapPosition: 4, name: "Flamingo", townhallLevel: 15, attacks: [
            { defender: { mapPosition: 4 }, stars: 2, destructionPercentage: 74 },
          ] },
          { mapPosition: 5, name: "nas", townhallLevel: 15, attacks: [] },
        ],
      },
    },
  },
  {
    id: "near-finished",
    label: "05 · Nearly decided",
    expected: "AI should focus on the concrete board state and not invent a dramatic threat when the enemy has no attacks remaining.",
    currentWar: {
      state: "inWar",
      teamSize: 5,
      attacksPerMember: 2,
      clan: {
        tag: "#2Q0Q82C9R",
        name: "BHABE DHEMONS",
        stars: 14,
        destructionPercentage: 96.8,
        attacks: 9,
        members: [
          { mapPosition: 1, name: "Alpha", townhallLevel: 18, attacks: [] },
          { mapPosition: 2, name: "Bravo", townhallLevel: 17, attacks: [] },
          { mapPosition: 3, name: "Charlie", townhallLevel: 17, attacks: [] },
          { mapPosition: 4, name: "Delta", townhallLevel: 16, attacks: [] },
          { mapPosition: 5, name: "Echo", townhallLevel: 15, attacks: [] },
        ],
      },
      opponent: {
        tag: "#TESTENEMY1",
        name: "Test Opponent",
        stars: 9,
        destructionPercentage: 82.3,
        attacks: 10,
        members: [
          { mapPosition: 1, name: "rudy", townhallLevel: 18, attacks: [
            { defender: { mapPosition: 1 }, stars: 2, destructionPercentage: 74 },
            { defender: { mapPosition: 2 }, stars: 1, destructionPercentage: 57 },
          ] },
          { mapPosition: 2, name: "Jc Jan", townhallLevel: 18, attacks: [
            { defender: { mapPosition: 2 }, stars: 2, destructionPercentage: 82 },
            { defender: { mapPosition: 3 }, stars: 1, destructionPercentage: 48 },
          ] },
          { mapPosition: 3, name: "Weak_new", townhallLevel: 17, attacks: [
            { defender: { mapPosition: 3 }, stars: 2, destructionPercentage: 76 },
            { defender: { mapPosition: 4 }, stars: 1, destructionPercentage: 51 },
          ] },
          { mapPosition: 4, name: "Flamingo", townhallLevel: 15, attacks: [
            { defender: { mapPosition: 4 }, stars: 2, destructionPercentage: 73 },
            { defender: { mapPosition: 5 }, stars: 1, destructionPercentage: 49 },
          ] },
          { mapPosition: 5, name: "nas", townhallLevel: 15, attacks: [
            { defender: { mapPosition: 5 }, stars: 1, destructionPercentage: 61 },
            { defender: { mapPosition: 1 }, stars: 0, destructionPercentage: 32 },
          ] },
        ],
      },
    },
  },
];

function getWarTestScenario(id: string) {
  return WAR_TEST_SCENARIOS.find((scenario) => scenario.id === id) || null;
}

function number(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function memberLine(m: Dict) {
  const attacks = Array.isArray(m?.attacks) ? m.attacks : [];
  const attackText = attacks.length
    ? attacks.map((a: Dict, i: number) => {
        const target = number(a?.defender?.mapPosition ?? a?.defenderMapPosition);
        const stars = number(a?.stars);
        const destruction = number(a?.destructionPercentage);
        return `A${i + 1}->#${target || "?"} ${stars}★ ${destruction}%`;
      }).join(" | ")
    : "no attacks";

  return `#${number(m?.mapPosition)} ${String(m?.name || "Unknown").slice(0, 28)} TH${number(m?.townhallLevel ?? m?.townHallLevel)}: ${attackText}`;
}

function currentWarText(war: Dict | null, clanTag: string) {
  if (!war || !war.clan || !war.opponent) return "No active war is available right now.";

  const ourTag = normalizeTag(clanTag);
  const ourSide = normalizeTag(String(war.clan.tag || "")) === ourTag ? war.clan : war.opponent;
  const enemySide = ourSide === war.clan ? war.opponent : war.clan;
  const ourMembers = Array.isArray(ourSide.members) ? ourSide.members : [];
  const enemyMembers = Array.isArray(enemySide.members) ? enemySide.members : [];
  const attacksPerMember = number(war.attacksPerMember, 2);
  const ourUsed = number(ourSide.attacks);
  const enemyUsed = number(enemySide.attacks);
  const teamSize = number(war.teamSize, Math.max(ourMembers.length, enemyMembers.length));
  const maxAttacks = teamSize * attacksPerMember;

  return [
    `STATE=${war.state || "unknown"} TEAM_SIZE=${teamSize} ATTACKS_PER_MEMBER=${attacksPerMember}`,
    `OUR SIDE: ${ourSide.name || "Us"} | stars=${number(ourSide.stars)} | destruction=${number(ourSide.destructionPercentage)}% | attacks_used=${ourUsed} | attacks_remaining=${Math.max(0, maxAttacks - ourUsed)}`,
    `ENEMY SIDE: ${enemySide.name || "Opponent"} | stars=${number(enemySide.stars)} | destruction=${number(enemySide.destructionPercentage)}% | attacks_used=${enemyUsed} | attacks_remaining=${Math.max(0, maxAttacks - enemyUsed)}`,
    `OUR WAR ROSTER:\n${ourMembers.map(memberLine).join("\n") || "No member data."}`,
    `ENEMY WAR ROSTER:\n${enemyMembers.map(memberLine).join("\n") || "No member data."}`,
  ].join("\n");
}

function warlogText(warlog: any, clanTag: string) {
  const items = Array.isArray(warlog) ? warlog : Array.isArray(warlog?.items) ? warlog.items : [];
  const ourTag = normalizeTag(clanTag);
  if (!items.length) return "No verified war-log data available.";

  return items.slice(0, 12).map((w: Dict, i: number) => {
    const clan = w?.clan || {};
    const opponent = w?.opponent || {};
    const ours = normalizeTag(String(clan.tag || "")) === ourTag ? clan : opponent;
    const enemy = ours === clan ? opponent : clan;
    const result = String(w?.result || w?.state || "unknown");
    return `${i + 1}. ${result} | ${ours.name || "Us"} ${number(ours.stars)}★ ${number(ours.destructionPercentage)}% vs ${enemy.name || "Opponent"} ${number(enemy.stars)}★ ${number(enemy.destructionPercentage)}% | size=${number(w?.teamSize)}`;
  }).join("\n");
}

function capitalText(capital: any) {
  const items = Array.isArray(capital) ? capital : Array.isArray(capital?.items) ? capital.items : [];
  if (!items.length) return "No verified Capital Raid data available.";
  return items.slice(0, 5).map((s: Dict, i: number) =>
    `${i + 1}. state=${s?.state || "unknown"} loot=${number(s?.capitalTotalLoot)} offensiveReward=${number(s?.offensiveReward)} defensiveReward=${number(s?.defensiveReward)}`
  ).join("\n");
}

function rosterText(clan: Dict) {
  const members = Array.isArray(clan?.memberList) ? clan.memberList : [];
  if (!members.length) return "No roster data available.";

  return members.slice(0, 50).map((m: Dict) =>
    `${String(m?.name || "Unknown").slice(0, 28)} | TH${number(m?.townHallLevel ?? m?.townhallLevel)} | rank=${number(m?.clanRank)} | trophies=${number(m?.trophies)} | donations=${number(m?.donations)} | received=${number(m?.donationsReceived)} | league=${m?.league?.name || "unknown"}`
  ).join("\n");
}

function buildPrompt(data: Dict, mode: "clan" | "opponent" | "question", question = "") {
  const clan = data.clan || {};
  const clanTag = normalizeTag(String(clan.tag || data.clanTag || DEFAULT_CLAN_TAG));

  const facts = [
    `CLAN: ${clan.name || "Unknown"} ${clanTag}`,
    `LEVEL=${number(clan.clanLevel)} MEMBERS=${number(clan.members)} WAR_WINS=${number(clan.warWins)} WAR_LOSSES=${number(clan.warLosses)} WIN_STREAK=${number(clan.warWinStreak)}`,
    `WAR_LEAGUE=${clan.warLeague?.name || "unknown"} CAPITAL_LEAGUE=${clan.capitalLeague?.name || "unknown"} CLAN_POINTS=${number(clan.clanPoints)} CAPITAL_POINTS=${number(clan.clanCapitalPoints)}`,
    `ROSTER (official member order):\n${rosterText(clan)}`,
    `DETAILED PLAYER DATA (first five members):\n${data.playerDetailsText || "No individual player detail was available."}`,
    `CURRENT WAR:\n${currentWarText(data.currentWar, clanTag)}`,
    `RECENT WAR LOG:\n${warlogText(data.warlog, clanTag)}`,
    `CAPITAL RAID HISTORY:\n${capitalText(data.capital)}`,
  ].join("\n\n");

  const instructions = mode === "question"
    ? `You are CLASHIQ AI COACH answering a specific Clash of Clans question.

Use ONLY the supplied live Clash API facts. Answer the user's question directly instead of returning the generic clan briefing. For player questions, use the supplied names, tags, Town Hall, trophies, league, donations, war data and other fields. If the user says "first five", use the first five members in official roster order and identify all five.
Never invent missing facts. If a requested field is unavailable, say "Not available from the current API data."
Use plain text. Answer directly in the first paragraph. For player questions, give each requested player a separate entry with concrete data. Include player tags when available.`
    : mode === "opponent"
    ? `You are CLASHIQ AI COACH, a precise Clash of Clans war strategist.

Use ONLY the supplied live Clash API facts. Never invent troops, spells, heroes, defenses, attack strategies, replays, player skill, motives, or missing statistics. Do not assume a player has a specific army just because of Town Hall level. If something cannot be established from the data, say: "Not available from the current API data."

Your job is to turn the actual war board into a useful decision-support report. Prioritize concrete names, map positions, Town Hall levels, stars, destruction, attack counts and remaining attacks. Distinguish facts from tactical recommendations.

IMPORTANT OUTPUT RULES:
- Use plain text only. Do NOT use Markdown symbols such as **, ##, backticks or tables.
- You MUST output ALL 8 numbered sections. Never stop after section 1.
- Use exactly the numbered section headings below and keep them in order.
- Keep each section focused and readable.
- Do not repeat the same fact in multiple sections.
- Do not claim an attack is "perfect" unless the supplied attack record proves 3 stars and 100% destruction.
- Do not recommend a specific troop composition unless the supplied data actually contains composition data.
- If the war is over, analyze the result rather than pretending attacks remain.

1. ENEMY WAR SUMMARY
State the actual war state, score, destruction, attacks used and attacks remaining for both sides. If a value is unavailable, say so.

2. THREAT ASSESSMENT
Identify the most important enemy positions from the supplied roster and attack results. Give the map position, name and Town Hall level when available, followed by the exact evidence that makes the player a threat.

3. ENEMY ATTACK PATTERNS
Use only recorded attacks. State which enemy players attacked, their targets, stars and destruction. If the data does not reveal an attack pattern, say so instead of guessing.

4. OUR POSITION
Compare our stars, destruction and attacks remaining with the enemy. Identify the concrete situation on the board right now.

5. TARGET PRIORITIES
Give a practical target order for our remaining attacks. For every priority, include map position and player name when available and explain the reason from the supplied data. Do not invent a target.

6. WAR PLAN
Give a short step-by-step plan for the remaining attacks. Separate what is supported by the API from what must be checked in-game before attacking.

7. BIGGEST RISK
Name one risk that is directly supported by the current data.

8. NEXT 3 ACTIONS
Give exactly three short, concrete actions the clan should take next.`
    : `You are CLASHIQ AI COACH, a precise Clash of Clans clan analyst.

Use ONLY the supplied live Clash API facts. Never invent players, levels, attacks, troops, spells, heroes, defenses, replays, player skill, motives or statistics. If something cannot be established from the data, say: "Not available from the current API data."

IMPORTANT OUTPUT RULES:
- Use plain text only. Do NOT use Markdown symbols such as **, ##, backticks or tables.
- Use exactly the numbered section headings below.
- Prefer concrete names and numbers over generic advice.
- Do not repeat the same fact unnecessarily.
- Recommendations must be tied to an observed metric or record.

1. CLAN SUMMARY
Summarize level, member count, leagues, war record and current state.

2. STRENGTHS
List the strongest data-supported areas.

3. WEAKNESSES
List the clearest weaknesses supported by the data. Do not guess why they exist.

4. TOP 5 IMPROVEMENTS
Give five concrete improvements. Tie each one to a specific observed fact or metric.

5. WAR PERFORMANCE
Analyze the recent war log using actual wins/losses, stars and destruction. Point out clear trends without exaggerating them.

6. CURRENT WAR
If a war is active, analyze the live board, attacks used/remaining and important positions. If there is no active war, state that clearly.

7. MEMBER ACTIVITY
Use actual donations, trophies, Town Hall levels and war attacks where available. Mention names only when the data supports the observation.

8. CAPITAL ANALYSIS
Use only the supplied Capital Raid data. If unavailable, say so.

9. NEXT 3 ACTIONS
Give exactly three short, concrete actions the clan should take next.`;

  const userQuestion = String(question || "").trim().slice(0, 1500);
  return `${instructions}\n\n${userQuestion ? `USER QUESTION:\n${userQuestion}\n\n` : ""}VERIFIED LIVE CLASH DATA:\n${facts}`;
}

async function getClanData(clanTag: string) {
  const encoded = encodeURIComponent(clanTag);
  const [clan, currentWar, warlog, capital] = await Promise.all([
    clashFetch(`/clans/${encoded}`),
    clashFetch(`/clans/${encoded}/currentwar`, null),
    clashFetch(`/clans/${encoded}/warlog`, []),
    clashFetch(`/clans/${encoded}/capitalraidseasons?limit=5`, []),
  ]);

  const members = Array.isArray(clan?.memberList) ? clan.memberList : [];
  const firstFive = members.slice(0, 5);
  const playerDetails = await Promise.all(firstFive.map(async (member: Dict) => {
    const playerTag = String(member?.tag || "").trim();
    if (!playerTag) return { member, detail: null };
    try {
      const detail = await clashFetch(`/players/${encodeURIComponent(normalizeTag(playerTag))}`, null);
      return { member, detail };
    } catch {
      return { member, detail: null };
    }
  }));
  const playerDetailsText = playerDetails.map(({ member, detail }, index) => {
    const source = detail && typeof detail === "object" ? detail as Dict : member;
    return `PLAYER ${index + 1}: ${String(source?.name || member?.name || "Unknown")} | TAG=${String(source?.tag || member?.tag || "not available")} | TH=${number(source?.townHallLevel ?? member?.townHallLevel ?? member?.townhallLevel)} | EXP_LEVEL=${number(source?.expLevel)} | TROPHIES=${number(source?.trophies ?? member?.trophies)} | BEST_TROPHIES=${number(source?.bestTrophies)} | LEAGUE=${source?.league?.name || member?.league?.name || "unknown"} | CLAN_RANK=${number(member?.clanRank)} | DONATIONS=${number(source?.donations ?? member?.donations)} | RECEIVED=${number(source?.donationsReceived ?? member?.donationsReceived)} | WAR_STARS=${number(source?.warStars)} | ATTACK_WINS=${number(source?.attackWins)} | DEFENSE_WINS=${number(source?.defenseWins)} | ROLE=${source?.role || member?.role || "unknown"}`;
  }).join("\n");

  return { clan, clanTag, currentWar, warlog, capital, playerDetailsText };
}

async function callGeminiModel(model: string, prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(`${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "You are CLASHIQ AI Coach. Always answer in English, even if the question is written in another language. Accuracy comes first. Use only verified supplied Clash API facts. Be specific, tactical and complete. Never invent missing facts. Follow the requested plain-text section structure exactly. You must finish every requested section before stopping." }],
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.15,
        thinkingConfig: {
          thinkingLevel: "low",
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const err: any = new Error(`Gemini ${model} HTTP ${response.status}: ${String(data?.error?.message || data?.error?.status || "Gemini API error")}`);
    err.httpStatus = response.status;
    throw err;
  }

  const candidate = data?.candidates?.[0];
  const answer = candidate?.content?.parts
    ?.map((part: any) => typeof part?.text === "string" && !part?.thought ? part.text : "")
    .join("")
    .trim() || "";

  if (!answer) throw new Error(`Gemini ${model} returned an empty response`);
  return answer;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isBusyError(error: any) {
  const status = Number(error?.httpStatus || 0);
  const message = String(error?.message || error).toLowerCase();
  return (
    [429, 500, 502, 503, 504].includes(status) ||
    message.includes("overload") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("fetch failed") ||
    message.includes("empty response")
  );
}

// Tries each model in turn. When Gemini is overloaded (503/429) it waits and
// retries the same model, then falls through to the next model.
async function callGemini(prompt: string) {
  const models = Array.from(new Set([GEMINI_MODEL, "gemini-3.7-flash", "gemini-3.6-flash", GEMINI_FALLBACK_MODEL]));
  const attemptsPerModel = 3;
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
      try {
        return await callGeminiModel(model, prompt);
      } catch (error: any) {
        lastError = error;
        const status = Number(error?.httpStatus || 0);
        console.warn(`Gemini ${model} attempt ${attempt}/${attemptsPerModel} failed:`, String(error?.message || error));
        if (status === 404) break; // model not available: go straight to the next one
        if (!isBusyError(error)) throw error; // e.g. bad API key: retrying will not help
        if (attempt < attemptsPerModel) await sleep(1500 * attempt);
      }
    }
  }

  throw lastError || new Error("Gemini is unavailable");
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

    const answer = await callGemini(prompt);
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


router.post("/ai/war-test", async (req, res) => {
  try {
    if (process.env.CLASHIQ_TEST_MODE !== "true") {
      return res.status(404).json({ error: "Not found" });
    }

    const scenarioId = typeof req.body?.scenario === "string" ? req.body.scenario : "";
    const scenario = getWarTestScenario(scenarioId);
    if (!scenario) {
      return res.status(400).json({
        error: "Unknown war test scenario.",
        scenarios: WAR_TEST_SCENARIOS.map(({ id, label, expected }) => ({ id, label, expected })),
      });
    }

    const question = typeof req.body?.question === "string"
      ? req.body.question.slice(0, 1000)
      : "Identify the current enemy threat. Use only recorded attacks and current war state. If there is no active threat, say so clearly.";

    const data = {
      clan: {
        tag: "#2Q0Q82C9R",
        name: "BHABE DHEMONS",
        clanLevel: 18,
        members: scenario.currentWar.clan.members.length,
        warWins: 0,
        warLosses: 0,
        warWinStreak: 0,
        warLeague: { name: "Test League" },
        capitalLeague: { name: "Test Capital" },
        clanPoints: 0,
        clanCapitalPoints: 0,
        memberList: scenario.currentWar.clan.members.map((member: Dict) => ({
          name: member.name,
          townHallLevel: member.townhallLevel,
          clanRank: member.mapPosition,
          trophies: 0,
          donations: 0,
          donationsReceived: 0,
          league: { name: "Test" },
        })),
      },
      clanTag: "#2Q0Q82C9R",
      currentWar: scenario.currentWar,
      warlog: [],
      capital: [],
    };

    const prompt = buildPrompt(data, "opponent", question);
    if (prompt.length > MAX_PROMPT_CHARS) {
      throw new Error(`AI war test data exceeded the safety limit (${prompt.length} characters).`);
    }

    const answer = await callGemini(prompt);
    return res.json({
      scenario: scenario.id,
      label: scenario.label,
      expected: scenario.expected,
      answer,
    });
  } catch (error: any) {
    console.error("AI War Test error:", error);
    const message = error?.message || "AI War Test failed";
    if (isBusyError(error)) {
      return res.status(503).json({
        error: "The AI is overloaded right now. Please wait a moment and try the scenario again.",
        detail: message,
      });
    }
    return res.status(500).json({ error: message });
  }
});

router.post("/ai/coach", (req, res) => handleCoach(req, res, false));
router.post("/ai/chatgpt/coach", (req, res) => handleCoach(req, res, true));

export default router;
