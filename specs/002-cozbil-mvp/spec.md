# Feature Specification: ÇözBil MVP 1.0

**Feature Branch**: `002-cozbil-mvp`

**Created**: 2026-07-18

**Updated**: 2026-07-18 (multi-exam + moodboard)

**Status**: Draft → Clarified (defaults encoded)

**Input**: Owner product brief + MVP moodboard — multi-exam (LGS, YGS, KPSS, Ehliyet) AI photo question solver for Türkiye, Android-first MVP 1.0.

**Depends on**: `specs/001-product-definition/` (Locked)

**Design reference**: `docs/design/moodboard/`

## Positioning

Türkiye’nin sınav odaklı AI çalışma arkadaşı — **LGS, YGS, KPSS ve Ehliyet**; fotoğrafla çözer, adım adım Türkçe anlatır, konu eksiğini kullanıcıya gösterir. Veliye otomatik rapor 1.1 fazına ertelenir.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fotoğrafla soru çöz (Priority: P1) 🎯 MVP Core

Kullanıcı takıldığı sınav sorusunun fotoğrafını çeker veya galeriden seçer; uygulama adım adım, sade Türkçe bir çözüm gösterir. Çözümün altında AI şeffaflık notu vardır. Desteklenmeyen soru tipi (ör. karmaşık diyagram render gerektiren geometri çizimi) nazikçe reddedilir veya metin-odaklı açıklama ile sınırlı kalır; geçersiz/uygunsuz görselde nötr uyarı verilir ve ücretsiz hakkından düşülmez. Sistem promptları seçilen sınav türüne (`lgs` / `ygs` / `kpss` / `trafik`) göre ayarlanır.

**Why this priority**: Ürünün ana değeri; olmadan diğer özellikler anlamsız.

**Independent Test**: Test kullanıcısı metin/işlem ağırlıklı bir matematik sorusu fotoğrafıyla uçtan uca çözüm alır; uygunsuz görsel senaryosu ayrı doğrulanır. En az bir LGS ve bir YGS, KPSS veya Ehliyet hesabıyla smoke edilir.

**Acceptance Scenarios**:

1. **Given** giriş yapmış bir kullanıcı (herhangi bir sınav türü) ve kalan ücretsiz/abonelik hakkı, **When** net bir metin/işlem sorusu fotoğrafı gönderir, **Then** numaralı adımlar halinde Türkçe çözüm görür ve şeffaflık notunu okuyabilir.
2. **Given** kullanıcı bir görsel gönderir, **When** sistem soru olmadığını veya desteklenmeyen tipi tespit eder, **Then** nazik bir mesaj görür ve günlük ücretsiz hakkı azalmaz.
3. **Given** görsel uygunsuz içerik filtresine takılır, **When** yükleme tamamlanır, **Then** Gemini’ye gitmeden nötr red mesajı gösterilir (“Bu görselde bir soru tespit edemedik…”) ve hak düşülmez.
4. **Given** aynı soru daha önce çözülmüş ve önbellekte varsa, **When** kullanıcı yeniden gönderir, **Then** kayıtlı çözüm hızlıca döner.

---

### User Story 2 - Anlamadım, tekrar açıkla (Priority: P1)

Kullanıcı çözümü anlamadığında tek dokunuşla aynı soru bağlamında daha sade bir yeniden açıklama ister.

**Why this priority**: “Öğretmen gibi anlat” vaadinin minimum hali.

**Independent Test**: Bir çözüm ekranından “Anlamadım, tekrar açıkla” ile ikinci açıklama alınır.

**Acceptance Scenarios**:

1. **Given** bir çözüm sonucu ekranı açık, **When** kullanıcı “Anlamadım, tekrar açıkla”ya basar, **Then** aynı soru bağlamında ek/basitleştirilmiş açıklama görür.
2. **Given** takip açıklaması üretilemez, **When** istek başarısız olur, **Then** kullanıcı dostu hata mesajı görür ve önceki çözüm kaybolmaz.

---

### User Story 3 - Onboarding + sınav türü (Priority: P2)

İlk açılışta 3 ekranlı onboarding (moodboard): (1) fotoğrafla çöz, (2) adım adım anlatır, (3) “Hangi sınava hazırlanıyorsun?” — **LGS, YGS, KPSS ve Ehliyet seçilebilir ve aktiftir**. Yaşa uygun KVKK/veli onayı: özellikle LGS / reşit olmayan kullanıcılar için; yetişkin KPSS/YGS/Ehliyet adaylarında standart aydınlatma + onay.

