# Dogfood solve proxy (org-policy bypass)

When Cloud Functions callable returns 403 and Firestore/Storage triggers are
not deployed, the mobile app can call this proxy:

1. Prefer `imageBase64` from the phone (fallback: Storage download URL)  
2. Google Cloud Vision OCR  
3. Score subject candidates (math vs Türkçe / sözel / …) + `confidence` / `needsConfirm`  
4. Math → arithmetic steps; Türkçe → verbal steps (e.g. anlatım biçimi → öyküleme)  
5. Mobile: if `needsConfirm` (or subject unknown), **Ders hangisi?** sheet before result — never silent Matematik default  

If OCR/parse fails, soft-fallback keeps detected subject when known; otherwise `unknown` + confirm sheet.

## Run (cloud / Mac)

```bash
export GOOGLE_CLOUD_VISION_API_KEY=...
node scripts/solve-proxy/server.mjs
# expose (prefer cloudflared — localtunnel interstitial breaks JSON):
cloudflared tunnel --url http://127.0.0.1:8787
```

Then in `apps/mobile/.env` (gitignored):

```
EXPO_PUBLIC_SOLVE_PROXY_URL=https://your-tunnel.trycloudflare.com
```

Restart Metro so the env is picked up.

Unit check: `node scripts/solve-proxy/arithSolve.test.mjs`
