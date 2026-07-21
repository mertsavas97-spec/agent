# Sprint report — solve pipeline root cause (2026-07-21)

## Kullanıcı semptomu

Telefon ekranlarında **"Tam otomatik cevap yok"** + jenerik "Soruyu oku / İşlemi kur"
adımları. LGS kesir ve YGS denklem fotoğrafları net; KPSS/Ehliyet aynı.

Bu UI, canlı Vertex/Functions cevabı **değil** — `buildLocalSolveFallback`
(`assisted: true`).

## Neden devam etti?

1. **`EXPO_PUBLIC_SOLVE_PROXY_URL` yoktu** → dogfood OCR proxy hiç çağrılmıyordu.
2. Firebase Storage/Firestore tetikleyicisi bu ortamda cevap yazmıyor (callable org-policy
   403; gcloud credential yok; Mac deploy şartı devam ediyor) → client timeout → lokal tip.
3. Önceki `answer` wiring / timeout PR’leri **UI’da cevap göstermeyi** iyileştirdi ama
   sunucu yanıtı gelmeyince yine fallback’e düşülüyordu.
4. Proxy çalışsa bile `arithSolve` **kelime kesir / denklem / yüzde zinciri** çözmüyordu;
   LGS metnini yanlış `24.3/8.1/3=1` diye yapıştırıyordu; YGS `NULL` dönüyordu.

YGS meta “Temel Kavramlar” = lokal `defaultTopicId(ygs, math)` imzası (OCR konu yok).

## Bu sprintte yapılanlar

| Alan | Değişiklik |
|------|------------|
| Solver | `tryFractionOfChain`, `tryLinearEquation`, `tryPercentChain` |
| Trafik | `kilometre` kelimesiyle hız kuralı eşleşmesi |
| Client | proxy `unsupported_type` → Firestore/Vertex dene, sonra tip fallback |
| Dogfood | solve-proxy + cloudflared; `.env` proxy URL; Metro `--clear` |
| Test | 4 fixture OCR → B/3, E/9, A/90, B/50 |

## Doğrulama (beklenen)

Telefon: yeni Metro URL ile bağlan → aynı 4 fixture → **assisted banner olmamalı**;
DOĞRU CEVAP = B/E/A/B.

Kalıcı Vertex yolu için Mac: `bash scripts/deploy-firestore-solve.sh`
