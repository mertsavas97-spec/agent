# [ÇözBil] — MVP 1.0 Ürün Spesifikasyonu

> Not: Bu doküman, ürün fikri geliştirme sürecinde alınan tüm kararların
> derlenmiş halidir. Spec Kit yansıması:
> `specs/001-product-definition/` (kilit) + `specs/002-cozbil-mvp/` (MVP).
> Çakışmada constitution + Spec Kit `spec.md` baskındır.

---

## 1. Proje Özeti

Türkiye'deki LGS öğrencilerine yönelik, fotoğrafla soru çözüp adım adım Türkçe açıklama sunan AI destekli bir eğitim uygulaması. Hedef kitle 13-15 yaş öğrenciler ve onların velileri. Konumlandırma: "sadece çözen" değil, zamanla "eksiği tespit edip kapatan" bir çalışma arkadaşı.

**Platform:** Android öncelikli (React Native / Expo), Türkiye pazarına özel.
**Kaynak:** Google Startup Kredisi (AI dahil) kullanılacak — bu nedenle AI-ağır (vision, prompt-tabanlı) özellikler maliyet açısından MVP'de rahatça denenebilir.

**Çalışma adı:** ÇözBil (final mağaza/alan adı TBD).

---

## 2. Problem & Fırsat

- Öğrenciler soruya takıldığında hızlı, doğru, adım adım Türkçe çözüm bulamıyor; özel ders/dershane pahalı ve yavaş.
- Global AI araçları (ChatGPT, Photomath, Gemini app) Türk müfredatına (MEB, LGS formatı) özel değil, terminoloji ve soru tipi uyumu zayıf.
- Var olan Türkçe rakipler bu boşluğu dolduruyor ama hepsi **aynı özellik setiyle** yarışıyor — farklılaşma "veli tarafı" ve "dar segment odaklılık" üzerinden mümkün.

---

## 3. Rakip Analizi

| Uygulama | Model | Fiyat | Güçlü Yön | Zayıf Yön |
|---|---|---|---|---|
| **Kunduz** | İnsan eğitmen ağı (AI değil) | Aylık 49,99 TL'den başlıyor | Köklü marka, güven | Yavaş (ort. 15 dk), maliyetli iş modeli |
| **Shifu AI** | AI, fotoğrafla çöz + çalışma planı | Abonelik (freemium) | Çok ders desteği, el yazısı tanıma | Genel amaçlı, farklılaşma zayıf |
| **Taktik** | AI + güçlü gamification (rütbe, madalya, Arena) | Abonelik (freemium) | Engagement/motivasyon mekanikleri güçlü | Kalabalık özellik seti, karmaşık UX riski |
| **Koç'a Sor** | AI, foto/ses/yazı ile soru sorma | Abonelik (freemium) | "En çok kullanılan" iddiası, çoklu giriş yöntemi | Genel amaçlı |
| **DigiKamp** | AI, adaptif soru sistemi | Abonelik (freemium) | Kişiselleştirilmiş çalışma planı | Yeni, marka bilinirliği düşük |
| **Sorun Kalmasın** | Topluluk (kullanıcılar birbirini cevaplıyor) | Ücretsiz + kredi sistemi | Düşük maliyet | Kalite/hız garantisi yok |
| **Çözücü** | Video çözümlü, uzman eğitmen | Ücretsiz + IAP | Video format | AI değil, ölçeklenmiyor |

