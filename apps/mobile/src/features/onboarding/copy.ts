import type { ExamType } from '@/src/lib/api/types';

export const ONBOARDING_STEPS = [
  {
    title: 'Fotoğrafla çöz',
    body: 'Sorunun fotoğrafını çek veya galeriden seç; ÇözBil adım adım anlatsın.',
  },
  {
    title: 'Adım adım anlatır',
    body: 'Ezber değil anlayış: her adımı sade Türkçe ile görürsün. Anlamadın mı, tekrar sor.',
  },
  {
    title: 'Hangi sınava hazırlanıyorsun?',
    body: 'LGS, YGS ve KPSS aktif. Seçimin çözüm dilini ve konu kataloğunu belirler.',
  },
] as const;

export const EXAM_OPTIONS: { id: ExamType; label: string; hint: string }[] = [
  { id: 'lgs', label: 'LGS', hint: 'Lise giriş' },
  { id: 'ygs', label: 'YGS', hint: 'Yükseköğretime geçiş' },
  { id: 'kpss', label: 'KPSS', hint: 'Kamu personeli' },
];

/** Taslak KVKK metinleri — mağaza öncesi hukuki onay TODO(legal). */
export const LEGAL_COPY = {
  minorParental:
    '13–17 yaş için veli bilgilendirmesi gerekir. Devam ederek kişisel verilerin sınav çözüm hizmeti için işlenmesine ve velinin bu kullanımı bilmesine onay vermiş olursun. Detaylı aydınlatma metni yakında.',
  adultStandard:
    'Devam ederek ad, sınav tercihi ve soru görsellerinin çözüm üretmek için işlenmesine onay verirsin. Veriler hesabına bağlı saklanır; dilediğinde silme talebi oluşturabilirsin.',
} as const;
