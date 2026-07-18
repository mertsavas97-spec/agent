# Feature Specification: ÇözBil MVP 1.0

**Feature Branch**: `002-cozbil-mvp`

**Created**: 2026-07-18

**Status**: Draft → Clarified (defaults encoded)

**Input**: Owner product brief — LGS-focused AI photo question solver for Türkiye, Android-first MVP 1.0.

**Depends on**: `specs/001-product-definition/` (Locked)

## Positioning

Türkiye’nin sadece LGS’ye özel AI çalışma arkadaşı — fotoğrafla çözer, adım adım Türkçe anlatır, konu eksiğini öğrenciye gösterir. Veliye otomatik rapor 1.1 fazına ertelenir; konumlandırma dilinde vaat olarak tutulabilir ama MVP’de teslim edilmez.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fotoğrafla soru çöz (Priority: P1) 🎯 MVP Core

Öğrenci takıldığı LGS sorusunun fotoğrafını çeker veya galeriden seçer; uygulama adım adım, sade Türkçe bir çözüm gösterir. Çözümün altında AI şeffaflık notu vardır. Desteklenmeyen soru tipi (ör. diyagram/geometri) nazikçe reddedilir; geçersiz/uygunsuz görselde nötr uyarı verilir ve ücretsiz hakkından düşülmez.

**Why this priority**: Ürünün ana değeri; olmadan diğer özellikler anlamsız.

**Independent Test**: Test öğrencisi metin/işlem ağırlıklı bir matematik sorusu fotoğrafıyla uçtan uca çözüm alır; geometri ve uygunsuz görsel senaryoları ayrı doğrulanır.

**Acceptance Scenarios**:

1. **Given** giriş yapmış bir öğrenci ve kalan ücretsiz/abonelik hakkı, **When** net bir metin/işlem sorusu fotoğrafı gönderir, **Then** numaralı adımlar halinde Türkçe çözüm görür ve şeffaflık notunu okuyabilir.
2. **Given** öğrenci bir görsel gönderir, **When** sistem soru olmadığını veya desteklenmeyen tipi tespit eder, **Then** nazik bir mesaj görür ve günlük ücretsiz hakkı azalmaz.
3. **Given** görsel uygunsuz içerik filtresine takılır, **When** yükleme tamamlanır, **Then** Gemini’ye gitmeden nötr red mesajı gösterilir (“Bu görselde bir soru tespit edemedik…”) ve hak düşülmez.
4. **Given** aynı soru daha önce çözülmüş ve önbellekte varsa, **When** öğrenci yeniden gönderir, **Then** kayıtlı çözüm hızlıca döner (kullanıcı deneyimi bozulmaz).

---

### User Story 2 - Anlamadım, tekrar açıkla (Priority: P1)

Öğrenci çözümü anlamadığında tek dokunuşla aynı soru bağlamında daha sade bir yeniden açıklama ister.

**Why this priority**: “Öğretmen gibi anlat” vaadinin minimum hali; rakiplerden farklılaşma için kritik.

**Independent Test**: Bir çözüm ekranından “Anlamadım, tekrar açıkla” ile ikinci açıklama alınır; geçmişte her iki etkileşim de görünür.

**Acceptance Scenarios**:

1. **Given** bir çözüm sonucu ekranı açık, **When** öğrenci “Anlamadım, tekrar açıkla”ya basar, **Then** aynı soru bağlamında ek/basitleştirilmiş açıklama görür.
2. **Given** takip açıklaması üretilemez, **When** istek başarısız olur, **Then** kullanıcı dostu hata mesajı görür ve önceki çözüm kaybolmaz.

---

### User Story 3 - Onboarding + sınav türü (Priority: P2)

İlk açılışta 3 ekranlı onboarding: (1) fotoğrafla çöz, (2) adım adım anlatır, (3) sınav türü — yalnızca LGS aktif; YKS/KPSS “yakında” gösterilir. KVKK/veli onayı için yaşa uygun onay adımı tasarlanır (hukuki metin danışmanla finalize edilecek).

**Why this priority**: Segment kilidini (yalnız LGS) ve güven algısını ilk dakikada kurar.

**Independent Test**: Yeni kullanıcı onboarding’i tamamlayıp Ana Sayfa’ya ulaşır; YKS/KPSS seçilemez.

**Acceptance Scenarios**:

1. **Given** ilk açılış, **When** kullanıcı 3 onboarding adımını tamamlar ve LGS seçer, **Then** Ana Sayfa’ya yönlendirilir.
2. **Given** sınav seçim ekranı, **When** YKS veya KPSS’ye dokunur, **Then** “yakında” durumu gösterilir ve ilerlenemez.

---

### User Story 4 - Ana sayfa, geçmiş ve tab bar (Priority: P2)

Ana sayfada büyük “Fotoğraf Çek” eylemi, streak göstergesi ve son çözülenler listesi vardır. Alt tab bar: Ana Sayfa / Geçmiş / İlerleme / Profil. Geçmiş ders/konu ile filtrelenir.

**Why this priority**: Günlük kullanım iskeleti; çözümü tekrar bulmayı sağlar.

