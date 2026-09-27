export type ClashRecord = Record<string, unknown>;

export type FetchResult = {
  data: ClashRecord | ClashRecord[] | null;
  failed: boolean;
};
