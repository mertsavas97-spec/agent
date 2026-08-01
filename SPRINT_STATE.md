# Sprint State

**Branch:** `cursor/home-polish-yks-ads-ocr-2914`  
**Hedef:** Phone dogfood Gemini = **Vertex AI** (GCP API key yolu kapalı)

## Bu tur

- [x] GCP API key → `API_KEY_INVALID` teşhisi
- [x] Proxy: Vertex + gcloud ADC
- [x] `write-vertex-solve-local.sh`
- [x] `write-gemini-api-key-local.sh` → Vertex redirect

## Owner Mac

```bash
cd ~/agent && git pull
bash scripts/write-vertex-solve-local.sh
# Beklenen: ✓ Vertex smoke OK

bash scripts/phone-demo-proxy-mac.sh
# Beklenen: Gemini Vision solve: AÇIK — Vertex smoke OK
# Log: solve-proxy gemini smoke OK

bash scripts/phone-dev-build.sh metro
```

Not: Cloud Console’da oluşturulan `AIza…` key’leri Generative Language’de
çalışmaz. AI Studio key istersen ayrı; dogfood için Vertex yeterli.
