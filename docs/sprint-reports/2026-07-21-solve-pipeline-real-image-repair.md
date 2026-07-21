# Sprint report — gerçek görsel çözüm pipeline onarımı (2026-07-21)

## Kök neden kanıtı

iPhone canlı Metro logu:

```text
solve: OCR proxy
solve proxy failed ... payload_too_large
solveViaFirestore unavailable ... SOLVE_TRIGGER_MISSING
```

Önceki QA, gerçek görsel yerine `ocrText` override kullandığı için fotoğraf
boyutu/base64, OCR ve trigger katmanlarını atlıyordu.

## Yapılan onarımlar

1. Kamera/galeri fotoğrafı proxy'ye base64 JSON yerine ham binary
   `/solve-image` ile gönderiliyor (10 MiB sınır).
2. Proxy başarılıysa Storage'a yükleme yapılmıyor; proxy başarısız/desteksizse
   Storage/Firestore upload **lazy** başlıyor. Duplicate trigger/kota işi yok.
3. Proxy yalnız `__DEV__` + URL + rotating token ile kullanılıyor. Sunucu
   `COZBIL_PROXY_DOGFOOD=1` ve token olmadan solve açmıyor.
4. Remote URL fallback yalnız Firebase Storage hostlarına izin veriyor;
   redirectler takip edilmeden doğrulanıyor; loopback varsayılan kapalı.
5. Tesseract görüntü ön işleme (Sharp), bounded queue, fraction-bar digit
   recovery ve OCR hata normalizasyonları eklendi.
6. `status=solved` sözleşmesinde structured `answer` zorunlu. Answerless
   cache/model/callable çıktıları solved sayılmıyor.
7. Generic `assisted solved` fallback kaldırıldı; altyapı hatası dürüst hata.
8. Exam guard raw response üzerinde isolation'dan önce çalışıyor. Otomatik
   ders tahmin sheet'i çözüm akışından kaldırıldı.
9. Loading: proxy 15 sn, pending trigger 15 sn, hard Firestore 60 sn;
   progress crawl 18 sn.
10. Kota, persist transaction'ında yeniden kontrol ediliyor; final free slot
    yarışla iki kez tüketilemiyor.

## Gerçek görsel E2E

Public token-auth binary tunnel (`/solve-image`), `ocrText` override yok:

| Sınav | Beklenen | Sonuç | Süre |
|---|---:|---:|---:|
| LGS | B / 3 | PASS | 4.17 sn |
| YGS | E / 9 | PASS | 1.52 sn |
| KPSS | A / 90 | PASS | 2.42 sn |
| Ehliyet | B / 50 | PASS | 1.49 sn |

## QA

- Root `npm run qa`: PASS
- Mobile: 57 suite / 177 test PASS
- Functions: 28 suite PASS
- Proxy: arithmetic/verbal/exam/policy/real-image/binary-server PASS
- Typecheck: PASS
- Lint: PASS script; ESLint henüz yapılandırılmamış (N/A)
- Production dependency audit: critical/high = 0
- Independent code review: APPROVE
- Architecture gate: CLEAR
- Guardian: PASS — LGS/YGS/KPSS/Ehliyet scope, nötr hata copy, abartılı
  doğruluk iddiası yok

## Operasyon sınırı

Dogfood proxy production yolu değildir. Production build proxy'yi kullanmaz;
SafeSearch/auth/kota korumalı Storage/Firestore Functions deploy'u zorunludur.

---
## Sprint Agent Raporu

**Koordinatör:** GPT-5.6 Sol  
**Kullanılan ekipler:** mobile, backend, QA, architect, guardian  
**Kullanılan skill/agent setleri:** focused-fix, tdd-guide, Spec Kit,
cozbil-team-skills, code-review, ship-gate, cozbil-guardian  
**Skill bypass:** Context7 MCP mevcut değildi; kurulu paket type declarations
ve upstream package API'si kullanıldı; native dependency eklenmedi  
**QA Gate:** typecheck PASS / lint N/A-config / smoke PASS / errors temiz /
guardian PASS  
**Sonraki önerilen adım:** Owner Mac'te Functions deploy; ardından aynı dört
görselle production Storage-trigger smoke.