**Sonuç:** Pazar kalabalık, genel "soru çözücü" konumuyla girmek zayıf bir strateji. Farklılaşma noktaları:
1. Dar segment (yalnızca LGS, en azından MVP'de).
2. Veli tarafına güçlü, otomatik haftalık rapor (rakiplerin zayıf olduğu alan) — ürün vaadi; teslim 1.1.
3. Şeffaf doğruluk iletişimi ve dar kapsamda yüksek kalite vurgusu.

---

## 4. Hedef Kitle & Konumlandırma

- **Birincil kullanıcı:** LGS'ye hazırlanan 13-15 yaş öğrenci.
- **Ödeme yapan kullanıcı (genelde):** Veli.
- **Konumlandırma cümlesi:** "Türkiye'nin sadece LGS'ye özel AI çalışma arkadaşı — çözer, anlatır, eksiğini veliye raporlar."

---

## 5. Marka Adı

Çalışma adı: **ÇözBil**. Final isim için mağaza/alan adı müsaitliği kontrol edilecek. Tercih: bağımsız/marka gibi duran, maskotlaştırılabilir kısa isim.

---

## 6. Teknoloji Yığını

- **Frontend:** React Native (Expo ile başlanacak, gerekirse bare workflow'a geçiş)
- **Kamera/görsel:** `expo-image-picker` / `react-native-vision-camera`
- **AI/Vision:** Google Gemini Vision API (Google Startup Kredisi kapsamında)
- **Backend:** Firebase (Auth, Firestore, Cloud Functions) — MVP için düşük maliyetli, ölçeklenebilir
- **Görsel moderasyon:** Google Cloud Vision SafeSearch API (API çağrısından önce ön filtre)
- **Bildirimler:** Firebase Cloud Messaging (push) + e-posta (veli raporu için — 1.1)

---

## 7. Ürün Akışı / Pipeline (Soru Çözme)

1. Kullanıcı fotoğraf çeker → client-side hafif ön işleme (kırpma/kontrast).
2. **Moderasyon katmanı:** SafeSearch API ile görsel kontrol edilir. Şüpheli/uygunsuz içerik tespit edilirse Gemini'ye hiç gönderilmeden reddedilir, nötr bir mesaj gösterilir.
3. **Dedup/cache kontrolü:** Perceptual hash ile aynı soru daha önce sorulmuş mu kontrol edilir; sorulmuşsa kayıtlı cevap direkt döner.
4. Görsel + ders-özel sistem promptu Gemini Vision API'ye gönderilir.
5. **Konu sınıflandırma:** MEB müfredat konu listesinden bir konuya etiketlenir.
6. Model çözümü değilse kullanıcı nazikçe uyarılır, kredi düşülmez.
7. Sonuç adım adım gösterilir. "Anlamadım, tekrar açıkla" aynı context ile ek açıklama ister.
8. Tüm etkileşim veritabanına kaydedilir.

### Doğruluk Notu

- %100 hatasız çözüm garanti edilemez. MVP'de diyagram/geometri kapsam dışı.
- Her çözümün altında şeffaflık notu zorunlu.
- Self-consistency 1.2+ değerlendirmesi.

---

## 8. MVP 1.0 Kapsamı

### Dahil Olanlar

- Fotoğrafla soru çözme (matematik öncelikli, LGS Türkçe ikinci)
- Adım adım Türkçe çözüm
- Takip sorusu ("anlamadım, tekrar açıkla")
- Soru geçmişi (ders/konu filtre)
- Konu bazlı basit zayıflık haritası
- Günlük/haftalık ilerleme + streak
- Onboarding (3 ekran) + sınav türü (yalnız LGS aktif)
- Paywall / abonelik
- Görsel moderasyon + rate limiting

### Dahil Olmayanlar (1.1 / 1.2)

- Diyagram/şekil (geometri)
- AI özgün soru üretimi + pratik session
- Veli hesabı / haftalık otomatik rapor
- İleri gamification
- Spaced repetition

---

## 9. MVP Sonrası Yol Haritası

**1.1** — Veli hesabı + haftalık rapor, rozetler, uyarı bildirimleri  
**1.2** — Özgün soru + pratik session, basit geometri render, spaced repetition

---

## 10. Kötüye Kullanım & Güvenlik

SafeSearch ön filtre; soru değilse çözüm yok; kullanıcı bazlı limitler; yüksek geçersiz görsel oranı → kısıtlama; nötr mesaj dili; KVKK/veli onayı akışı MVP'den itibaren tasarlanır (hukuki danışmanla netleştirilir).

---

## 11. Tasarım Yönü

- Ton: güven verici, enerjik ama sakin
- Stil: modern, temiz, kart tabanlı; Manrope/Poppins tarzı
- Ana: `#1E1B4B`–`#312E81`; vurgu: `#F59E0B`–`#FBBF24`; zemin: `#F8FAFC`
- Tab bar: Ana Sayfa / Geçmiş / İlerleme / Profil

---

## 12. Ekran Listesi

1. App ikonu  
2–4. Onboarding 1–3 (sınav seçimi)  
5. Ana ekran  
6. Kamera/çözüm yükleme  
7. Çözüm sonucu  
8. İlerleme/analiz  
9. Paywall  

---

## 13–16. Veri, AI pratik, monetizasyon, riskler

Öğrenci tarafı zayıflık/ilerleme MVP'de; veli tarafı 1.1. Freemium: günlük 5 ücretsiz (Spec Kit varsayılanı), aylık ~49 TL vitrin. Marka finali ve KVKK hukuku açık notlar.

---

## 17. Sonraki Adımlar (owner)

- [ ] Marka adını kesinleştir, mağaza/alan adı müsaitliğini kontrol et
- [ ] Moodboard görselini designer'a ver
- [ ] MEB müfredat konu listesini statik veri olarak hazırla
- [ ] Sistem prompt şablonlarını yaz
- [ ] Firebase + Gemini entegrasyonunu iskelette kur (`tasks.md`)
- [ ] KVKK/veli onayı için hukuki danışmanlık al
