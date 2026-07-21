# Owner — sonraya bırakılan kurulumlar

Ürün US5’e kadar **API kredisi olmadan** ilerledi.
**Şimdi durak:** canlı AI için Google Cloud — adım adım rehber:

→ **[`GOOGLE_CLOUD_SETUP.md`](./GOOGLE_CLOUD_SETUP.md)**

## Kurulum zamanlaması

| İş | Ne zaman |
|----|----------|
| Google Cloud + Gemini + Vision + Firebase | **US5 sonrası (şimdi)** |
| Play Billing / abonelik hesabı | US6 paywall |
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