**Why this priority**: Çoklu sınav konumlandırmasını ve güven algısını ilk dakikada kurar.

**Independent Test**: Yeni kullanıcı LGS, YGS, KPSS veya Ehliyet seçerek Ana Sayfa’ya ulaşabilir; dört seçenek de disabled değildir.

**Acceptance Scenarios**:

1. **Given** ilk açılış, **When** kullanıcı 3 onboarding adımını tamamlar ve **LGS** seçer, **Then** Ana Sayfa’ya yönlendirilir ve profilinde `examType=lgs` görünür.
2. **Given** sınav seçim ekranı, **When** **YGS** seçer, **Then** Ana Sayfa’ya ilerler (`examType=ygs`); “yakında” engeli yoktur.
3. **Given** sınav seçim ekranı, **When** **KPSS** seçer, **Then** Ana Sayfa’ya ilerler (`examType=kpss`); “yakında” engeli yoktur.
4. **Given** sınav seçim ekranı, **When** **Ehliyet** seçer, **Then** Ana Sayfa’ya ilerler (`examType=trafik`); “yakında” engeli yoktur.

---

### User Story 4 - Ana sayfa, geçmiş ve tab bar (Priority: P2)

Ana sayfada büyük turuncu “Fotoğraf Çek” CTA, streak göstergesi ve son çözülenler vardır (moodboard). Alt tab bar: **Ana Sayfa / Geçmiş / İstatistik / Profil**. Geçmiş ders/konu ile filtrelenir.

**Why this priority**: Günlük kullanım iskeleti.

**Independent Test**: Kullanıcı tab’lar arası gezer; geçmişte ders/konu filtresi çalışır.

**Acceptance Scenarios**:

1. **Given** giriş yapmış kullanıcı, **When** Ana Sayfa’yı açar, **Then** Fotoğraf Çek CTA, streak ve son sorular görünür.
2. **Given** en az bir çözülmüş soru, **When** Geçmiş’te ders veya konu filtresi uygular, **Then** yalnızca eşleşen kayıtlar listelenir.

---

### User Story 5 - İlerleme, zayıflık haritası ve streak (Priority: P2)

Kullanıcı İstatistik sekmesinde konu/ders bazlı ilerleme (bar), zayıf alan önerisi ve streak görür. Sinyaller seçilen sınavın konu kataloğuna göre gruplanır.

**Why this priority**: “Eksiği kapatan arkadaş” konumlandırmasının MVP iskeleti.

**Independent Test**: Birkaç çözülmüş/etiketli sorudan sonra İstatistik ekranında bar’lar ve streak güncellenir.

**Acceptance Scenarios**:

1. **Given** birden fazla konuya etiketlenmiş soru, **When** İstatistik açılır, **Then** ders/konu bazlı görünüm ve zayıf alan önerisi görünür.
2. **Given** kullanıcı ardışık günlerde en az bir soru çözer, **When** Ana Sayfa veya İstatistik’e bakar, **Then** streak artmış görünür.
3. **Given** bir gün aktivite yok, **When** ertesi gün uygulamayı açar, **Then** streak kurallarına göre sıfırlanır veya korunur (kural tutarlı).

---

### User Story 6 - Freemium hak ve paywall (Priority: P2)

Ücretsiz kullanıcı günde sınırlı soru hakkına sahiptir (varsayılan **5**/gün). Hak bitince paywall (moodboard Premium): sınırsız soru, reklamsız, kişisel AI analizi vb.; CTA “Hemen Başla”; planlar: **14,90 TL / 7 gün** giriş, **39 TL / ay**, **320 TL / yıl** (bkz. `docs/product/pricing-policy.md` — SSoT). Ücretsiz modda reklamlar `docs/product/ads-policy.md` matrisine göre (banner tab’larda; günde ≤1 interstitial çözüm çıkışında 3+ çözümeden sonra; ödüllü reklam paywall’da +1 hak, zorunlu değil). Premium’un **üç planında da** reklam kapalı.

**Why this priority**: Gelir modeli MVP’de görünür olmalı.

**Independent Test**: Hak bitince paywall açılır; abonelik sonrası yeni soru çözülebilir (sandbox).

**Acceptance Scenarios**:

