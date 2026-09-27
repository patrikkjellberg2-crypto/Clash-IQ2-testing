import type { ClashRecord } from "./clash-types";

export function normalizeClanTag(value: string): string {
  const trimmed = value.trim().toUpperCase();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}
export function isRequestedClan(value: ClashRecord | null, clanTag: string): boolean {
  if (!value) return false;
  const tag = value.tag;
  return typeof tag === "string" && normalizeClanTag(tag) === normalizeClanTag(clanTag);
}
export function normalizeAttackerTag(value: string): string {
  const trimmed = value.trim().toUpperCase();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}