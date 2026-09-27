import { Router, type IRouter } from "express";
import { GetClashDashboardResponse, GetClashDashboardQueryParams } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";
import { capitalRaidArchiveTable, db } from "@workspace/db";
import type { ClashRecord } from "../lib/clash-types";
import { normalizeClanTag, isRequestedClan } from "../lib/clash-tags";
import { listItems, normalizeWarLog } from "../lib/war-normalize";
import { getActiveClanTag, persistActiveClanTag } from "../lib/clan-selection";
import { fetchOptionalClashKingResource, fetchOptionalResource } from "../lib/clash-fetch";
import { snapshotCurrentWar, snapshotWarlog } from "../lib/war-archive";

const router: IRouter = Router();

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

router.get(
  "/clash/dashboard",
  async (req, res): Promise<void> => {
    const parsedQuery =
      GetClashDashboardQueryParams.safeParse({
        clanTag: req.query.clanTag,
      });

    if (!parsedQuery.success) {
      res.status(400).json({
        error: "Enter a valid Clash clan tag.",
        code: "INVALID_CLAN_TAG",
      });
      return;
    }

    const clanTag = await getActiveClanTag(
      parsedQuery.data.clanTag,
    );

    const encodedClanTag =
      encodeURIComponent(clanTag);

    const [
      basicClanResult,
      clanResult,
      officialClanResult,
      officialMembersResult,
      currentWarResult,
      officialWarlogResult,
      officialCapitalRaidResult,
      clashKingWarlogResult,
    ] = await Promise.all([
      // Use ClashKing's documented clan endpoint as the primary public source.
      // This is more stable than the older /v2/.../cached compatibility route.
      fetchOptionalClashKingResource(
        `/v2/clan/${encodedClanTag}/cached`,
        null,
        req.log,
      ),
      // Keep the richer cached profile as a secondary source.
      fetchOptionalClashKingResource(
        `/v2/clan/${encodedClanTag}/cached`,
        null,
        req.log,
      ),
      // Use the official Supercell clan endpoint for the live roster.
      // ClashKing's cached roster can be incomplete/stale, which previously
      // caused valid clans to appear as 1/50 members.
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}`,
            null,
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      // Fetch the live member list separately. This avoids trusting a stale
      // embedded memberList from a cached clan profile.
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}/members`,
            [],
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      // ClashKing exposes the current-war pointer publicly, but not the
      // complete live war board. Keep Supercell as a temporary live-war
      // fallback until the live board is available through ClashKing.
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}/currentwar`,
            null,
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      // Prefer the official Supercell war log for the requested clan. This
      // endpoint is explicitly clan-scoped, so it is the authoritative source
      // for the Dashboard's Latest War Log. ClashKing remains a fallback.
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}/warlog`,
            [],
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      process.env.CLASH_API_TOKEN
        ? fetchOptionalResource(
            `/clans/${encodedClanTag}/capitalraidseasons`,
            [],
            req.log,
          )
        : Promise.resolve({ data: null, failed: false }),
      // Use ClashKing's dedicated previous-war endpoint for historical
      // performance. This is specifically designed for a clan's previous
      // wars and is more reliable for Recent War Performance than the older
      // /v2/.../wars compatibility route.
      fetchOptionalClashKingResource(
        `/v2/clan/${encodedClanTag}/wars`,
        [],
        req.log,
      ),
    ]);

    const hasValidBasicClan =
      basicClanResult.data &&
      !Array.isArray(basicClanResult.data);
    const hasValidClashKingClan =
      clanResult.data &&
      !Array.isArray(clanResult.data);
    const hasValidOfficialClan =
      officialClanResult.data &&
      !Array.isArray(officialClanResult.data);

    if (
      !hasValidBasicClan &&
      !hasValidClashKingClan &&
      !hasValidOfficialClan
    ) {
      res.status(503).json({
        error:
          "Could not load the clan from Clash of Clans. Check the clan tag and try again.",
        code: "CLAN_FETCH_FAILED",
      });
      return;
    }

    await persistActiveClanTag(clanTag);

    const rawCurrentWar =
      currentWarResult.data;

    const currentWar =
      rawCurrentWar &&
      !Array.isArray(rawCurrentWar) &&
      [
        "preparation",
        "inWar",
        "matchmaking",
      ].includes(
        typeof rawCurrentWar.state === "string"
          ? rawCurrentWar.state
          : "",
      )
        ? rawCurrentWar
        : null;

    const officialWarlog = normalizeWarLog(
      listItems(officialWarlogResult.data),
      clanTag,
    );
    const clashKingWarlog = normalizeWarLog(
      listItems(clashKingWarlogResult.data),
      clanTag,
    );
    const sourceWarlog =
      officialWarlog.length > 0
        ? officialWarlog
        : clashKingWarlog;

    /*
     * The dashboard is driven by the clan tag the user searched for.
     * ClashKing can return the two sides in either order. Only accept wars
     * where the requested clan is explicitly one of the two sides, and
     * orient the result so war.clan is always the requested clan.
     */
    const requestedTag = normalizeClanTag(clanTag);

    const warlog = sourceWarlog
      .filter((war) => {
        const warClan =
          war.clan && typeof war.clan === "object"
            ? (war.clan as ClashRecord)
            : null;
        const warOpponent =
          war.opponent && typeof war.opponent === "object"
            ? (war.opponent as ClashRecord)
            : null;

        const clanMatches =
          warClan &&
          normalizeClanTag(String(warClan.tag ?? "")) === requestedTag;
        const opponentMatches =
          warOpponent &&
          normalizeClanTag(String(warOpponent.tag ?? "")) === requestedTag;

        return Boolean(clanMatches || opponentMatches);
      })
      .map((war) => {
        const warClan =
          war.clan && typeof war.clan === "object"
            ? (war.clan as ClashRecord)
            : null;
        const warOpponent =
          war.opponent && typeof war.opponent === "object"
            ? (war.opponent as ClashRecord)
            : null;

        const clanMatches =
          warClan &&
          normalizeClanTag(String(warClan.tag ?? "")) === requestedTag;

        if (clanMatches) {
          return war;
        }

        // The requested clan was returned as the opponent. Swap the sides so
        // older frontend consumers also receive our clan in war.clan.
        return {
          ...war,
          clan: warOpponent,
          opponent: warClan,
        };
      });

    const liveCapitalRaidSeasons = listItems(
      officialCapitalRaidResult.data,
    );

    // Persist every season we see so the TEST app builds a durable clan history
    // instead of only showing the small rolling window returned by Supercell.
    for (const season of liveCapitalRaidSeasons) {
      const startTime = String(season.startTime ?? "").trim();
      const endTime = String(season.endTime ?? "").trim();
      if (!endTime) continue;

      const leagueRaw =
        (officialClanResult.data && !Array.isArray(officialClanResult.data) ? officialClanResult.data.capitalLeague : undefined) ??
        (basicClanResult.data && !Array.isArray(basicClanResult.data) ? basicClanResult.data.capitalLeague : undefined) ??
        (clanResult.data && !Array.isArray(clanResult.data) ? clanResult.data.capitalLeague : undefined);
      const leagueName =
        leagueRaw && typeof leagueRaw === "object"
          ? String((leagueRaw as ClashRecord).name ?? "")
          : String(leagueRaw ?? "");

      const seasonClan =
        season.clan && typeof season.clan === "object"
          ? season.clan as ClashRecord
          : null;

      try {
        await db
          .insert(capitalRaidArchiveTable)
          .values({
            id: `${normalizeClanTag(clanTag)}__${endTime}`,
            clanTag: normalizeClanTag(clanTag),
            clanName: String((
              (officialClanResult.data && !Array.isArray(officialClanResult.data) ? officialClanResult.data.name : undefined) ??
              (basicClanResult.data && !Array.isArray(basicClanResult.data) ? basicClanResult.data.name : undefined) ??
              (clanResult.data && !Array.isArray(clanResult.data) ? clanResult.data.name : undefined) ??
              seasonClan?.name ??
              ""
            ) || "") || null,
            leagueName: leagueName || null,
            startTime: startTime || null,
            endTime,
            state: String(season.state ?? "") || null,
            capitalTotalLoot: Number(season.capitalTotalLoot ?? 0) || 0,
            raidsCompleted: Number(season.raidsCompleted ?? 0) || 0,
            offensiveReward: Number(season.offensiveReward ?? 0) || 0,
            defensiveReward: Number(season.defensiveReward ?? 0) || 0,
            members: Array.isArray(season.members) ? season.members : [],
            raw: season,
          })
          .onConflictDoUpdate({
            target: capitalRaidArchiveTable.id,
            set: {
              clanName: String((
                (officialClanResult.data && !Array.isArray(officialClanResult.data) ? officialClanResult.data.name : undefined) ??
                (basicClanResult.data && !Array.isArray(basicClanResult.data) ? basicClanResult.data.name : undefined) ??
                (clanResult.data && !Array.isArray(clanResult.data) ? clanResult.data.name : undefined) ??
                seasonClan?.name ??
                ""
              ) || "") || null,
              leagueName: leagueName || null,
              startTime: startTime || null,
              state: String(season.state ?? "") || null,
              capitalTotalLoot: Number(season.capitalTotalLoot ?? 0) || 0,
              raidsCompleted: Number(season.raidsCompleted ?? 0) || 0,
              offensiveReward: Number(season.offensiveReward ?? 0) || 0,
              defensiveReward: Number(season.defensiveReward ?? 0) || 0,
              members: Array.isArray(season.members) ? season.members : [],
              raw: season,
              updatedAt: new Date(),
            },
          });
      } catch (error) {
        req.log.warn({ error, endTime }, "ClashIQ capital raid archive save failed");
      }
    }

    const archivedCapitalRaids = await db
      .select()
      .from(capitalRaidArchiveTable)
      .where(eq(capitalRaidArchiveTable.clanTag, normalizeClanTag(clanTag)))
      .orderBy(desc(capitalRaidArchiveTable.endTime));

    const capitalRaidSeasons = archivedCapitalRaids.map((row) => ({
      ...(row.raw && typeof row.raw === "object" ? row.raw as ClashRecord : {}),
      startTime: row.startTime,
      endTime: row.endTime,
      state: row.state,
      capitalTotalLoot: row.capitalTotalLoot,
      raidsCompleted: row.raidsCompleted,
      offensiveReward: row.offensiveReward,
      defensiveReward: row.defensiveReward,
      members: Array.isArray(row.members) ? row.members : [],
      archiveSource: "persistent",
    }));

    const clashKingClanRaw =
      clanResult.data &&
      !Array.isArray(clanResult.data)
        ? clanResult.data
        : null;

    const basicClanRaw =
      basicClanResult.data &&
      !Array.isArray(basicClanResult.data)
        ? basicClanResult.data
        : null;

    const officialClanRaw =
      officialClanResult.data &&
      !Array.isArray(officialClanResult.data)
        ? officialClanResult.data
        : null;

    // Every source is checked against the searched tag before any fields are
    // merged. This prevents data from a stale/default clan from leaking into
    // a searched clan (for example Capital Points from the wrong clan).
    const clashKingClan = isRequestedClan(
      clashKingClanRaw,
      clanTag,
    )
      ? clashKingClanRaw
      : null;
    const basicClan = isRequestedClan(
      basicClanRaw,
      clanTag,
    )
      ? basicClanRaw
      : null;
    const officialClan = isRequestedClan(
      officialClanRaw,
      clanTag,
    )
      ? officialClanRaw
      : null;

    // Do not call ClashKing's legacy /clan/search endpoint here.
    // The exact clan tag has already been resolved above from the live clan
    // sources, and the legacy search endpoint returns 404 on the current API.
    // Keeping this optional lookup out of the dashboard prevents a known
    // failing request from turning every page load into an error state.
    const searchedClan: ClashRecord | null = null;

    const officialMembersRaw = listItems(
      officialMembersResult.data,
    );

    /*
     * IMPORTANT: all clan switching must use the exact requested tag.
     *
     * BHABE DHEMONS worked because its cached/official sources happened to
     * agree. Other clans exposed a partial `members: 1` value from one source,
     * which then overwrote the real count. Do not let one weak source win.
     *
     * ClashKing documents the Clan model with members, warWins and warLosses,
     * and its search result is also a full Clan model. We therefore use the
     * exact-tag sources as a pool and choose the most complete value for each
     * field instead of treating one source as globally authoritative.
     */

    const clashKingEmbeddedMembers =
      clashKingClan && Array.isArray(clashKingClan.memberList)
        ? clashKingClan.memberList.filter(
            (item): item is ClashRecord =>
              Boolean(item && typeof item === "object"),
          )
        : [];

    const basicEmbeddedMembers =
      basicClan && Array.isArray(basicClan.memberList)
        ? basicClan.memberList.filter(
            (item): item is ClashRecord =>
              Boolean(item && typeof item === "object"),
          )
        : [];

    const officialEmbeddedMembers =
      officialClan && Array.isArray(officialClan.memberList)
        ? officialClan.memberList.filter(
            (item): item is ClashRecord =>
              Boolean(item && typeof item === "object"),
          )
        : [];

    const searchedEmbeddedMembers =
      searchedClan && Array.isArray(searchedClan.memberList)
        ? searchedClan.memberList.filter(
            (item): item is ClashRecord =>
              Boolean(item && typeof item === "object"),
          )
        : [];

    const rosterCandidates = [
      officialMembersRaw,
      officialEmbeddedMembers,
      searchedEmbeddedMembers,
      basicEmbeddedMembers,
      clashKingEmbeddedMembers,
    ].filter((list) => list.length > 0);

    // Prefer the most complete exact-tag roster. This specifically prevents a
    // one-member partial response from replacing a 40+ member roster.
    const members =
      rosterCandidates.length > 0
        ? rosterCandidates.reduce((best, current) =>
            current.length > best.length ? current : best,
          )
        : [];

    const memberCountCandidates = [
      typeof officialClan?.members === "number"
        ? officialClan.members
        : null,
      typeof searchedClan?.members === "number"
        ? searchedClan.members
        : null,
      typeof basicClan?.members === "number"
        ? basicClan.members
        : null,
      typeof clashKingClan?.members === "number"
        ? clashKingClan.members
        : null,
    ].filter(
      (value): value is number =>
        typeof value === "number" && value > 0,
    );

    // A count of 1 is treated as suspicious when another exact-tag source or
    // the actual roster contains multiple members. Otherwise retain a valid
    // single-member clan.
    const nonSuspiciousCounts =
      memberCountCandidates.filter(
        (value) =>
          value >= 2 ||
          (members.length <= 1 && value === 1),
      );

    const memberCount =
      members.length >= 2
        ? (() => {
            const compatible = nonSuspiciousCounts
              .filter((value) => value >= members.length)
              .sort(
                (a, b) =>
                  Math.abs(a - members.length) -
                  Math.abs(b - members.length),
              );

            return compatible[0] ?? members.length;
          })()
        : nonSuspiciousCounts[0] ??
          memberCountCandidates[0] ??
          null;

    const clan =
      basicClan || clashKingClan || officialClan
        ? {
            ...(clashKingClan ?? {}),
            ...(basicClan ?? {}),
            ...(officialClan ?? {}),
          }
        : null;

    if (clan) {
      // Preserve the best exact-tag member count rather than allowing a
      // partial official response to overwrite it.
      if (memberCount !== null) {
        clan.members = memberCount;
      }

      // Official data is preferred for live Capital fields when available,
      // but it is only accepted after the tag was verified above.
      if (officialClan) {
        if (typeof officialClan.clanCapitalPoints === "number") {
          clan.clanCapitalPoints = officialClan.clanCapitalPoints;
        }
        if (officialClan.capitalLeague !== undefined) {
          const league = officialClan.capitalLeague;
          clan.capitalLeague =
            league && typeof league === "object"
              ? String((league as ClashRecord).name ?? "—")
              : league;
        }
      }
    }

    // Fill summary statistics from the exact-tag search result when the
    // richer clan endpoint omitted them. These fields are intentionally
    // independent: a source may have warWins but omit warLosses, for example.
    if (clan && searchedClan) {
      if (typeof searchedClan.warWins === "number") {
        clan.warWins = searchedClan.warWins;
      }

      if (typeof searchedClan.warLosses === "number") {
        clan.warLosses = searchedClan.warLosses;
      }

      if (typeof searchedClan.warTies === "number") {
        clan.warTies = searchedClan.warTies;
      }
    }

    if (clan && members.length > 0) {
      clan.memberList = members;
    }

    const dashboard = {
      clan,
      members,
      currentWar:
        currentWar &&
        !Array.isArray(currentWar)
          ? currentWar
          : null,
      warlog,
      capitalRaidSeasons,
      fetchedAt: new Date().toISOString(),
      clanTag,
      apiConfigured: true,
    };

    res.json(
      GetClashDashboardResponse.parse(
        dashboard,
      ),
    );

    // Save this war (and the war log) to the database, without slowing
    // down or breaking the response that was just sent.
    void snapshotCurrentWar(clanTag, dashboard.currentWar, req.log);
    void snapshotWarlog(clanTag, warlog, req.log);
  },
);

export default router;
