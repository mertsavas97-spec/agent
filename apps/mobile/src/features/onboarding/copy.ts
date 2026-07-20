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

/** Taslak KVKK metinleri — mağaza öncesi hukuki onay TODO(legal). */
export const LEGAL_COPY = {
  minorParental:
    '13–17 yaş için veli bilgilendirmesi gerekir. Devam ederek kişisel verilerin sınav çözüm hizmeti için işlenmesine ve velinin bu kullanımı bilmesine onay vermiş olursun. Detaylı aydınlatma metni yakında.',
  adultStandard:
    'Devam ederek ad, sınav tercihi ve soru görsellerinin çözüm üretmek için işlenmesine onay verirsin. Veriler hesabına bağlı saklanır; dilediğinde silme talebi oluşturabilirsin.',
} as const;