**Independent Test**: Kullanıcı tab’lar arası gezer; geçmişte ders/konu filtresi çalışır.

**Acceptance Scenarios**:

1. **Given** giriş yapmış kullanıcı, **When** Ana Sayfa’yı açar, **Then** Fotoğraf Çek CTA, streak ve son sorular görünür.
2. **Given** en az bir çözülmüş soru, **When** Geçmiş’te ders veya konu filtresi uygular, **Then** yalnızca eşleşen kayıtlar listelenir.

---

### User Story 5 - İlerleme, zayıflık haritası ve streak (Priority: P2)

Öğrenci konu bazlı basit zayıflık görünümü (bar/ısı), günlük-haftalık ilerleme ve streak görür. “En zayıf konun” önerisi gösterilir. Hata deseni sinyali “anlamadım” etkileşimlerinden türetilir (basit etiketleme).

**Why this priority**: “Eksiği kapatan arkadaş” konumlandırmasının MVP iskeleti; veli raporuna veri zemini.

**Independent Test**: Birkaç çözülmüş/etiketli sorudan sonra İlerleme ekranında konu bar’ları ve streak doğru güncellenir.

**Acceptance Scenarios**:

1. **Given** birden fazla konuya etiketlenmiş soru, **When** İlerleme açılır, **Then** konu bazlı görünüm ve en zayıf konu önerisi görünür.
2. **Given** öğrenci ardışık günlerde en az bir soru çözer, **When** Ana Sayfa veya İlerleme’ye bakar, **Then** streak sayısı artmış görünür.
3. **Given** bir gün aktivite yok, **When** ertesi gün uygulamayı açar, **Then** streak kurallarına göre sıfırlanır veya korunur (kural tutarlı ve görünür).

---

### User Story 6 - Freemium hak ve paywall (Priority: P2)

Ücretsiz kullanıcı günde sınırlı soru hakkına sahiptir (varsayılan **5**/gün). Hak bitince paywall gösterilir: tek plan vurgulu, net faydalar (“sınırsız soru” vb.), aylık fiyat bandı **49 TL** (39–59 aralığında başlangıç varsayımı). Abone sınırsız (veya yüksek limitli) çözüme geçer.

**Why this priority**: Gelir modeli MVP’de görünür olmalı; Play faturalama detayı implementasyonda.

**Independent Test**: Hak bitince paywall açılır; abonelik sonrası yeni soru çözülebilir (sandbox/test hesabı).

**Acceptance Scenarios**:

1. **Given** ücretsiz kullanıcı günlük hakkını bitirmiş, **When** yeni soru göndermeye çalışır, **Then** paywall görür ve çözüm üretilmez.
2. **Given** aktif abonelik, **When** soru çözer, **Then** günlük ücretsiz limit uygulanmaz.

---

### User Story 7 - Profil, güvenlik sınırları ve hesap (Priority: P3)

Profil’de hesap bilgisi, kalan hak, çıkış ve (mümkünse) veri silme talebi girişi vardır. Kullanıcı bazlı istek limiti ve yüksek “geçersiz görsel” oranında geçici kısıtlama uygulanır; mesaj dili utandırıcı değildir.

**Why this priority**: Çocuk kitlesi ve kötüye kullanım için zorunlu koruma; tam hukuk metni dış bağımlılık.

**Independent Test**: Rate limit ve tekrarlayan geçersiz görsel senaryoları QA checklist ile doğrulanır.

**Acceptance Scenarios**:

1. **Given** kullanıcı saatlik/günlük istek limitini aşar, **When** yeni istek yollar, **Then** beklemesi gerektiğini belirten net mesaj alır.
2. **Given** geçersiz görsel oranı eşiği aşılır, **When** tekrar dener, **Then** geçici kısıtlama uygulanır ve nötr açıklama gösterilir.

---

### Edge Cases

