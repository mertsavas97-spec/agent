/** Legal / KVKK copy for MVP 1.0 — product draft; replace with counsel-approved text when ready. */

export const LEGAL_DOCS = {
  privacy: {
    title: 'Gizlilik politikası',
    updated: '2026-07-21',
    sections: [
      {
        heading: 'Topladığımız veriler',
        body: 'Hesap kimliği (anonim Firebase UID), seçtiğin sınav, yaş bandı / veli bilgilendirme onayı (gerektiğinde), soru görselleri, çözüm adımları, kullanım istatistikleri ve bildirim tercihi.',
      },
      {
        heading: 'Amaç',
        body: 'Fotoğraftan soru çözümü üretmek, konu anlatımı sunmak, kota/abonelik yönetmek ve (izin verirsen) cihaz içi hatırlatma bildirimleri zamanlamak.',
      },
      {
        heading: 'Bildirimler',
        body: 'Hatırlatmalar sunucu bildirimi (FCM) olmadan, cihazında yerel olarak zamanlanır. Android 13+ için bildirim izni istenir; tercihler Ayarlar’dan kapatılabilir.',
      },
      {
        heading: 'Saklama',
        body: 'Veriler hesabına bağlı olarak Google Cloud / Firebase altyapısında saklanır. Profilinden silme talebi oluşturabilir; ardından kalıcı silme hesabını ve yüklerini kaldırır.',
      },
      {
        heading: 'Üçüncü taraflar',
        body: 'Firebase (kimlik, depolama), OCR/çözüm altyapısı ve Google Play Billing. Ücretsiz planda reklam SDK’ları politikaya uygun şekilde kullanılabilir.',
      },
      {
        heading: 'Hakların',
        body: 'KVKK kapsamında erişim, düzeltme, silme ve itiraz hakların vardır. Taleplerini profil → veri silme / kalıcı silme veya destek e-postasından iletebilirsin.',
      },
    ],
  },
  terms: {
    title: 'Kullanım koşulları',
    updated: '2026-07-21',
    sections: [
      {
        heading: 'Hizmet',
        body: 'ÇözBil; LGS, YGS/YKS, KPSS ve Ehliyet paketlerinde fotoğraftan adım adım çözüm ve konu anlatımı sunar. Çözümler yardımcı niteliktedir; resmi sınav sonucu değildir.',
      },
      {
        heading: 'Hesap ve kota',
        body: 'Ücretsiz planda günlük çözüm hakkı sınırlıdır (İstanbul günü). Premium abonelik sınırsız çözüm ve reklamsız deneyim sağlar (adil kullanım).',
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
    updated: '2026-07-21',
    sections: [
      {
        heading: 'Veri sorumlusu',
        body: 'ÇözBil uygulaması kapsamında kişisel verilerin işlenme amacı sınav hazırlık hizmetinin sunulmasıdır. Destek iletişimi uygulama ayarlarında ve gizlilik sayfasında yer alır.',
      },
      {
        heading: 'İşlenen veriler',
        body: 'Kimlik (anonim UID), sınav tercihi, yaş bandı / veli bilgilendirme onayı (gerektiğinde), soru görselleri, çözüm kayıtları, abonelik durumu, bildirim tercihleri.',
      },
      {
        heading: 'Hukuki sebep',
        body: 'Sözleşmenin ifası, meşru menfaat ve açık rıza (bildirimler).',
      },
      {
        heading: '13 yaş altı ve 13–17',
        body: 'Bu yaş bantlarında veli bilgilendirmesi ve onay kaydı onboarding sırasında alınır. Yaş bandı sınav türünden bağımsız seçilir.',
      },
      {
        heading: 'Haklar ve silme',
        body: 'KVKK md. 11 haklarını kullanmak ve hesap silme talebi için Profil → Veri silme talebi adımını kullanabilirsin.',
      },
    ],
  },
} as const;

export type LegalDocId = keyof typeof LEGAL_DOCS;
