/**
 * Child-safe, neutral copy — security-reviewer / guardian constraints.
 * Never shame the user; never imply wrongdoing in moderation rejects.
 */
export const SAFETY_MESSAGES = {
  moderationReject:
    'Bu görselde bir soru tespit edemedik, lütfen net bir soru fotoğrafı çekin',
  notAQuestion:
    'Bu görselde çözülebilir bir soru bulamadık. Lütfen sorunun tamamını net şekilde fotoğrafla.',
  unsupportedType:
    'Bu soru tipi henüz desteklenmiyor. Metin veya işlem ağırlıklı bir soru dene.',
  blurry:
    'Fotoğraf biraz bulanık görünüyor. Daha net bir çekim dener misin?',
  rateLimited:
    'Şu an çok fazla istek var. Biraz bekleyip tekrar dene.',
  accountRestricted:
    'Geçici olarak yeni soru gönderimi kapalı. Lütfen daha sonra tekrar dene.',
  transparency:
    'AI tarafından üretilmiştir, kontrol etmeni öneririz.',
  quotaExceeded:
    'Bugünkü ücretsiz soru hakkın bitti. Sınırsız çözüm için Premium’a geçebilirsin.',
  permissionCamera:
    'Kamera izni olmadan fotoğraf çekemiyoruz. Ayarlardan izin verebilirsin.',
  permissionLibrary:
    'Galeri izni olmadan görsel seçemiyoruz. Ayarlardan izin verebilirsin.',
} as const;

/** Logging policy: only Storage paths / attempt IDs — never base64/image buffers. */
export const LOGGING_POLICY = {
  allowImageBytesInLogs: false,
  allowImagePaths: true,
  allowAttemptIds: true,
} as const;