- Bulanık / kısmi soru fotoğrafı → nazik yeniden çekim isteği; hak düşülmez.
- El yazısı okunamaz → “daha net fotoğraf” mesajı; mümkünse kısmi çözüm yok.
- Diyagram/geometri → “bu soru tipi henüz desteklenmiyor”.
- Ağ yok / AI zaman aşımı → önceki ekran korunur, yeniden dene.
- Çözüm yanlış hissedilirse → şeffaflık notu + (ileride) geri bildirim; %100 doğruluk vaadi yok.
- Aynı hesapta birden fazla cihaz → tek kullanıcı kotası paylaşılır.
- Marka adı değişirse → UI metinleri tek kaynaktan güncellenir.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Öğrenci soru görseli çekebilmeli veya galeriden seçebilmeli.
- **FR-002**: Sistem görseli çözüm motoruna göndermeden önce uygunsuz içerik kontrolünden geçirmeli; şüpheli içerikte nötr red mesajı göstermeli.
- **FR-003**: Sistem daha önce çözülmüş aynı/çok benzer soruyu tespit ederse kayıtlı çözümü döndürebilmeli.
- **FR-004**: Desteklenen sorular için adım adım, sade Türkçe çözüm üretmeli (MVP öncelik: matematik; ikinci: LGS Türkçe metin/işlem).
- **FR-005**: Her soruyu MEB/LGS müfredat konu listesinden bir konuya etiketlemeli (statik konu verisi).
- **FR-006**: Soru değilse veya desteklenmeyen tipte (diyagram/geometri) çözüm üretmemeli ve ücretsiz hakkı düşmemeli.
- **FR-007**: Her çözümde “AI tarafından üretilmiştir, kontrol etmeni öneririz” şeffaflık notu gösterilmeli.
- **FR-008**: “Anlamadım, tekrar açıkla” ile aynı bağlamda ek açıklama istenebilmeli.
- **FR-009**: Soru, çözüm, konu etiketi ve anlamadım etkileşimleri kalıcı kaydedilmeli.
- **FR-010**: Soru geçmişi ders/konu filtresiyle listelenebilmeli.
- **FR-011**: Konu bazlı basit zayıflık görünümü ve en zayıf konu önerisi sunulmalı.
- **FR-012**: Günlük/haftalık ilerleme görünümü ve streak sunulmalı.
- **FR-013**: 3 adımlı onboarding + yalnızca LGS aktif sınav seçimi sunulmalı.
- **FR-014**: Freemium günlük ücretsiz soru hakkı (varsayılan 5) ve paywall/abonelik ekranı sunulmalı.
- **FR-015**: Kullanıcı bazlı rate limiting ve yüksek geçersiz-görsel oranında geçici kısıtlama uygulanmalı.
- **FR-016**: Alt navigasyon Ana Sayfa / Geçmiş / İlerleme / Profil olmalı.
- **FR-017**: Yaşa uygun KVKK/veli onayı akışı MVP’de tasarlanmalı (yasal metin danışman onayı bekleyebilir; akış ve veri saklama/silme noktaları ürün gereksinimidir).
- **FR-018**: Reddedilen görseller için utandırıcı olmayan, nötr mesaj dili kullanılmalı.

### Non-Goals (MVP 1.0 dışı)

- Veli hesabı ve haftalık otomatik veli raporu (1.1)
- Rozet/madalya / ileri gamification (1.1)
- AI özgün soru üretimi + pratik session (1.2)
- Geometri diyagram render (1.2)
- Spaced repetition (1.2)
- Self-consistency ile çift çözüm doğrulama (1.2+)
- iOS birincil lansman (Android-first; iOS sonra)

### Key Entities

- **StudentAccount**: Kimlik, yaş/onay durumu, streak, kota, abonelik durumu.
- **QuestionAttempt**: Görsel referansı, durum (moderated/rejected/solved/unsupported), konu etiketi, zaman.
- **Solution**: Adımlı açıklama metni, şeffaflık bayrağı, önbellek anahtarı.
- **FollowUpExplanation**: Anlamadım isteği ve ek açıklama.
- **Topic**: Statik LGS/MEB konu kataloğu girdisi.
- **ProgressSnapshot**: Konu bazlı zayıflık ve zaman serisi özeti.
- **SubscriptionEntitlement**: Plan, yenileme, aktif/pasif.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desteklenen örnek matematik sorularında öğrencinin ≥80%’i ilk denemede adımlı bir çözüm ekranına 60 saniye içinde ulaşır (lab/usability veya dogfood).
- **SC-002**: Geometri/diyagram ve uygunsuz görsel senaryolarında %100 nazik red; ücretsiz hak düşmez.
- **SC-003**: Onboarding’i başlatan yeni kullanıcıların ≥70%’i LGS seçip Ana Sayfa’ya ulaşır (iç test kohortu).
- **SC-004**: En az 10 çözülmüş sorusu olan test hesabında İlerleme ekranı en zayıf konuyu tutarlı gösterir (manuel QA).
- **SC-005**: Ücretsiz kota bitince %100 paywall engeli; abonelik sonrası çözüm yolu açılır (sandbox).
- **SC-006**: Lansman mesajlaşması “yalnız LGS” ve “adım adım Türkçe” vaadini tutar; genel “her ders soru çözücü” konumuna kaymaz (ASO/metin review).

## Assumptions

- Working brand **ÇözBil**; mağaza/alan adı müsaitliği owner tarafından doğrulanacak.
- Ücretsiz günlük hak **5**; aylık plan vitrin fiyatı **49 TL** (Play fiyat lokalizasyonu sonra).
- Moodboard görseli bu oturumda eklenmedi; renk/ton brief’teki palet bağlayıcıdır (lacivert-mor ana, turuncu-sarı vurgu, açık gri zemin; kart tabanlı, sakin-enerjik).
- Google Startup Kredisi AI maliyetini MVP döneminde sübvanse eder; agresif ücretsiz kampanya pazarlama kararıdır, ürün kotasından bağımsız yönetilebilir.
- Hukuki KVKK danışmanlığı agent kapsamı dışındadır; akış iskeleti şart.
- Dedup için perceptual hash veya embedding benzerliği kabul edilebilir; kesin eşik plan/research’te seçilir.
