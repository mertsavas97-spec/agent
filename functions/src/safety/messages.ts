/** Neutral user-facing copy — must match mobile safetyMessages intent. */
export const SAFETY_MESSAGES = {
  moderationReject:
    'Bu görselde bir soru tespit edemedik, lütfen net bir soru fotoğrafı çekin',
  notAQuestion:
    'Bu görselde çözülebilir bir soru bulamadık. Lütfen sorunun tamamını net şekilde fotoğrafla.',
  unsupportedType:
    'Bu soru tipi henüz desteklenmiyor. Metin veya işlem ağırlıklı bir soru dene.',
  transparency: 'AI tarafından üretilmiştir, kontrol etmeni öneririz.',
} as const;

export const LOGGING_POLICY = {
  allowImageBytesInLogs: false,
  allowImagePaths: true,
} as const;
