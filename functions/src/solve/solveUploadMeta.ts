/**
 * GCS / Firebase Storage custom metadata keys are case-insensitive and often
 * returned lowercased in finalize events. Match tags robustly.
 */
export function metaValue(
  meta: Record<string, string> | undefined | null,
  key: string,
): string | undefined {
  if (!meta) return undefined;
  const want = key.toLowerCase();
  for (const [k, v] of Object.entries(meta)) {
    if (k.toLowerCase() === want && typeof v === 'string' && v.length > 0) {
      return v;
    }
  }
  return undefined;
}

/** True when upload is tagged by the mobile solve flow. */
export function isSolveTaggedUpload(
  meta: Record<string, string> | undefined | null,
): boolean {
  const flag = metaValue(meta, 'cozbilSolve');
  return flag === '1' || flag === 'true';
}
