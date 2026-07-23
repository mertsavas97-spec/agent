# Sprint report — 2026-07-22 (99% hang / no result screen)

## Sprint Agent Raporu
**Koordinatör:** Auto (Composer)
**Kullanılan ekipler:** Executor + QA
**Kullanılan skill/agent setleri:** `cozbil-expo-mobile`, `cozbil-guardian`, `cozbil-team-skills`
**Skill bypass:** yok (Context7 N/A — native RN timeout pattern)
**QA Gate:** typecheck PASS / lint N/A (Phase 1 echo) / unit solve* 21 PASS / proxy fixture E2E solved B=3 in ~2.6s / Metro Serveo bundle 200 (~12MB) / guardian: no exam/copy drift
**Sonraki önerilen adım:** Telefonu **yeni Serveo deep link** ile açıp JS reload; net LGS kesir fotoğrafı ile doğrula. Bulanık foto → “Bu görsel işlenemedi” (99% sonsuz değil).

## Net teşhis (neden 99%’de kalıyordu)

1. **Kod:** Proxy `unsupported_type` (çöp OCR) dönünce client **Firebase Storage upload**’a düşüyordu. Functions org-policy ile ölü; `uploadBytes` telefon ağında **asılı kalabiliyor** → AnalyzingView crawl 0.99’da **sonsuz**.
2. **RN:** `AbortController.abort()` büyük body upload’ta çoğu zaman **iptal etmiyor** → soft timeout yetmiyordu.
3. **Ops:** Telefondaki Metro URL `loca.lt` **502** idi; Serveo Metro ayaktaydı. Native build sorunu değil — **eski/ölü tunnel + hang path**.

## Kalıcı düzeltmeler

- Terminal proxy (`unsupported_type` / `rejected_*`) → **hemen** `rejected_not_question` UI; Storage’a düşmez.
- `withHardTimeout` (Promise.race) proxy + Storage + Firestore + **solve.tsx UI settle 65s**.
- Proxy retry yalnızca boş **408** için, tek bütçe içinde (2×55s stack yok).
- Metro connect → Serveo (ölü loca.lt değil).

## Telefon adımı (zorunlu)

```
exp+cozbil://expo-development-client/?url=https%3A%2F%2F065e15ecaafdbbf8-107-21-235-172.serveousercontent.com
```

Uygulamayı tamamen kapat → deep link → reload → net foto dene.
