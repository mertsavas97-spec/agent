# Türkiye Android App — Yeni Fikir Araştırma Özeti

**Tarih:** 2026-07-16  
**Kapsam:** TaksitDefter dışı, Türkiye odaklı, düşük maliyet, gelir ihtimali yüksek Android app  
**Kaynaklar:** marketingskills (pricing, offers/value equation, marketing-council, competitor-profiling, free-tools, customer-research), Adjust TR 2025, AppBrain Education Top Grossing TR (2026-07-15), Similarweb Top Grossing TR, yerli rakiplerin public siteleri  
**Not:** Alirezarezvani product-strategist bundle bu ortamda kurulu değil; product-team CLAUDE.md + OKR/RICE çerçeveleri remote referans alındı.

---

## Tek cümlelik karar

**Yeni proje olarak “Türkiye resmi işlem / hayat olayı rehberi + AI” (çalışma adı: İşlemRehberi) yap.**  
İkinci seçenek: **ikinci el araç alım asistanı**. Üçüncü: **tek sınava dar wedge (KPSS-AGS veya ehliyet) AI koç**.

TaksitDefter’e dokunma; onu ayrı ürün olarak tut.

---

## Skor kartı (1–10, ağırlıklı)

| Kriter (ağırlık) | A · İşlemRehberi | B · AraçAl Asistanı | C · Sınav Wedge (KPSS/Ehliyet) | D · Düğün bütçe | E · Site sakini app |
|------------------|------------------|--------------------|------------------------------|-----------------|---------------------|
| Açlık / acı (20%) | 9 | 9 | 8 | 7 | 6 |
| TR moatı (15%) | 10 | 9 | 8 | 8 | 7 |
| Solo / düşük maliyet (15%) | 8 | 7 | 7 | 6 | 4 |
| Monetizasyon (15%) | 8 | 8 | 9 | 5 | 5 |
| Rekabet boşluğu (15%) | 8 | 7 | 4 | 3 | 3 |
| GCP kredi kaldıracı (10%) | 10 | 8 | 9 | 5 | 4 |
| ASO / organik (10%) | 8 | 8 | 9 | 6 | 5 |
| **Ağırlıklı toplam** | **8.7** | **8.1** | **7.5** | **5.7** | **4.9** |

---

## Neden A kazanıyor?

1. **Starving crowd (Halbert):** Herkes e-Devlet, nüfus, SGK, tapu, araç satış, evlilik, işe girişte “hangi belge, hangi sıra?” diye boğuluyor. ChatGPT var ama TR prosedüründe güven + adım listesi zayıf.
2. **Positioning (Dunford):** Alternatif = Google + WhatsApp’ta sormak + e-Devlet’te kaybolmak. Kategori: *hayat olayı işlem rehberi* — avukat AI (EvrakAI) değil, site yönetimi (Apsiyon) değil, bütçe (TaksitDefter) değil.
3. **Value equation (Hormozi):** Dream outcome = “işi tek seferde, eksik belgesiz bitirmek”; effort ↓ (checklist + hatırlatma); likelihood ↑ (TR’ye özel şablonlar).
4. **Google Startup kredisi:** Gemini ile belge OCR, “bu evrak nedir?”, adım üretimi — UA reklamı değil, ürün maliyeti.
5. **Fiyat hassas TR:** ₺49–99/ay veya işlem paketi; Mirava verisine göre TR abonelikler US’nin ~%29’u seviyesinde — hacim + düşük fiyat.

---

## Ne yapma (kısa)

| Fikir | Neden ele |
|-------|-----------|
| Hypercasual / mid-core oyun | UA + liveops sermayesi; kredi reklamı karşılamaz |
| Genel AI chatbot | ChatGPT/Gemini indirme lideri |
| Taksit/abonelik/bütçe | TaksitDefter kanibalizasyonu |
| 101 Okey klonu | Zynga/Peak dominasyonu |
| Tam site yönetim SaaS | Apsiyon/Konsiyon B2B satış gerektirir |
| Düğün marketplace | Düğün.com 50k+ firma |

---

## Rapor indeksi

| Dosya | İçerik |
|-------|--------|
| [01-idea-islemrehberi.md](./01-idea-islemrehberi.md) | Birincil fikir — tam brief |
| [02-idea-aracal.md](./02-idea-aracal.md) | İkinci fikir — araç alım asistanı |
| [03-idea-sinavwedge.md](./03-idea-sinavwedge.md) | Üçüncü fikir — sınav wedge |
| [04-rejected-ideas.md](./04-rejected-ideas.md) | Ele alınan fikirler + gerekçe |
| [05-market-context.md](./05-market-context.md) | TR pazar bağlamı ve kaynaklar |
| [../competitor-snapshots/2026-07-16/](../competitor-snapshots/2026-07-16/) | Rakip notları |

---

## Sonraki adım (Spec Kit)

Kullanıcı A’yı onaylarsa:

1. `/speckit-specify` — ürün tipi: **app** (oyun değil), kategori: Productivity/Lifestyle  
2. `/speckit-clarify` — hukuki disclaimer, içerik kaynağı, MVP hayat olayları listesi  
3. `/speckit-plan` → `/speckit-tasks` → implement  

**Öneri:** Önce A için 2 haftalık discovery (10 kullanıcı görüşmesi + 20 hayat olayı envanteri), sonra MVP.
