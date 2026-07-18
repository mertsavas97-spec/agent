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
| **Interstitial** (tam ekran) | Günde **en fazla 1**: günün **3. başarılı çözümünden sonra**, kullanıcı çözüm ekranından **çıkarken** (doğal mola) | Çözüm okurken; kamera/analiz sırasında; her soruda; onboarding |
| **Rewarded** (ödüllü, isteğe bağlı) | Günlük 5 hak bitince paywall’da: “Reklam izle · +1 soru” | Zorunlu izletme; çözüm ortasında dayatma |

### Frekans tavanı

- Banner: tab’larda sürekli (Premium’da yok).
- Interstitial: **≤1 / İstanbul günü** (oturum başına da ≤1).
- Rewarded ekstra hak: **≤2 / İstanbul günü** (Premium’u öldürmemek için).

### “3 haktan sonra zorunlu reklam izle” — **hayır**

Erken sürtünme “ceza” gibi algılanır; haklar 4–5 hâlâ ücretsiz kalmalı.  
3. çözümeden sonra gelen **tek** interstitial çıkış anındadır (izleme zorunlu rewarded değil; kapatılabilir tam ekran AdMob formatı).  
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
