/**
 * Parse Storage object name `users/{uid}/uploads/{localId}.jpg` → ids.
 * Returns null when the path is not a solve upload.
 */
export function parseSolveUploadPath(
  objectName: string | undefined,
): { uid: string; localId: string; imagePath: string } | null {
  if (!objectName) return null;
  const match = /^users\/([^/]+)\/uploads\/([^/]+)\.jpe?g$/i.exec(objectName);
  if (!match) return null;
  const uid = match[1];
  const localId = match[2];
  if (!uid || !localId) return null;
  return {
    uid,
    localId,
    imagePath: `users/${uid}/uploads/${localId}.jpg`,
  };
}
