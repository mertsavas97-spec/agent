/**
 * Pure ad-gating rules — docs/product/ads-policy.md
 * Premium (week/month/year) ⇒ all ads off.
 */

export const ADS_LIMITS = {
  interstitialMaxPerIstanbulDay: 1,
  rewardedExtraMaxPerIstanbulDay: 2,
  /** Soft interstitial only after this many billed free solves today */
  interstitialAfterBilledSolves: 3,
  freeDailySolves: 5,
  /** Max photos in one multi-question batch (abuse cap; also Premium) */
  multiBatchMax: 5,
  /** Free users: rewarded claims that unlock a multi batch per İstanbul day */
  rewardedMultiBatchMaxPerIstanbulDay: 3,
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
  rewardedClaimedToday: number;
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

/** Optional +1 solve via rewarded — only when free quota exhausted. */
export function shouldOfferRewardedExtra(ctx: RewardedContext): boolean {
  if (ctx.isPremium) return false;
  if (ctx.freeRemainingToday > 0) return false;
  if (ctx.rewardedClaimedToday >= ADS_LIMITS.rewardedExtraMaxPerIstanbulDay) return false;
  return true;
}

export type MultiBatchGateContext = AdAudience & {
  /** How many multi-batch unlocks already claimed today (free) */
  multiBatchUnlocksToday: number;
};

/**
 * Free must watch rewarded to start a multi batch.
 * Premium skips the ad; both still capped by `multiBatchMax` photos.
 */
export function requiresRewardedForMultiBatch(ctx: MultiBatchGateContext): boolean {
  if (ctx.isPremium) return false;
  return true;
}

export function canClaimMultiBatchUnlock(ctx: MultiBatchGateContext): boolean {
  if (ctx.isPremium) return true;
  return ctx.multiBatchUnlocksToday < ADS_LIMITS.rewardedMultiBatchMaxPerIstanbulDay;
}

/** Solve / analyzing / solution surfaces never host ads. */
export function adsAllowedOnSurface(surface: 'tabs' | 'solve' | 'onboarding'): boolean {
  return surface === 'tabs';
}
