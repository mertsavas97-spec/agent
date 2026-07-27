# Audit Review — Otomatik YouTube Shorts Sistemi

**Tarih:** 2026-07-26  
**Girdi:** Kullanıcı “Proje Audit Raporu: Otomatik YouTube Shorts Kanalı Sistemi”  
**Amaç:** Anlama · eksik/yanlış yön · başlarsak gidişat özeti  
**İlgili:** `docs/research/2026-07-youtube-shorts-us-niches.md`

---

## 1. Verdict (tek cümle)

Audit, **MoneyPrinterTurbo + orchestration + offline ops** için iyi bir gereksinim iskeleti; fakat “tam otomatik finance Shorts → para” varsayımı Temmuz 2026 YPP/inauthentic politikası ve Shorts RPM gerçekliğiyle **çatışıyor** — önce pilot + insan QA, sonra 1 aylık unattended.

---

## 2. Raporda doğru olanlar

| Madde | Değerlendirme |
|-------|----------------|
| MPT native / non-native ayrımı | Doğru ve faydalı |
| Finance seçimi (soyut anlatım + stok B-roll) | MPT fit açısından doğru |
| SaaS review’in düşük repo uyumu | Doğru (ekran kaydı lazım) |
| Orchestration ihtiyaçları (cron, SEO meta, kill switch, SMS, analytics) | Mimari olarak doğru liste |
| Offline için 60 konu önceden sabitleme | Stabilite için doğru |
| Circuit breaker’ın üretimi de durdurması | Doğru tasarım |
| Nakit kalemler: Upload-Post + SMS | Doğru ayrım |
| Edge vs Whisper açık soru | Doğru trade-off |

---

## 3. Yanlış / yanıltıcı yönler

### 3.1 Puan tablosu aritmetik hatası

Kişisel Finans: YouTube 9 + Repo 9 → ortalama **9.0** olmalı; raporda **8.2** yazıyor. Ya yazım hatası ya da açıklanmamış ağırlıklı ortalama — netleştirilmeli.

### 3.2 “Tam otomatik / minimum insan” vs YPP 2026

YouTube Temmuz 2026 **inauthentic content** netliği:
- Generic / repetitive / mass-produced template → monetize olmaz  
- Finance’te **AI persona “insan uzman” gibi tavsiye** → monetize olmaz  

Audit “düşük insan emeği”yi başarı metriği yapıyor; asıl başarı metriği **YPP-eligible, orijinal eğitim içeriği** olmalı. 60 videoluk tamamen gözden geçirilmemiş unattended ay = yüksek soft-fail (0 reach) + YPP red riski.

### 3.3 “Yüksek CPM ülke hedefleme” yarım doğru

CPM’i belirleyen **izleyici coğrafyası**, içerik dili değil. EN yazmak NO/CH getirmez. US çekmek için **US-spesifik konular** şart (Roth, 401(k), HYSA, FICO, student loans…). Audit’te bu içerik kilidi zayıf.

### 3.4 Günde 2 Short varsayılanı agresif

Önceki araştırma: steady **1/gün**; 2 ancak retention iyiyse. Offline ayda 2/gün × 30 = 60, kalite/QA olmadan spam sinyali. Pilot fazında **1/gün** önerilir.

### 3.5 Shorts ads beklentisi örtük abartı

Finance “yüksek CPM” long-form/advertiser dilinden geliyor. Shorts ads genelde **$0.03–$0.15/1K** (US-heavy finance üst bant). 10M view/90g YPP eşiği + düşük Shorts RPM → ilk aylarda ads ile “sürdürülebilir gelir” gerçekçi değil. Affiliate/funnel audit’te yok.

### 3.6 Ban tespiti ≠ reach ölümü

Circuit breaker kanal ban/upload fail için iyi. Ama sık senaryo: kanal açık, upload OK, feed’de **throttling / 0 impression**. Data API bunu net “ban” diye vermez. Soft metrics (ardışık N videoda impressions≈0) alarm olarak eklenmeli; otomatik STOP eşiği dikkatli seçilmeli.

### 3.7 SEO “tag” over-weight

Shorts’ta title + hook + retention asıl keşif; tag’ler düşük etki. Meta pipeline’da title/description öncelik, tag secondary.

### 3.8 Offline ay — kritik teknik boşluklar (audit’te zayıf)

| Risk | Neden kritik |
|------|----------------|
| OAuth refresh token expiry / reauth | Upload-Post veya YT API 30 günde düşerse ayın ortası ölür |
| API key rotate / billing hold | GCP/Azure kredi tutarsızlığı |
| Pexels/Pixabay rate limit / outage | Üretim zinciri kırılır |
| Edge TTS datacenter IP blok | VM’den TTS fail |
| VM disk dolması (video birikimi) | Kill olmadan crash |
| Zaman dilimi / DST | Cron drift |

### 3.9 Upload-Post tek bağımlılık

