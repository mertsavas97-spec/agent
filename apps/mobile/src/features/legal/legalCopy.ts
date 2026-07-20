/** Legal / KVKK copy for MVP 1.0 — product counsel drafts; replace with counsel-approved PDFs later. */

export const LEGAL_DOCS = {
  privacy: {
    title: 'Gizlilik politikası',
    updated: '2026-07-20',
    sections: [
      {
        heading: 'Topladığımız veriler',
        body: 'Hesap kimliği (anonim Firebase), seçtiğin sınav, soru görselleri, çözüm adımları, kullanım istatistikleri ve cihaz bildirim tercihi.',
      },
      {
        heading: 'Amaç',
        body: 'Fotoğraftan soru çözümü üretmek, konu anlatımı sunmak, kota/abonelik yönetmek ve (izin verirsen) hatırlatma bildirimleri göndermek.',
      },
      {
        heading: 'Saklama',
        body: 'Veriler hesabına bağlı olarak Google Cloud / Firebase altyapısında saklanır. Silme talebi profilinden oluşturulabilir.',
      },
      {
        heading: 'Üçüncü taraflar',
        body: 'Firebase (kimlik, depolama), OCR/çözüm altyapısı ve (ileride) Play Billing. Reklam SDK’ları ücretsiz planda gösterilebilir.',
      },
      {
        heading: 'Hakların',
        body: 'KVKK kapsamında erişim, düzeltme, silme ve itiraz hakların vardır. Taleplerini profil → veri silme veya destek kanalından iletebilirsin.',
      },
    ],
  },
  terms: {
    title: 'Kullanım koşulları',
    updated: '2026-07-20',
    sections: [
      {
        heading: 'Hizmet',
        body: 'ÇözBil; LGS, YGS/YKS, KPSS ve Ehliyet paketlerinde fotoğraftan adım adım çözüm ve konu anlatımı sunar. Çözümler yardımcı niteliktedir; resmi sınav sonucu değildir.',
      },
      {
        heading: 'Hesap ve kota',
        body: 'Ücretsiz planda günlük çözüm hakkı sınırlıdır (İstanbul günü). Premium abonelik sınırsız çözüm ve reklamsız deneyim sağlar.',
      },
      {
        heading: 'Abonelik',
        body: 'Premium Google Play üzerinden yenilenir. İptal ve iade Play politikalarına tabidir. Fiyatlar TRY cinsinden vitrinde gösterilir.',
      },
      {
        heading: 'Kabul edilemez kullanım',
        body: 'Zararlı, yasa dışı veya sınav güvenliğini ihlal eden içerik yüklenemez. Moderasyon sistemi uygun olmayan görselleri reddedebilir.',
      },
      {
        heading: 'Sorumluluk',
        body: 'Yapay zekâ çıktıları hata içerebilir. Cevabı kendi kaynaklarınla kontrol etmeni öneririz.',
      },
    ],
  },
  kvkk: {
    title: 'Aydınlatma metni (KVKK)',
    updated: '2026-07-20',
    sections: [
      {
        heading: 'Veri sorumlusu',
        body: 'ÇözBil uygulaması kapsamında kişisel verilerin işlenme amacı sınav hazırlık hizmetinin sunulmasıdır. Detaylı iletişim bilgisi yayın sürümünde güncellenir.',
      },
      {
        heading: 'İşlenen veriler',
        body: 'Kimlik (anonim UID), sınav tercihi, yaş bandı / veli bilgilendirme onayı (gerektiğinde), soru görselleri, çözüm kayıtları, abonelik durumu, bildirim tercihleri.',
      },
      {
        heading: 'Hukuki sebep',
        body: 'Sözleşmenin ifası, meşru menfaat ve açık rıza (bildirimler, pazarlama iletileri).',
      },
      {
        heading: '13–17 yaş',
        body: 'Bu yaş bandında veli bilgilendirmesi ve onay kaydı aranır. Onay onboarding sırasında alınır.',
      },
      {
        heading: 'Haklar ve silme',
        body: 'KVKK md. 11 haklarını kullanmak ve hesap silme talebi için Profil → Veri silme talebi adımını kullanabilirsin.',
      },
    ],
  },
} as const;

export type LegalDocId = keyof typeof LEGAL_DOCS;
