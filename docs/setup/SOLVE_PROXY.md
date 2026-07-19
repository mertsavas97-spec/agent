# Dogfood solve proxy (org-policy bypass)

When Cloud Functions callable returns 403 and Firestore/Storage triggers are
not deployed, the mobile app can call this proxy:

1. Fetch image from Firebase Storage download URL  
2. Google Cloud Vision OCR  
3. Deterministic arithmetic evaluation + Turkish steps  

## Run (cloud / Mac)

```bash
export GOOGLE_CLOUD_VISION_API_KEY=...
node scripts/solve-proxy/server.mjs
# expose:
npx localtunnel --port 8787
```

Then in `apps/mobile/.env` (gitignored):

```
EXPO_PUBLIC_SOLVE_PROXY_URL=https://your-tunnel.loca.lt
```

Restart Metro so the env is picked up.
