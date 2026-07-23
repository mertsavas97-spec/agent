/**
 * Pure ad-gating rules — docs/product/ads-policy.md
 * Premium (week/month/year) ⇒ all ads off.
 */

export const ADS_LIMITS = {
  /**
   * Free: up to one full-screen interstitial per billed solve leave
   * (aligned with daily free solve budget). Premium: never.
   */
  interstitialMaxPerIstanbulDay: 5,
  /** Show interstitial after this many billed free solves today (1 = every leave). */
  interstitialAfterBilledSolves: 1,
  freeDailySolves: 5,
  /** Max photos in one multi-question batch (abuse cap; also Premium) */
  multiBatchMax: 5,
} as const;

export type AdAudience = {
  isPremium: boolean;
};

export type InterstitialContext = AdAudience & {
  billedSolvesToday: number;
  interstitialShownToday: number;
  /** true when leaving solution / natural break — never during reading */
  atNaturalBreak: boolean;
};

export type RewardedContext = AdAudience & {
  freeRemainingToday: number;
  /** @deprecated Product has no daily rewarded-extra cap; kept for callers. */
  rewardedClaimedToday?: number;
};

export function shouldShowBanner(audience: AdAudience): boolean {
  return !audience.isPremium;
}

export function shouldShowInterstitial(ctx: InterstitialContext): boolean {
  if (ctx.isPremium) return false;
  if (!ctx.atNaturalBreak) return false;
  if (ctx.interstitialShownToday >= ADS_LIMITS.interstitialMaxPerIstanbulDay) return false;
  if (ctx.billedSolvesToday < ADS_LIMITS.interstitialAfterBilledSolves) return false;
  return true;
}

/**
 * Optional +1 solve via rewarded — when free quota exhausted.
 * No daily product cap (abuse shield lives on the grant callable).
 */
export function shouldOfferRewardedExtra(ctx: RewardedContext): boolean {
  if (ctx.isPremium) return false;
  if (ctx.freeRemainingToday > 0) return false;
  return true;
}

export type MultiBatchGateContext = AdAudience & {
  /** How many multi-batch unlocks already claimed today (telemetry only). */
  multiBatchUnlocksToday?: number;
};

/**
 * Free must watch rewarded to start a multi batch.
 * Premium skips the ad; both still capped by `multiBatchMax` photos.
 * Every free open requires a new ad — no daily unlock ceiling.
 */
export function requiresRewardedForMultiBatch(ctx: MultiBatchGateContext): boolean {
  if (ctx.isPremium) return false;
  return true;
}

/** Always claimable; free path still goes through the rewarded ad. */
export function canClaimMultiBatchUnlock(_ctx: MultiBatchGateContext): boolean {
  return true;
}

/** Solve / analyzing / solution surfaces never host ads. */
export function adsAllowedOnSurface(surface: 'tabs' | 'solve' | 'onboarding'): boolean {
  return surface === 'tabs';
}