1. **Given** ücretsiz kullanıcı günlük hakkını bitirmiş, **When** yeni soru göndermeye çalışır, **Then** paywall görür ve çözüm üretilmez.
2. **Given** aktif abonelik, **When** soru çözer, **Then** günlük ücretsiz limit uygulanmaz.

---

### User Story 7 - Profil, güvenlik sınırları ve hesap (Priority: P3)

Profil’de hesap, seçili sınav türü (değiştirilebilir), kalan hak, çıkış ve veri silme talebi girişi vardır. Rate limit ve yüksek geçersiz-görsel oranında geçici kısıtlama; nötr mesaj dili.

**Why this priority**: Kötüye kullanım ve çocuk/genç kullanıcı koruması.

**Independent Test**: Rate limit ve kısıtlama senaryoları QA checklist ile doğrulanır.

**Acceptance Scenarios**:

1. **Given** kullanıcı saatlik/günlük istek limitini aşar, **When** yeni istek yollar, **Then** beklemesi gerektiğini belirten net mesaj alır.
2. **Given** geçersiz görsel oranı eşiği aşılır, **When** tekrar dener, **Then** geçici kısıtlama ve nötr açıklama gösterilir.
3. **Given** profilde sınav türü, **When** LGS→YGS değiştirir, **Then** yeni çözümlere YGS prompt/katalog uygulanır (geçmiş kayıtlar korunur).

---

### Edge Cases

- Bulanık / kısmi soru fotoğrafı → nazik yeniden çekim; hak düşülmez.
- Diyagram-ağır geometri → MVP’de mümkünse metin adımları; kod-tabanlı şekil çizimi yoksa “şekil çizimi henüz desteklenmiyor” notu (moodboard kamera görseli referans; render 1.2).
- Ağ yok / AI zaman aşımı → yeniden dene.
- %100 doğruluk vaadi yok; şeffaflık notu zorunlu.
- Reşit olmayan LGS kullanıcısı → veli onayı akışı; yetişkin KPSS → standart onay.
- Marka adı değişirse → tek kaynaktan güncelle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Kullanıcı soru görseli çekebilmeli veya galeriden seçebilmeli.
- **FR-002**: Sistem görseli çözüm motoruna göndermeden önce uygunsuz içerik kontrolünden geçirmeli; şüpheli içerikte nötr red mesajı göstermeli.
- **FR-003**: Sistem daha önce çözülmüş aynı/çok benzer soruyu tespit ederse kayıtlı çözümü döndürebilmeli.
- **FR-004**: Desteklenen sorular için adım adım, sade Türkçe çözüm üretmeli; prompt ve konu etiketi kullanıcının `examType` değerine göre seçilmeli (MVP öncelik: matematik; ikinci: Türkçe).
- **FR-005**: Her soruyu ilgili sınavın müfredat/konu listesinden bir konuya etiketlemeli (statik veri; sınav bazlı katalog).
- **FR-006**: Soru değilse çözüm üretmemeli ve ücretsiz hakkı düşmemeli.
- **FR-007**: Her çözümde “AI tarafından üretilmiştir, kontrol etmeni öneririz” şeffaflık notu gösterilmeli.
- **FR-008**: “Anlamadım, tekrar açıkla” ile aynı bağlamda ek açıklama istenebilmeli.
- **FR-009**: Soru, çözüm, konu etiketi, examType ve anlamadım etkileşimleri kalıcı kaydedilmeli.
- **FR-010**: Soru geçmişi ders/konu filtresiyle listelenebilmeli.
- **FR-011**: Konu/ders bazlı ilerleme ve zayıf alan önerisi sunulmalı.
- **FR-012**: Günlük/haftalık ilerleme görünümü ve streak sunulmalı.
- **FR-013**: 3 adımlı onboarding + **LGS, YGS, KPSS, Ehliyet (`trafik`)** aktif sınav seçimi sunulmalı (hiçbiri disabled/yakında değil).
- **FR-014**: Freemium günlük ücretsiz soru hakkı (varsayılan 5) ve paywall/abonelik ekranı sunulmalı.
- **FR-014b**: Ücretsiz reklamlar ads-policy matrisine uymalı; Premium (hafta/ay/yıl) reklamsız olmalı; çözüm okuma yüzeyinde reklam gösterilmemeli.
- **FR-015**: Kullanıcı bazlı rate limiting ve yüksek geçersiz-görsel oranında geçici kısıtlama uygulanmalı.
- **FR-016**: Alt navigasyon Ana Sayfa / Geçmiş / İstatistik / Profil olmalı (moodboard).
- **FR-017**: Yaşa/sınava uygun KVKK onayı akışı MVP’de tasarlanmalı (yasal metin danışman onayı bekleyebilir).
- **FR-018**: Reddedilen görseller için utandırıcı olmayan, nötr mesaj dili kullanılmalı.
- **FR-019**: Analiz/yükleme durumunda moodboard’daki robot maskot + “Sorun analiz ediliyor…” durumu gösterilmeli.
- **FR-020**: UI renkleri ve tipografi moodboard token’larına uymalı (navy `#1E1B4B`, orange `#F59E0B`, Poppins).

