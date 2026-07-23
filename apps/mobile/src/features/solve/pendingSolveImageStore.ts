import type { PickedImage } from './image';

/**
 * Hold the picked image in memory so expo-router params cannot mangle
 * content:// / ph:// / query-bearing camera URIs (gallery cache file:// is fine;
 * camera often is not).
 */
let pending: PickedImage | null = null;
let claimed: PickedImage | null = null;

export function setPendingSolveImage(image: PickedImage): void {
  pending = image;
  claimed = null;
}

export function peekPendingSolveImage(): PickedImage | null {
  return pending ?? claimed;
}

/** Claim for capture-confirm / solve. Re-entrant for Strict Mode remounts. */
export function takePendingSolveImage(): PickedImage | null {
  if (pending) {
    claimed = pending;
    pending = null;
  }
  return claimed;
}

export function clearPendingSolveImage(): void {
  pending = null;
  claimed = null;
}

export function releaseClaimedSolveImage(): void {
  claimed = null;
}

/** Test helper */
export function __resetPendingSolveImageForTests(): void {
  pending = null;
  claimed = null;
}
