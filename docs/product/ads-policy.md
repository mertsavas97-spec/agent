# ÇözBil reklam politikası (MVP hazırlık)

**Karar tarihi:** 2026-07-18  
**Kaynaklar:** architect + growth/paywalls skill; marketing hızlı oturum.

## Temel kural

| Segment | Reklam |
|---------|--------|
| Premium (haftalık / aylık / yıllık — **üçü de**) | **Tamamen kapalı** (banner, interstitial, rewarded) |
| Ücretsiz | Aşağıdaki matris |

“Reklamsız” Premium vaadi tüm planlarda geçerlidir (`docs/product/pricing-policy.md`).

## Ücretsiz matris

| Format | Ne zaman | Ne zaman değil |
|--------|----------|----------------|
| **Banner** (küçük, alt şerit) | Ana Sayfa / Geçmiş / İstatistik / Profil tab shell | Çözüm akışı (`/solve`), Analyzing, SolutionScreen, onboarding |
| **Interstitial** (tam ekran) | Ücretsiz: başarılı çözüm ekranından **çıkarken** (doğal mola), günde en fazla günlük free solve bütçesi kadar (≤5). Premium: yok | Çözüm okurken; kamera/analiz sırasında; onboarding |
| **Rewarded** (ödüllü) | (1) Günlük 5 hak bitince paywall’da: “Reklam izle · +1 soru”. (2) **Her çoklu soru batch** açılışında free’de **1 rewarded zorunlu** (Premium muaf; batch yine ≤5) | Çözüm okurken dayatma; premium’a reklam |

### Frekans tavanı

- Banner: tab’larda sürekli (Premium’da yok).
- Interstitial: **≤5 / İstanbul günü**, yalnızca çözüm çıkışında (`atNaturalBreak`).
- Rewarded ekstra hak: **≤2 / İstanbul günü** (Premium’u öldürmemek için).
- Rewarded çoklu batch: **her açılışta 1** (günlük unlock tavanı ayrıca `rewardedMultiBatchMaxPerIstanbulDay`).

### Çözüm bitiminde tam ekran

Ücretsiz kullanıcı çözüm ekranından çıkınca (Başka soru / Done) stub veya AdMob interstitial çalışır. Premium’da tamamen kapalı.  
Ek hak için reklam **yalnızca seçmeli rewarded**.

### Rewarded × paywall

Paywall’ı değiştirmez: birincil CTA Premium; ikincil “+1 soru için reklam”.  
Rewarded, sınırsız / reklamsız abonelik vaadinin yerine geçmez.

## Teknik yol (Expo)

- Hedef SDK: `react-native-google-mobile-ads` (EAS / dev client; Expo Go’da native yok).
- MVP kodda: `apps/mobile/src/features/ads/` — **policy + stub engine**; gerçek AdMob unit id’leri env ile.
- Test unit id kullan; prod id’ler git’e yazılmaz.
- Çocuk / LGS: AdMob child-directed / under-age ayarları Play + AdMob konsolunda (US7 profil yaş bandı ile hizala).

## Risk

Çözüm okurken agresif reklam → öğrenme bölünür, mağaza yorumu ve churn artar; bu yüzden solve yüzeyinde ads **yasak**.
