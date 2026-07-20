# Sprint Raporu - 2026-07-20

## Kullanılan repo/skill setleri
- spec-kit: mevcut `.specify/` / ürün kararları referans alındı; yeni feature specify turu açılmadı (1.0 polish sprinti)
- superpowers: TDD ile pricing / paywall / profile / push / trCase testleri
- context7: bu turda yeni harici API eklenmedi (yerel entitlement + AsyncStorage)
- ui-ux-pro-max: ekran tutarlılığı (Poppins, eyebrow, CTA, loading/capture/tabs)
- marketingskills: `paywalls`, `pricing`, `copywriting`, `onboarding`, `offers`
- alirezarezvani bundle: kullanılmadı

## Kullanılan agent rolleri
- architect: Premium fiyatlandırma (39 / 14,90 / 279 %40), entitlement katmanı, settings/legal modülleri
- designer: TR-safe uppercase (`trUpper`/`Eyebrow`), paywall vitrini, ana sayfa Premium pill, profil kartı, onboarding tipografi
- executor: route’lar (premium, settings, legal), wire-up (home/profile/solve/bootstrap), test düzeltmeleri
- qa-tester: Jest suite (SolutionScreen mock dahil); targeted + full run
- security-reviewer: KVKK / gizlilik / koşullar metin iskeleti settings altında; push tercihler cihaz lokal

## Alınan kararlar
- Yıllık **279 TL** (%40 indirim vs 12×39); haftalık **14,90**; aylık **39** kilit
- CSS `textTransform: uppercase` yasak → `tr-TR` + sabit `TR_EYEBROW`
- Premium: profil / ayarlar / ana sayfa üst CTA / kota paywall
- Push: 6 kategori, her birinde ≥3 alternatif metin
- Entitlement: AsyncStorage lokal + sandbox; boot’ta hydrate

## Açık / bekleyen işler
- Google Play Billing gerçek satın alma / restore
- FCM/APNs push gönderim pipeline’ı (prefs + copy hazır)
- Hukuki metinlerin avukat onayı
- Sunucu entitlement senkronu (`syncSubscription`)
