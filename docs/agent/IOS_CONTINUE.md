# Cursor Mobile / Cloud Agents — devam rehberi

Sohbet geçmişi telefona taşınmaz. **Kaynak gerçek: GitHub repo**  
`https://github.com/mertsavas97-spec/agent`

## Telefonda nasıl açılır

### iPhone (Cursor app)
1. [App Store — Cursor](https://apps.apple.com/app/cursor/id6767085653) (iOS 26+ beta)
2. **Aynı Cursor hesabı** (Pro+) ile giriş
3. Repo seç: **`mertsavas97-spec/agent`**
4. Branch: `main` veya aktif feature branch (ör. `cursor/mvp-10-launch-audit-9131`)
5. Cloud Agent başlat → diff / PR incele

### Android
Native app yok → Chrome’da [cursor.com/agents](https://cursor.com/agents) → Install App (PWA)

## Desktop’ta bir kez (zorunlu)

1. [cursor.com/dashboard](https://cursor.com/dashboard) → **Integrations → GitHub**  
   → `mertsavas97-spec/agent` erişimi (read-write)
2. [cursor.com/agents](https://cursor.com/agents) → repo listesinde görünmeli
3. Cloud Agents → Environment: bu repo için snapshot / secrets (isteğe bağlı)  
   Repo’da `.cursor/environment.json` var (`apps/mobile` + `functions` + `solve-proxy` npm install)
4. Privacy Mode (Legacy) kapalı olmalı — Cloud Agents için

## Mac Metro / fiziksel telefon

Cloud Agent **Mac Metro’ya veya USB telefona bağlanamaz.**  
Cihaz dogfood için:

- Desktop Cursor’da çalış, **veya**
- **Remote Control** (Cursor ≥ 3.9.8, Mac uyanık) — Agents → Remote Control

## Secrets (chat’e yapıştırma)

Cloud dashboard Secrets’a koy (örnek isimler):

| Secret | Ne için |
|--------|---------|
| `EXPO_PUBLIC_FIREBASE_*` | Mobile Firebase (public) |
| `GOOGLE_CLOUD_VISION_API_KEY` | OCR proxy / Functions |
| `GEMINI_API_KEY` | Kullanma — AI Studio prepaid bitmiş olabilir |
| `COZBIL_USE_VERTEX` | Functions’ta `1` (Startup/billing) |

## İlk mesaj (telefondan)

```
@koordinatör devam

Oku: SPRINT_STATE.md, docs/agent/IOS_CONTINUE.md, AGENTS.md

Cloud Agent’sın. Lokal Metro/device yok — JS/docs/functions/proxy testleri yap.
Push + PR aç. Force push / store submit yok.
```

## Dokunma

- Chat’e API key yapıştırma  
- Force push / Play-App Store submit yok  
- `.env` dosyalarını commit etme
