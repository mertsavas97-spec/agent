# Vertex AI + Startup kredisi (ÇözBil)

## Neden Vertex?

AI Studio API key → ayrı prepay cüzdanı (Startup çoğu zaman işlemez).  
**Vertex AI** → aynı Gemini modelleri, fatura **My Billing Account** + Startup.

## Proje

| | Değer |
|--|--------|
| Project ID | `cozbil-dev-f9583` |
| Billing | `01F6A9-B52CDE-B4D709` |
| Model | `gemini-2.5-flash` |
| Region | `us-central1` |

## Env (Functions)

```
COZBIL_USE_VERTEX=1
COZBIL_DEMO_AI=0
GCP_PROJECT_ID=cozbil-dev-f9583
VERTEX_LOCATION=us-central1
VERTEX_MODEL=gemini-2.5-flash
GOOGLE_CLOUD_VISION_API_KEY=...
```

Cloud Functions runtime ADC kullanır (SA key gerekmez).  
`roles/aiplatform.user` → `cozbil-vertex@…`, compute SA, firebase-adminsdk.

## Smoke (doğrulandı)

`gemini-2.5-flash` @ `us-central1` → HTTP 200 (owner gcloud oturumu).
