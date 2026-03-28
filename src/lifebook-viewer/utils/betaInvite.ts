/** 與主站 `js/ui.js`（lifebook_v2_beta_invite_verified）一致 */

export const LIFEBOOK_BETA_INVITE_VERIFIED_KEY = "lifebook_v2_beta_invite_verified";

export function isLifebookBetaInviteVerified(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LIFEBOOK_BETA_INVITE_VERIFIED_KEY) === "1";
  } catch {
    return false;
  }
}
