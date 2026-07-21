# Play Console — Data Safety formu (draft doldurma rehberi)

> Sprint 3 residual · 2026-07-21  
> Kaynak: app davranışı + `docs/legal/privacy-tr.html`  
> **Counsel / Play Console’a yapıştırırken owner doğrular.**

## App privacy / Data safety — özet cevaplar

| Soru | Önerilen cevap |
|------|----------------|
| Veri toplanıyor mu? | **Evet** |
| Veri paylaşılıyor mu? (üçüncü taraflarla satış dışı) | **Evet** — Firebase/Google Cloud (işleme), Play Billing |
| Şifreleme (transit) | **Evet** (HTTPS / TLS) |
| Kullanıcı silme talep edebilir mi? | **Evet** — Profil → veri silme talebi |
| Çocuklar | Education; LGS / yaş bandı; **hedef kitle çocuk olabilir** → family policy dikkat |

## Toplanan veri türleri (işaretle)

| Kategori | Örnek | Amaç | Zorunlu mu |
|----------|--------|------|------------|
| Kişisel kimlikler | Firebase UID (anon/hesap) | Hesap, kota, sync | App işlevi |
| Fotoğraflar / görseller | Soru fotoğrafı (UGC) | AI çözüm | App işlevi |
| App etkileşimi | Çözüm geçmişi, streak, sınav tercihi | İlerleme | App işlevi |
| Satın alma geçmişi | Play abonelik | Premium | App işlevi |
| Cihaz / diğer | OS seviyesinde crash/analytics (eklenirse) | Stabilite | Opsiyonel — SDK yoksa şimdilik **toplamıyoruz** işaretle |
| Konum | Hayır | — | — |
| İletişim | Destek e-postası (kullanıcı yazarsa) | Destek | Opsiyonel |

## Privacy Policy URL

```
https://cozbil-dev-f9583.web.app/privacy
```

(Hosting deploy sonrası doğrula; custom domain gelince güncelle.)

## Support email

`destek@cozbil.app` (henüz mailbox yoksa geçici olarak kişisel Gmail + “yakında resmi adres” notu — mailbox açılınca env güncelle.)

## Counsel notu

Uygulama metinleri **ürün taslağıdır**. Avukat onayı olmadan “counsel-approved” iddiası kullanılmaz.  
Onay sonrası: `docs/legal/privacy-tr.html` + Hosting’i güncelle; URL aynı kalabilir.
