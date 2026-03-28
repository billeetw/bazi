import type { LifeBookDocument } from "./types";
import { fetchAccountLifebookDocument, readBaziJwt } from "./utils/accountLifebookDocument";
import { mergeDocWithBetaSeed, tryLoadBetaSeedDocument } from "./utils/betaSeedDocument";

/**
 * 初次進入：已登入則優先雲端命書（帳號綁定）；否則沿用 storage／seed。
 */
export async function resolveInitialDocument(loadLocal: () => LifeBookDocument | null): Promise<LifeBookDocument | null> {
  const local = loadLocal();
  const seed = tryLoadBetaSeedDocument();

  if (!readBaziJwt()) {
    return mergeDocWithBetaSeed(local, seed) ?? seed ?? null;
  }

  try {
    const remote = await fetchAccountLifebookDocument();
    if (remote) {
      return mergeDocWithBetaSeed(remote, seed) ?? remote;
    }
  } catch (e) {
    console.warn("[bootstrapAccountLifebook] fetch account doc failed:", e);
  }

  return mergeDocWithBetaSeed(local, seed) ?? seed ?? null;
}
