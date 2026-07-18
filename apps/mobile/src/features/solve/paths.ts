/** Storage path convention — never log raw image bytes. */
export function buildUploadPath(uid: string, localId: string): string {
  return `users/${uid}/uploads/${localId}.jpg`;
}
