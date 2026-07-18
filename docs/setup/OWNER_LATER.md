# Owner — sonraya bırakılan kurulumlar

Ürün ve uygulama iskeleti **API kredisi olmadan** ilerleyebilir.
Aşağıdakiler canlı AI / production için; şu an zorunlu değil.

## Şimdi gerekmez (demo AI)

| İş | Ne zaman |
|----|----------|
| Google Startup / Gemini kredisi | Canlı çözüm kalitesi istenince |
| `GEMINI_API_KEY` | Live AI mode |
| `GOOGLE_CLOUD_VISION_API_KEY` | Gerçek SafeSearch |
| Firebase / GCP proje bağlama | Emulator dışı dogfood / store |
| Play Billing / abonelik hesabı | Paywall canlı test |
| KVKK hukuki metin danışmanı | Store öncesi |
| Final marka / domain | Lansman |

## Varsayılan çalışma

- `GEMINI_API_KEY` yoksa → **demo AI** (stub adımlı çözüm)
- Vision key yoksa → SafeSearch “temiz” kabul (dev)
- Zorla demo: `COZBIL_DEMO_AI=1`
- Live’a geç: key’leri `.env` / Functions config’e koy, `COZBIL_DEMO_AI=0`

## Şimdi yapılabilenler (kredi yok)

- US2 explainAgain, US3 onboarding, geçmiş, istatistik, paywall UI
- Emulator ile auth / Firestore / Storage akışları
- UI / moodboard / testler

`ping` cevabındaki `aiMode: "demo" | "live"` ile mevcut modu kontrol et.