### In-scope content (MVP 1.0)

- **Mini özgün item bank** (~50–60 madde): LGS / YGS (LYS hattı) / KPSS / Ehliyet tarzında
  soru + cevap anahtarı + adım adım anlatım. Telifli kitapçık/PDF/dershane içeriği
  kullanılmaz; tarz kalibrasyonu + sıfırdan üretim.
  Mimari: `docs/architecture/item-bank.md` · veri: `content/item-bank/`.

### Non-Goals (MVP 1.0 dışı)

- Veli hesabı ve haftalık otomatik veli raporu (1.1)
- Rozet/madalya / ileri gamification (1.1)
- Tam pratik session / zayıf konudan otomatik soru akışı (1.2; banka büyütülerek)
- Binlerce maddelik ticari soru bankası görünümü (post–1.0 büyüme)
- Kod-tabanlı geometri diyagram render (1.2)
- Spaced repetition (1.2)
- Self-consistency ile çift çözüm doğrulama (1.2+)
- iOS birincil lansman (Android-first)

### Key Entities

- **StudentAccount** (User): Kimlik, examType (`lgs`|`ygs`|`kpss`|`trafik`), yaş/onay, streak, kota, abonelik.
- **QuestionAttempt**: Görsel, durum, konu, examType, zaman.
- **Solution**: Adımlı açıklama, şeffaflık, önbellek anahtarı.
- **FollowUpExplanation**: Anlamadım isteği ve ek açıklama.
- **Topic**: Statik katalog; `examType` + subject ile kapsamlı.
- **ProgressSnapshot**: Konu bazlı zayıflık ve zaman serisi.
- **SubscriptionEntitlement**: Plan durumu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desteklenen örnek matematik sorularında kullanıcıların ≥80%’i ilk denemede adımlı çözüm ekranına 60 saniye içinde ulaşır (lab/dogfood).
- **SC-002**: Uygunsuz görsel senaryolarında %100 nazik red; ücretsiz hak düşmez.
- **SC-003**: Onboarding’de LGS, YGS, KPSS ve Ehliyet seçen test kullanıcılarının her biri Ana Sayfa’ya ulaşır (dört yol da yeşil).
- **SC-004**: En az 10 çözülmüş sorusu olan test hesabında İstatistik en zayıf alanı tutarlı gösterir.
- **SC-005**: Ücretsiz kota bitince %100 paywall engeli; abonelik sonrası çözüm yolu açılır (sandbox).
- **SC-006**: Lansman mesajlaşması LGS+YGS+KPSS+Ehliyet kapsamını doğru yansıtır; “yalnız LGS” veya “yalnız 3 sınav” iddiası taşımaz.

## Assumptions

- Working brand **ÇözBil**; mağaza/alan adı owner doğrulaması bekler.
- Ücretsiz günlük hak **5**; Premium: haftalık giriş **14,90 TL**, aylık **39 TL**, yıllık **320 TL** (`docs/product/pricing-policy.md`).
- Moodboard: `docs/design/moodboard/cozbil-mvp-moodboard.png` (+ README).
- “YGS” ürün etiketi owner kararıdır (resmi ad YKS ile aynı aile).
- Ehliyet ürün etiketi; runtime `examType=trafik`.
- Google Startup Kredisi AI maliyetini sübvanse edebilir.
- Hukuki KVKK danışmanlığı agent kapsamı dışındadır.
- Dedup: pHash; eşik research’te.
- MVP konu kataloğu: her sınav için matematik-öncelikli iskelet (Ehliyet: trafik/araç/ilk yardım); YGS/KPSS katalogları LGS’ten ayrı dosyalarda genişletilir.
- Mini item bank 1.0 DoD parçasıdır; sonraki sürümlerde aynı şema ile büyütülür.
