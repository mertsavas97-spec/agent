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

/** TODO(legal): Replace with counsel-approved KVKK / parental consent text before store. */
export const LEGAL_COPY = {
  minorParental:
    'TODO(legal): Reşit olmayan kullanıcılar için veli aydınlatma ve onay metni buraya gelecek. Devam ederek taslak onayı kabul etmiş sayılırsın.',
  adultStandard:
    'TODO(legal): Standart KVKK aydınlatma ve açık rıza metni buraya gelecek. Devam ederek taslak onayı kabul etmiş sayılırsın.',
} as const;
