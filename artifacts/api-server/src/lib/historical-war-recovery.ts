import type { ClashRecord } from "./clash-types";
import { normalizeClanTag } from "./clash-tags";
import { listItems } from "./war-normalize";
import { fetchOptionalClashKingResource, fetchOptionalResource } from "./clash-fetch";
import { snapshotCurrentWar } from "./war-archive";

/**
 * Recover completed wars with member-level attack data before Player Cards
 * read history. ClashKing exposes both a bulk previous-war endpoint and an
 * end-time-specific endpoint; the official warlog is used only to discover
 * additional completed war timestamps.
 */
export async function recoverHistoricalWars(
  clanTag: string,
  log: { warn: (obj: object, message: string) => void },
  maxWars = 15,
): Promise<void> {
  const requested = normalizeClanTag(clanTag);
  const seen = new Set<string>();

  const save = async (raw: ClashRecord) => {
    const clan = raw.clan && typeof raw.clan === "object" ? raw.clan as ClashRecord : null;
    const opponent = raw.opponent && typeof raw.opponent === "object" ? raw.opponent as ClashRecord : null;
    if (!clan || !opponent) return;
    const clanTagFromPayload = normalizeClanTag(String(clan.tag ?? ""));
    const opponentTagFromPayload = normalizeClanTag(String(opponent.tag ?? ""));
    if (clanTagFromPayload !== requested && opponentTagFromPayload !== requested) return;
    const endTime = String(raw.endTime ?? "").trim();
    if (!endTime) return;
    const oriented = clanTagFromPayload === requested
      ? raw
      : { ...raw, clan: opponent, opponent: clan };
    const otherTag = normalizeClanTag(String((oriented.opponent as ClashRecord)?.tag ?? ""));
    const key = `${requested}__${otherTag}__${endTime}`;
    if (seen.has(key)) return;
    seen.add(key);
    await snapshotCurrentWar(clanTag, { ...oriented, state: "warEnded" }, log as any);
  };

  try {
    const bulk = await fetchOptionalClashKingResource(
      `/war/${encodeURIComponent(requested)}/previous`,
      null,
      log,
    );
    for (const war of listItems(bulk.data).slice(0, maxWars)) {
      try { await save(war); } catch (error) { log.warn({ error }, "ClashIQ historical bulk war save failed"); }
    }
  } catch (error) {
    log.warn({ error }, "ClashIQ historical bulk recovery failed");
  }

  try {
    const warlog = await fetchOptionalResource(
      `/clans/${encodeURIComponent(requested)}/warlog`,
      [],
      log,
    );
    for (const listed of listItems(warlog.data).slice(0, maxWars)) {
      const endTime = String(listed.endTime ?? "").trim();
      if (!endTime) continue;
      const clan = listed.clan && typeof listed.clan === "object" ? listed.clan as ClashRecord : null;
      const opponent = listed.opponent && typeof listed.opponent === "object" ? listed.opponent as ClashRecord : null;
      if (!clan || !opponent) continue;
      const otherTag = normalizeClanTag(String(opponent.tag ?? ""));
      const key = `${requested}__${otherTag}__${endTime}`;
      if (seen.has(key)) continue;
      try {
        const detail = await fetchOptionalClashKingResource(
          `/war/${encodeURIComponent(requested)}/previous/${encodeURIComponent(endTime)}`,
          null,
          log,
        );
        for (const war of listItems(detail.data).slice(0, 1)) await save(war);
      } catch (error) {
        log.warn({ error, endTime }, "ClashIQ historical war detail recovery failed");
      }
    }
  } catch (error) {
    log.warn({ error }, "ClashIQ historical warlog discovery failed");
  }
}
