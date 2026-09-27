import { eq } from "drizzle-orm";
import { clanSelectionTable, db } from "@workspace/db";
import { normalizeClanTag } from "./clash-tags";

export const DEFAULT_CLAN_TAG = "#2Q0Q82C9R";
const CLAN_SELECTION_ID = 1;

export async function getActiveClanTag(requestedTag?: string): Promise<string> {
  if (requestedTag) return normalizeClanTag(requestedTag);
  const [selection] = await db.select({ clanTag: clanSelectionTable.clanTag }).from(clanSelectionTable).where(eq(clanSelectionTable.id, CLAN_SELECTION_ID)).limit(1);
  return selection?.clanTag ?? DEFAULT_CLAN_TAG;
}

export async function persistActiveClanTag(clanTag: string): Promise<void> {
  await db.insert(clanSelectionTable).values({ id: CLAN_SELECTION_ID, clanTag }).onConflictDoUpdate({
    target: clanSelectionTable.id, set: { clanTag, updatedAt: new Date() },
  });
}