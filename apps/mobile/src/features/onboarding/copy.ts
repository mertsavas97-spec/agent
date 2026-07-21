import type { ExamType } from '@/src/lib/api/types';

export const ONBOARDING_STEPS = [
  {
    eyebrow: 'Fotoğraf',
    title: 'Fotoğrafla çöz',
    body: 'Sorunun fotoğrafını çek veya galeriden seç. ÇözBil adım adım anlatsın — ezber değil anlayış.',
    icon: 'camera.fill' as const,
  },
  {
    eyebrow: 'Anlatım',
    title: 'Adım adım anlatır',
    body: 'Her adım sade Türkçe. Anlamadığın yeri tekrar sor, konu anlatımına geç.',
    icon: 'list.bullet.rectangle.fill' as const,
  },
  {
    eyebrow: 'Mod seçimi',
    title: 'Hangi sınava hazırlanıyorsun?',
    body: 'LGS, YGS, KPSS ve Ehliyet aktif. Seçimin renk temasını, müfredatı ve çözüm dilini belirler.',
    icon: 'graduationcap.fill' as const,
  },
] as const;

export const EXAM_OPTIONS: { id: ExamType; label: string; hint: string }[] = [
  { id: 'lgs', label: 'LGS', hint: 'Lise giriş · 8. sınıf' },
  { id: 'ygs', label: 'YGS', hint: 'Üniversite · TYT–AYT' },
  { id: 'kpss', label: 'KPSS', hint: 'Kamu personeli' },
  { id: 'trafik', label: 'Ehliyet', hint: 'Ehliyet / MTS' },
];

/** Onboarding consent — age band seçimine göre (sınav türünden bağımsız). */
export const LEGAL_COPY = {
  under13:
    '13 yaş altı için veli onayı zorunludur. Devam ederek velinin bu kullanımı bilmesine ve kişisel verilerin sınav çözüm hizmeti için işlenmesine onay vermiş olursun. Tam metin: Ayarlar → Gizlilik / KVKK.',
  minor13to17:
    '13–17 yaş için veli bilgilendirmesi gerekir. Devam ederek velinin bu kullanımı bilmesine ve kişisel verilerin sınav çözüm hizmeti için işlenmesine onay vermiş olursun. Tam metin: Ayarlar → Gizlilik / KVKK.',
  /** @deprecated prefer under13 / minor13to17 */
  minorParental:
    '13 yaş altı veya 13–17 için veli bilgilendirmesi gerekir. Devam ederek kişisel verilerin sınav çözüm hizmeti için işlenmesine ve velinin bu kullanımı bilmesine onay vermiş olursun. Tam metin: Ayarlar → Gizlilik / KVKK veya yayınlanan gizlilik URL’si.',
  adultStandard:
    'Devam ederek sınav tercihi, yaş bandı ve soru görsellerinin çözüm üretmek için işlenmesine onay verirsin. Veriler hesabına bağlı saklanır; dilediğinde silme talebi oluşturabilirsin. Tam metin: Ayarlar → Gizlilik / KVKK.',
} as const;

export const AGE_BAND_OPTIONS = [
  {
    id: '18plus' as const,
    label: '18 yaş ve üzeri',
    hint: 'Standart KVKK onayı',
  },
  {
    id: '13to17' as const,
    label: '13–17 yaş',
    hint: 'Veli bilgilendirmesi gerekir',
  },
  {
    id: 'under13' as const,
    label: '13 yaş altı',
    hint: 'Veli onayı zorunlu',
  },
];

