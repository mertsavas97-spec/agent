/** Paywall / Premium copy — marketingskills paywalls + copywriting + offers (TR). */

export const PAYWALL_COPY = {
  brand: 'ÇözBil Premium',
  headlineQuota: 'Günlük ücretsiz hakkın bitti',
  headlineBrowse: 'Sınavsız tempo, reklamsız odak',
  supportQuota:
    'Az önce çözüme dokundun. Haftalık girişle dene veya yıllıkta %32 indirimle sınırsız Premium’a geç.',
  supportBrowse:
    'Sınırsız çözüm, reklamsız alan ve kişisel AI özeti — yıllıkta %32 indirim.',
  cta: 'Hemen Başla',
  ctaYearly: 'Yıllıkla Başla · en avantajlı',
  rewardedCta: 'Reklam izle · +1 soru',
  dismiss: 'Şimdilik ücretsiz devam',
  restore: 'Satın alımları geri yükle',
  legalHint:
    'Haftalık plan ücretli giriş teklifidir (ücretsiz deneme değildir). Abonelik otomatik yenilenir; istediğin zaman iptal edebilirsin.',
  benefits: [
    {
      id: 'unlimited',
      title: 'Sınırsız soru çözümü',
      body: 'Günlük 5 hak sınırına takılma — kitap, defter, test; hepsi açık.',
      icon: { ios: 'infinity', android: 'all_inclusive', web: 'all_inclusive' },
    },
    {
      id: 'ads',
      title: 'Reklamsız çalışma alanı',
      body: 'Banner ve ara reklamlar kapalı; odak bozulmasın.',
      icon: { ios: 'eye.slash.fill', android: 'visibility_off', web: 'visibility_off' },
    },
    {
      id: 'analysis',
      title: 'Kişisel AI analiz özeti',
      body: 'Zayıf konular ve seri — sınavına özel geri bildirim.',
      icon: { ios: 'chart.line.uptrend.xyaxis', android: 'insights', web: 'insights' },
    },
    {
      id: 'multi',
      title: 'Çoklu soru önceliği',
      body: 'Galeriden toplu seçimde daha akıcı hak yönetimi.',
      icon: { ios: 'square.stack.3d.up.fill', android: 'layers', web: 'layers' },
    },
  ] as const,
  socialProof: 'LGS · YGS · KPSS · Ehliyet — fotoğraftan adım adım çözüm.',
  guarantee: 'Beğenmezsen iptal et — Play aboneliğinden yönetilir.',
} as const;
