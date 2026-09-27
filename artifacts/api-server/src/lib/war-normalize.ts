import type { ClashRecord } from "./clash-types";
import { normalizeClanTag } from "./clash-tags";

export function normalizeWarState(
  war: ClashRecord,
  clanTag: string,
): string {
  const direct = String(
    war.state ?? war.result ?? "",
  )
    .trim()
    .toLowerCase();

  const directMap: Record<string, string> = {
    won: "won",
    win: "won",
    victory: "won",
    lost: "lost",
    lose: "lost",
    loss: "lost",
    defeat: "lost",
    draw: "draw",
    tied: "draw",
  };

  const clan =
    war.clan && typeof war.clan === "object"
      ? (war.clan as ClashRecord)
      : null;
  const opponent =
    war.opponent && typeof war.opponent === "object"
      ? (war.opponent as ClashRecord)
      : null;

  const clanTagNormalized = normalizeClanTag(clanTag);
  const ourSide =
    clan && normalizeClanTag(String(clan.tag ?? "")) === clanTagNormalized
      ? clan
      : opponent &&
          normalizeClanTag(String(opponent.tag ?? "")) === clanTagNormalized
        ? opponent
        : null;
  const otherSide =
    ourSide === clan
      ? opponent
      : ourSide === opponent
        ? clan
        : null;

  // `war.result` can be relative to the API's first side. If our clan is the
  // opponent side, invert that result instead of displaying the wrong winner.
  if (directMap[direct]) {
    if (ourSide === clan) return directMap[direct];
    if (ourSide === opponent) {
      const result = directMap[direct];
      return result === "won"
        ? "lost"
        : result === "lost"
          ? "won"
          : result;
    }
  }

  const sideResult = String(
    ourSide?.result ?? "",
  )
    .trim()
    .toLowerCase();

  if (directMap[sideResult]) {
    return directMap[sideResult];
  }

  const ended =
    Boolean(war.endTime) ||
    ["warended", "ended", "complete", "completed"].includes(direct);

  if (!ended || !ourSide || !otherSide) {
    return "unknown";
  }

  const ourStars = Number(ourSide.stars ?? 0);
  const otherStars = Number(otherSide.stars ?? 0);

  if (ourStars > otherStars) return "won";
  if (ourStars < otherStars) return "lost";

  const ourDestruction = Number(
    ourSide.destructionPercentage ?? 0,
  );
  const otherDestruction = Number(
    otherSide.destructionPercentage ?? 0,
  );

  if (ourDestruction > otherDestruction) return "won";
  if (ourDestruction < otherDestruction) return "lost";

  return "draw";
}

export function normalizeWarLog(
  wars: ClashRecord[],
  clanTag: string,
): ClashRecord[] {
  return wars.map((war) => ({
    ...war,
    state: normalizeWarState(war, clanTag),
  }));
}

export function listItems(
  value: ClashRecord | ClashRecord[] | null,
): ClashRecord[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is ClashRecord =>
        Boolean(item && typeof item === "object"),
    );
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray(value.items)
  ) {
    return value.items.filter(
      (item): item is ClashRecord =>
        Boolean(item && typeof item === "object"),
    );
  }

  // ClashKing's /war/{clan_tag}/previous endpoint returns a SINGLE
  // ClanWar object, not an array. The previous implementation treated that
  // valid war object as an empty list, which made Recent War Performance say
  // "No verified war data" even though the API had returned a real war.
  // Only treat objects with both war sides as a single war; do not turn normal
  // clan/member objects into list items.
  if (
    value &&
    typeof value === "object" &&
    value.clan &&
    typeof value.clan === "object" &&
    value.opponent &&
    typeof value.opponent === "object"
  ) {
    return [value];
  }

  return [];
}