Native MPT yolu Upload-Post. Alternatif: doğrudan YouTube Data API `videos.insert` (OAuth sizde). Offline ayda **reauth_required** izlenmeli; Upload-Post “ban”ı her zaman net raporlamayabilir → YT Data API ile çapraz kontrol doğru (audit §10.2 ile uyumlu, zorunlu yapılmalı).

### 3.10 Eksik ürün/compliance maddeleri

Audit’te yok / yetersiz:
- Synthetic/altered content disclosure  
- “Educational, not financial advice” disclaimer  
- Mikro-niche kilidi (generic “money tips” vs US personal finance slice)  
- İnsan QA kapısı (en az konu havuzu + ilk 10 render)  
- Müzik: lisanslı track RPM kesintisi  
- Brand kit (font/color/hook style) — template spam görünümünü kırar  
- ÇözBil monorepo vs ayrı repo kararı  

---

## 4. Mimari okuma (audit akışı)

```
[Topic pool JSON] → MPT (script/visual/TTS/subs/BGM)
  → Meta LLM (title/desc)
  → Preflight (kill switch + quotas)
  → Upload (spaced)
  → Log + SMS digest
  → Weekly Analytics pull
```

Bu akış **doğru**. Eksik katmanlar:
1. **Quality gate** (script diversity score / banned-phrase / advice-tone check)  
2. **Soft-health monitor** (impressions, AVD)  
3. **Secret/token watchdog**  
4. **Pilot mode** (manuel approve opsiyonu ilk 14 gün)

---

## 5. Başlarsak nasıl ilerleriz (önerilen fazlar)

> Audit’in dediği gibi: önce kapsam kilidi, sonra implementasyon planı, sonra kod.

### Faz 0 — Karar kilidi (1 oturum)
- Mikro-niche: örn. “US personal finance explainers (no advice)”  
- Tempo: pilot **1 Short/gün**; offline ay max **1–2** (kaliteye bağlı)  
- Repo: ayrı proje (ÇözBil’den izole) önerilir  
- Upload yolu: Upload-Post vs native YT API  
- TTS: offline ay için **Edge (ücretsiz) + Azure fallback**  
- İnsan QA: 60 konunun hepsi önceden review (offline öncesi zorunlu)

### Faz 1 — Spec (Spec Kit veya kısa PRD)
- Constitution-lite: YPP/inauthentic kuralları, disclosure, disclaimer  
- `spec.md`: actor flows, kill switch states, SMS schema  
- `plan.md`: VM (GCP), MPT deploy, orchestrator (Python/cron veya systemd timer)  
- `tasks.md`: implementasyon checklist  

### Faz 2 — Pilot (online, 14 gün, insan gözü)
- MPT + 14 konu  
- Günde 1 upload, 4+ saat aralıklı değil tek slot OK  
- Analytics: US%, AVD, views  
- Kill switch + SMS smoke test  
- **Go/No-Go** → offline aya çıkılır mı?

### Faz 3 — Offline-ready hardening
- 60 topic + meta ön-üretim (veya video’ları da önceden render edip sadece schedule — daha güvenli)  
- Token/quota preflight checklist  
- Disk cleanup, reboot persistence, retry/backoff  
- Soft-health SMS (ban değil, “views collapsed”)  

### Faz 4 — Unattended month
- Circuit breaker armed  
- Günlük SMS: produced/uploaded/errors  
- Haftalık SMS: views/subs delta  
- Dönüşte: YPP yol haritası + affiliate stack  

**Alternatif daha güvenli offline:** Videoları önceden render et; ay boyunca sadece **scheduled publish** + health check. LLM/TTS/Pexels runtime riskini sıfırlar.

---

## 6. Audit §10 açık noktalara kısa cevap

| # | Öneri |
|---|--------|
| 1 OAuth/Analytics | GCP projede YT Data + YouTube Analytics; refresh token offline vault; kota dokümante |
| 2 Upload-Post ban sinyali | Varsayma; **YT channels.list / videos.list** ile doğrula |
| 3 Whisper vs Edge | Offline ay: **Edge subtitle** default; Whisper sadece kalite pilotunda |
| 4 Uptime SLA | “Best effort” tek VM; reboot auto-heal yeterli; multi-AZ gerekmez ilk faz |
| 5 SMS | TR numara → Netgsm/İletimerkezi genelde Twilio’dan ucuz; Twilio global backup |
| 6 60 konu QA | **Tam otomatik kalite yok** — offline öncesi insan pass zorunlu |

---

## 7. Sonuç

- Audit **implementasyona hazır bir brief** olarak kullanılabilir.  
- En büyük düzeltme: otomasyonu “zero human” değil **“human-designed pool + machine execution + policy-safe framing”** diye yeniden tanımlamak.  
- Finance + MPT + Tier-1 EN doğru yön; tempo, YPP, soft-ban, OAuth, ads beklentisi düzeltilmeli.  
- Sonraki adım kullanıcı onayıyla: **Faz 0 kararları** → kısa Spec → Pilot plan.
